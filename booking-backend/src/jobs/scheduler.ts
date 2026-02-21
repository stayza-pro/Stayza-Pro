import { logger } from "@/utils/logger";
import cron from "node-cron";
import { runEscrowJobs } from "./escrowJobs";
import { startWithdrawalRetryJob } from "./withdrawalRetryCron";
import { startEmailWorker } from "@/services/emailWorker";
import { runDisputeSlaJob } from "./disputeSlaJob";

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
  logger.info("[Job Scheduler] - Withdrawal retry jobs: Every hour at :15");
  logger.info("[Job Scheduler] - Email worker: queued delivery with retries");
  logger.info("[Job Scheduler] - Dispute SLA check: Every hour at :00");
};

export default {
  initializeScheduledJobs,
};
