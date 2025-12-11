import { logger } from "@/utils/logger";
import cron from "node-cron";
import { runEscrowJobs } from "./escrowJobs";

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

  logger.info("[Job Scheduler] Scheduled jobs initialized successfully");
  logger.info("[Job Scheduler] - Escrow release jobs: Every 5 minutes");
};

export default {
  initializeScheduledJobs,
};
