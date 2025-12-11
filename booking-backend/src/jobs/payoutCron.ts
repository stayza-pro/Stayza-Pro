import { logger } from "@/utils/logger";
import cron from "node-cron";
import { findEligiblePayouts, processBookingPayout } from "../services/payout";

/**
 * CRON Job: Payout Eligibility Checker
 * Runs every hour to process payouts for bookings where check-in time has been reached
 */
export const startPayoutCron = () => {
  // Run every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    logger.info("🕐 [CRON] Running Payout Eligibility Checker...");

    try {
      // Find all bookings eligible for payout
      const eligibleBookingIds = await findEligiblePayouts();

      if (eligibleBookingIds.length === 0) {
        logger.info("✅ [CRON] No bookings eligible for payout at this time");
        return;
      }

      logger.info(
        `💰 [CRON] Found ${eligibleBookingIds.length} bookings eligible for payout`
      );

      // Process payouts
      const results = await Promise.allSettled(
        eligibleBookingIds.map((bookingId) => processBookingPayout(bookingId))
      );

      // Log results
      const successful = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;

      logger.info(
        `✅ [CRON] Payout processing complete: ${successful} successful, ${failed} failed`
      );

      // Log failed payouts for review
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          logger.error(
            `❌ [CRON] Failed to process payout for booking ${eligibleBookingIds[index]}:`,
            result.reason
          );
        }
      });
    } catch (error: any) {
      logger.error("❌ [CRON] Payout cron job error:", error.message);
    }
  });

  logger.info("✅ Payout Eligibility Checker CRON started (runs hourly)");
};

/**
 * Optional: Run payout check manually for testing
 */
export const runPayoutCheckNow = async () => {
  logger.info("🔄 Running manual payout check...");

  try {
    const eligibleBookingIds = await findEligiblePayouts();

    if (eligibleBookingIds.length === 0) {
      logger.info("✅ No bookings eligible for payout");
      return { processed: 0, failed: 0 };
    }

    logger.info(
      `💰 Found ${eligibleBookingIds.length} bookings eligible for payout`
    );

    const results = await Promise.allSettled(
      eligibleBookingIds.map((bookingId) => processBookingPayout(bookingId))
    );

    const successful = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.filter((r) => r.status === "rejected").length;

    logger.info(
      `✅ Payout processing complete: ${successful} successful, ${failed} failed`
    );

    return { processed: successful, failed };
  } catch (error: any) {
    logger.error("❌ Manual payout check error:", error.message);
    throw error;
  }
};
