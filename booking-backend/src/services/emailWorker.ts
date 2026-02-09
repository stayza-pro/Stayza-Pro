import os from "os";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { EmailJob } from "@prisma/client";
import { prisma } from "@/config/database";
import { config } from "@/config";
import { logger } from "@/utils/logger";

type EmailTemplate = {
  subject: string;
  html: string;
};

type QueueEmailInput = {
  to: string | string[];
  template: EmailTemplate;
  attachments?: any[];
  maxAttempts?: number;
};

type ProcessEmailJobResult =
  | {
      success: true;
      provider: string;
      messageId?: string;
    }
  | {
      success: false;
      reason: string;
    };

const WORKER_ID = `${os.hostname()}-${process.pid}`;
const MAX_BACKOFF_MS = 60 * 60 * 1000; // 1 hour cap
const BASE_BACKOFF_MS = 30 * 1000; // 30 seconds
const emailWorkerIntervalMs = Math.max(config.EMAIL_WORKER_INTERVAL_MS, 5000);
const emailWorkerBatchSize = Math.max(config.EMAIL_WORKER_BATCH_SIZE, 1);
const lockTimeoutMs = Math.max(config.EMAIL_WORKER_LOCK_TIMEOUT_MS, 30000);

const resendClient = config.RESEND_API_KEY
  ? new Resend(config.RESEND_API_KEY)
  : null;

let smtpTransporter: nodemailer.Transporter | null = null;
let workerTimer: ReturnType<typeof setInterval> | null = null;
let workerBusy = false;
let emailQueueTableMissingLogged = false;

type DeliverableEmail = {
  id: string;
  to: string[];
  subject: string;
  html: string;
  attachments?: any;
};

const normalizeRecipients = (to: string | string[]): string[] =>
  (Array.isArray(to) ? to : [to]).map((item) => String(item).trim()).filter(Boolean);

const sanitizeAttachments = (attachments?: any[]) => {
  if (!attachments || attachments.length === 0) return null;

  // Keep only fields needed by providers; JSON-safe for storage.
  return attachments.map((attachment) => ({
    filename: attachment?.filename,
    content: attachment?.content,
    path: attachment?.path,
    contentType: attachment?.contentType,
    cid: attachment?.cid,
  }));
};

const normalizeAttachmentContent = (content: any) => {
  if (content === undefined || content === null) return undefined;
  if (Buffer.isBuffer(content)) return content;

  if (
    typeof content === "object" &&
    content?.type === "Buffer" &&
    Array.isArray(content?.data)
  ) {
    return Buffer.from(content.data);
  }

  if (typeof content === "string") return content;

  return JSON.stringify(content);
};

const toSmtpAttachments = (attachments: any) => {
  if (!Array.isArray(attachments) || attachments.length === 0) {
    return undefined;
  }

  const normalized = attachments
    .map((attachment) => ({
      filename: attachment?.filename,
      path: attachment?.path,
      content: normalizeAttachmentContent(attachment?.content),
      contentType: attachment?.contentType,
      cid: attachment?.cid,
    }))
    .filter((attachment) => attachment.filename || attachment.path || attachment.content);

  return normalized.length > 0 ? normalized : undefined;
};

const getSmtpTransporter = () => {
  if (smtpTransporter) return smtpTransporter;

  smtpTransporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: config.SMTP_PORT,
    secure: config.SMTP_SECURE,
    auth:
      config.SMTP_USER && config.SMTP_PASS
        ? {
            user: config.SMTP_USER,
            pass: config.SMTP_PASS,
          }
        : undefined,
    requireTLS: config.SMTP_REQUIRE_TLS,
    connectionTimeout: config.SMTP_CONNECTION_TIMEOUT,
    tls: {
      rejectUnauthorized: config.SMTP_TLS_REJECT_UNAUTHORIZED,
    },
  });

  return smtpTransporter;
};

const hasSmtpConfig = () =>
  Boolean(config.SMTP_HOST && config.SMTP_PORT && config.SMTP_USER && config.SMTP_PASS);

const formatError = (error: any) => {
  if (!error) return "Unknown email error";
  if (typeof error === "string") return error;
  return error.message || JSON.stringify(error);
};

const isMissingEmailQueueTableError = (error: any) => {
  const message = String(error?.message || "").toLowerCase();
  return (
    error?.code === "P2021" ||
    message.includes("email_jobs") ||
    (message.includes("table") && message.includes("does not exist"))
  );
};

const sendViaResend = async (job: DeliverableEmail) => {
  if (!resendClient) {
    throw new Error("Resend is not configured");
  }

  const response = await resendClient.emails.send({
    from: config.EMAIL_FROM,
    to: job.to,
    subject: job.subject,
    html: job.html,
  } as any);

  const responseError = (response as any)?.error;
  if (responseError) {
    throw new Error(responseError.message || "Resend failed to send email");
  }

  return {
    provider: "RESEND",
    messageId: (response as any)?.data?.id || null,
  };
};

const sendViaSmtp = async (job: DeliverableEmail) => {
  if (!hasSmtpConfig()) {
    throw new Error("SMTP is not configured");
  }

  const transporter = getSmtpTransporter();
  const info = await transporter.sendMail({
    from: config.EMAIL_FROM,
    to: job.to.join(", "),
    subject: job.subject,
    html: job.html,
    attachments: toSmtpAttachments(job.attachments),
  });

  return {
    provider: "SMTP",
    messageId: info.messageId || null,
  };
};

const sendWithProviderFallback = async (job: DeliverableEmail) => {
  const errors: string[] = [];

  if (resendClient) {
    try {
      return await sendViaResend(job);
    } catch (error: any) {
      const message = formatError(error);
      errors.push(`Resend: ${message}`);
      logger.warn("Resend send failed, attempting SMTP fallback", {
        emailJobId: job.id,
        error: message,
      });
    }
  } else {
    errors.push("Resend: not configured");
  }

  if (hasSmtpConfig()) {
    try {
      return await sendViaSmtp(job);
    } catch (error: any) {
      const message = formatError(error);
      errors.push(`SMTP: ${message}`);
    }
  } else {
    errors.push("SMTP: not configured");
  }

  throw new Error(errors.join(" | "));
};

const getNextRetryDate = (attempts: number) => {
  const backoff = Math.min(
    BASE_BACKOFF_MS * Math.pow(2, Math.max(attempts - 1, 0)),
    MAX_BACKOFF_MS,
  );
  return new Date(Date.now() + backoff);
};

const claimEmailJob = async (jobId: string): Promise<EmailJob | null> => {
  const now = new Date();
  const staleLockCutoff = new Date(Date.now() - lockTimeoutMs);

  const claim = await prisma.emailJob.updateMany({
    where: {
      id: jobId,
      nextAttemptAt: { lte: now },
      OR: [
        { status: "PENDING" },
        {
          status: "PROCESSING",
          lockedAt: { lt: staleLockCutoff },
        },
      ],
    },
    data: {
      status: "PROCESSING",
      lockedAt: now,
      lockedBy: WORKER_ID,
      updatedAt: now,
    },
  });

  if (claim.count === 0) {
    return null;
  }

  return prisma.emailJob.findUnique({ where: { id: jobId } });
};

const processClaimedEmailJob = async (
  job: EmailJob,
): Promise<Extract<ProcessEmailJobResult, { success: true }>> => {
  try {
    const delivery = await sendWithProviderFallback(job);

    await prisma.emailJob.update({
      where: { id: job.id },
      data: {
        status: "SENT",
        provider: delivery.provider,
        providerMessageId: delivery.messageId || undefined,
        sentAt: new Date(),
        lastError: null,
        lockedAt: null,
        lockedBy: null,
      },
    });

    logger.info("Email job sent successfully", {
      emailJobId: job.id,
      provider: delivery.provider,
      to: job.to,
    });

    return {
      success: true,
      provider: delivery.provider,
      messageId: delivery.messageId || undefined,
    };
  } catch (error: any) {
    const errorMessage = formatError(error);
    const attempts = job.attempts + 1;
    const reachedMaxAttempts = attempts >= job.maxAttempts;

    await prisma.emailJob.update({
      where: { id: job.id },
      data: {
        attempts,
        status: reachedMaxAttempts ? "FAILED" : "PENDING",
        nextAttemptAt: reachedMaxAttempts ? job.nextAttemptAt : getNextRetryDate(attempts),
        lastError: errorMessage,
        lockedAt: null,
        lockedBy: null,
      },
    });

    if (reachedMaxAttempts) {
      logger.error("Email job permanently failed after max retries", {
        emailJobId: job.id,
        attempts,
        maxAttempts: job.maxAttempts,
        error: errorMessage,
      });
    } else {
      logger.warn("Email job send failed; queued for retry", {
        emailJobId: job.id,
        attempts,
        maxAttempts: job.maxAttempts,
        error: errorMessage,
      });
    }

    throw new Error(errorMessage);
  }
};

const claimPendingJobs = async (limit: number): Promise<EmailJob[]> => {
  const now = new Date();
  const staleLockCutoff = new Date(Date.now() - lockTimeoutMs);

  const candidates = await prisma.emailJob.findMany({
    where: {
      nextAttemptAt: { lte: now },
      OR: [
        { status: "PENDING" },
        {
          status: "PROCESSING",
          lockedAt: { lt: staleLockCutoff },
        },
      ],
    },
    orderBy: [{ nextAttemptAt: "asc" }, { createdAt: "asc" }],
    take: limit,
  });

  const claimed: EmailJob[] = [];

  for (const candidate of candidates) {
    const job = await claimEmailJob(candidate.id);
    if (job) {
      claimed.push(job);
    }
  }

  return claimed;
};

export const queueEmailJob = async (
  input: QueueEmailInput,
): Promise<EmailJob> => {
  const recipients = normalizeRecipients(input.to);
  if (recipients.length === 0) {
    throw new Error("At least one recipient email is required");
  }

  return prisma.emailJob.create({
    data: {
      to: recipients,
      subject: input.template.subject,
      html: input.template.html,
      attachments: sanitizeAttachments(input.attachments),
      maxAttempts: input.maxAttempts || config.EMAIL_MAX_RETRIES,
      status: "PENDING",
      nextAttemptAt: new Date(),
    },
  });
};

export const sendEmailDirect = async (input: QueueEmailInput) => {
  const recipients = normalizeRecipients(input.to);
  if (recipients.length === 0) {
    throw new Error("At least one recipient email is required");
  }

  const delivery = await sendWithProviderFallback({
    id: `direct-${Date.now()}`,
    to: recipients,
    subject: input.template.subject,
    html: input.template.html,
    attachments: sanitizeAttachments(input.attachments),
  });

  return {
    success: true,
    provider: delivery.provider,
    messageId: delivery.messageId || undefined,
  };
};

export const processEmailJobNow = async (
  jobId: string,
): Promise<ProcessEmailJobResult> => {
  const claimedJob = await claimEmailJob(jobId);
  if (!claimedJob) {
    return {
      success: false,
      reason: "Job is already being processed by another worker",
    };
  }

  return processClaimedEmailJob(claimedJob);
};

export const queueAndSendEmail = async (input: QueueEmailInput) => {
  let job: EmailJob;
  try {
    job = await queueEmailJob(input);
  } catch (error: any) {
    if (isMissingEmailQueueTableError(error)) {
      logger.warn(
        "Email queue table is missing; falling back to direct email delivery",
        {
          error: formatError(error),
        },
      );
      const directResult = await sendEmailDirect(input);
      return {
        success: true,
        queued: false,
        jobId: undefined,
        messageId: directResult.messageId,
      };
    }

    throw error;
  }

  try {
    const result = await processEmailJobNow(job.id);
    if (!result.success) {
      return { success: true, queued: true, jobId: job.id };
    }

    return {
      success: true,
      queued: false,
      jobId: job.id,
      messageId: result.messageId,
    };
  } catch (error: any) {
    logger.warn("Immediate email delivery failed; job queued for retry", {
      emailJobId: job.id,
      error: formatError(error),
    });
    return {
      success: true,
      queued: true,
      jobId: job.id,
      messageId: undefined,
    };
  }
};

export const runEmailWorkerCycle = async () => {
  if (workerBusy) return;

  workerBusy = true;
  try {
    let jobs: EmailJob[] = [];
    try {
      jobs = await claimPendingJobs(emailWorkerBatchSize);
      emailQueueTableMissingLogged = false;
    } catch (error: any) {
      if (isMissingEmailQueueTableError(error)) {
        if (!emailQueueTableMissingLogged) {
          emailQueueTableMissingLogged = true;
          logger.warn(
            "Email queue table is missing; worker will stay idle until migrations are applied",
          );
        }
        return;
      }
      throw error;
    }

    if (jobs.length === 0) {
      return;
    }

    logger.info("Email worker picked jobs", {
      count: jobs.length,
      workerId: WORKER_ID,
    });

    for (const job of jobs) {
      try {
        await processClaimedEmailJob(job);
      } catch {
        // Failure is already persisted and logged in processClaimedEmailJob.
      }
    }
  } finally {
    workerBusy = false;
  }
};

export const startEmailWorker = () => {
  if (!config.EMAIL_WORKER_ENABLED) {
    logger.info("Email worker disabled by configuration");
    return;
  }

  if (workerTimer) {
    return;
  }

  logger.info("Starting email worker", {
    intervalMs: emailWorkerIntervalMs,
    batchSize: emailWorkerBatchSize,
    maxRetries: config.EMAIL_MAX_RETRIES,
    workerId: WORKER_ID,
  });

  workerTimer = setInterval(() => {
    runEmailWorkerCycle().catch((error) => {
      logger.error("Email worker cycle failed", { error: formatError(error) });
    });
  }, emailWorkerIntervalMs);

  // Kick an immediate cycle on startup.
  runEmailWorkerCycle().catch((error) => {
    logger.error("Initial email worker cycle failed", { error: formatError(error) });
  });
};

export const stopEmailWorker = () => {
  if (workerTimer) {
    clearInterval(workerTimer);
    workerTimer = null;
  }
};
