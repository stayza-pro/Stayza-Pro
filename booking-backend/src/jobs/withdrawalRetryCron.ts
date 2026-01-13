/**
 * Withdrawal Retry CRON Job
 *
 * Automatically retries failed withdrawals every hour.
 * This helps handle temporary Paystack API issues or network failures.
 */

import cron from "node-cron";
import { logger } from "@/utils/logger";
import * as withdrawalService from "@/services/withdrawalService";

export const startWithdrawalRetryJob = () => {
  // Run every hour at minute 15 (e.g., 1:15, 2:15, 3:15, etc.)
  cron.schedule("15 * * * *", async () => {
    logger.info("🕐 [CRON] Starting withdrawal retry job...");

    try {
      const result = await withdrawalService.retryFailedWithdrawals();

      logger.info("✅ [CRON] Withdrawal retry job completed", {
        processed: result.processed,
        successful: result.successful,
        failed: result.failed,
      });
    } catch (error) {
      logger.error("❌ [CRON] Withdrawal retry job failed:", error);
    }
  });

  logger.info(
    "🕐 Withdrawal retry CRON started (runs every hour at :15 minutes)"
  );
};
