import { logger } from "@/utils/logger";
import cron from "node-cron";
import { runEscrowJobs } from "./escrowJobs";
import { startWithdrawalRetryJob } from "./withdrawalRetryCron";
import { startEmailWorker } from "@/services/emailWorker";
import { runDisputeSlaJob } from "./disputeSlaJob";
import { processCheckinFallbacks } from "./checkinFallbackJob";
import { runEvidenceReminderJob } from "./evidenceReminderJob";

/**
 * Initialize all scheduled jobs
 */
export const initializeScheduledJobs = () => {
  logger.info("[Job Scheduler] Initializing scheduled jobs...");

  // Run escrow jobs every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    logger.info("[Job Scheduler] Running escrow jobs...");
    try {
      await runEscrowJobs();
    } catch (error) {
      logger.error("[Job Scheduler] Escrow jobs failed:", error);
    }
  });

  // Run booking lifecycle automation every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    logger.info("[Job Scheduler] Running booking lifecycle automation...");
    try {
      await processCheckinFallbacks();
    } catch (error) {
      logger.error("[Job Scheduler] Booking lifecycle automation failed:", error);
    }
  });

  // Run evidence reminder emails every 10 minutes
  cron.schedule("*/10 * * * *", async () => {
    logger.info("[Job Scheduler] Running evidence reminder job...");
    try {
      await runEvidenceReminderJob();
    } catch (error) {
      logger.error("[Job Scheduler] Evidence reminder job failed:", error);
    }
  });

  // Start withdrawal retry job
  startWithdrawalRetryJob();
  startEmailWorker();

  // Dispute SLA enforcement: auto-resolve escalated disputes past 48h admin deadline
  cron.schedule("0 * * * *", async () => {
    logger.info("[Job Scheduler] Running dispute SLA check...");
    try {
      await runDisputeSlaJob();
    } catch (error) {
      logger.error("[Job Scheduler] Dispute SLA job failed:", error);
    }
  });

  logger.info("[Job Scheduler] Scheduled jobs initialized successfully");
  logger.info("[Job Scheduler] - Escrow release jobs: Every 5 minutes");
  logger.info("[Job Scheduler] - Booking lifecycle automation: Every 5 minutes");
  logger.info("[Job Scheduler] - Evidence reminder emails: Every 10 minutes");
  logger.info("[Job Scheduler] - Withdrawal retry jobs: Every hour at :15");
  logger.info("[Job Scheduler] - Email worker: queued delivery with retries");
  logger.info("[Job Scheduler] - Dispute SLA check: Every hour at :00");
};

export default {
  initializeScheduledJobs,
};
