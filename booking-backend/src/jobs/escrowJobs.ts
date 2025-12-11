import { logger } from "@/utils/logger";
import escrowService from "../services/escrowService";
import { NotificationService } from "../services/notificationService";
import { JobLock } from "../utils/jobLock";

/**
 * Job to automatically release room fee split after 1-hour user dispute window
 * Runs every 5 minutes
 */
export const processEscrowReleases = async () => {
  const lock = new JobLock("escrow_release");

  try {
    logger.info("[Escrow Release Job] Starting...");

    // Clean up expired locks first
    await JobLock.cleanupExpiredLocks();

    // Try to acquire lock
    const acquired = await lock.acquire();
    if (!acquired) {
      logger.info(
        "[Escrow Release Job] Already running on another instance, skipping"
      );
      return;
    }

    // Get bookings eligible for room fee release
    const eligibleBookings =
      await escrowService.getBookingsEligibleForRoomFeeRelease();

    logger.info(
      `[Escrow Release Job] Found ${eligibleBookings.length} bookings eligible for room fee release`
    );

    // Track booking IDs in lock
    const bookingIds = eligibleBookings.map((b) => b.id);
    await lock.updateBookingIds(bookingIds);

    for (const booking of eligibleBookings) {
      try {
        if (!booking.payment) {
          logger.error(
            `[Escrow Release Job] Booking ${booking.id} has no payment record`
          );
          continue;
        }

        const realtorId = booking.property.realtor.id;

        // Release room fee split (90% to realtor, 10% to platform)
        const result = await escrowService.releaseRoomFeeSplit(
          booking.id,
          booking.payment.id,
          realtorId
        );

        logger.info(
          `[Escrow Release Job] Released room fee for booking ${booking.id}: ₦${result.realtorAmount} to realtor, ₦${result.platformAmount} to platform`
        );

        // Send notifications
        try {
          const notificationService = NotificationService.getInstance();

          // Notify realtor
          await notificationService.createAndSendNotification({
            userId: booking.property.realtor.userId,
            type: "PAYOUT_COMPLETED",
            title: "Room Fee Released",
            message: `Room fee of ₦${result.realtorAmount.toFixed(
              2
            )} has been released for booking at ${booking.property.title}`,
            bookingId: booking.id,
            propertyId: booking.propertyId,
          });

          // Notify guest
          await notificationService.createAndSendNotification({
            userId: booking.guestId,
            type: "SYSTEM_ALERT",
            title: "Payment Released",
            message: `Room fee has been released to the host. Your 1-hour dispute window has closed.`,
            bookingId: booking.id,
            propertyId: booking.propertyId,
          });
        } catch (notifError) {
          logger.error(
            `[Escrow Release Job] Notification failed for booking ${booking.id}:`,
            notifError
          );
        }
      } catch (error) {
        logger.error(
          `[Escrow Release Job] Failed to process booking ${booking.id}:`,
          error
        );
      }
    }

    logger.info("[Escrow Release Job] Completed successfully");
  } catch (error) {
    logger.error("[Escrow Release Job] Job failed:", error);
  } finally {
    // Always release lock
    await lock.release();
  }
};

/**
 * Job to automatically return security deposit after 2-hour realtor dispute window
 * Runs every 5 minutes
 */
export const processDepositReturns = async () => {
  const lock = new JobLock("deposit_return");

  try {
    logger.info("[Deposit Return Job] Starting...");

    // Clean up expired locks first
    await JobLock.cleanupExpiredLocks();

    // Try to acquire lock
    const acquired = await lock.acquire();
    if (!acquired) {
      logger.info(
        "[Deposit Return Job] Already running on another instance, skipping"
      );
      return;
    }

    // Get bookings eligible for deposit return
    const eligibleBookings =
      await escrowService.getBookingsEligibleForDepositReturn();

    logger.info(
      `[Deposit Return Job] Found ${eligibleBookings.length} bookings eligible for deposit return`
    );

    // Track booking IDs in lock
    const bookingIds = eligibleBookings.map((b) => b.id);
    await lock.updateBookingIds(bookingIds);

    for (const booking of eligibleBookings) {
      try {
        if (!booking.payment) {
          logger.error(
            `[Deposit Return Job] Booking ${booking.id} has no payment record`
          );
          continue;
        }

        // Return security deposit to customer
        const result = await escrowService.returnSecurityDeposit(
          booking.id,
          booking.payment.id,
          booking.guestId
        );

        if (result.depositReturned > 0) {
          logger.info(
            `[Deposit Return Job] Returned deposit for booking ${booking.id}: ₦${result.depositReturned} to customer`
          );

          // Send notification to guest
          try {
            const notificationService = NotificationService.getInstance();

            await notificationService.createAndSendNotification({
              userId: booking.guestId,
              type: "SYSTEM_ALERT",
              title: "Security Deposit Returned",
              message: `Your security deposit of ₦${result.depositReturned.toFixed(
                2
              )} has been returned. The realtor's dispute window has closed.`,
              bookingId: booking.id,
              propertyId: booking.propertyId,
            });
          } catch (notifError) {
            logger.error(
              `[Deposit Return Job] Notification failed for booking ${booking.id}:`,
              notifError
            );
          }
        } else {
          logger.info(
            `[Deposit Return Job] No deposit to return for booking ${booking.id}`
          );
        }

        // Mark booking as completed
        const { prisma } = await import("../config/database");
        await prisma.booking.update({
          where: { id: booking.id },
          data: { status: "COMPLETED" },
        });
      } catch (error) {
        logger.error(
          `[Deposit Return Job] Failed to process booking ${booking.id}:`,
          error
        );
      }
    }

    logger.info("[Deposit Return Job] Completed successfully");
  } catch (error) {
    logger.error("[Deposit Return Job] Job failed:", error);
  } finally {
    // Always release lock
    await lock.release();
  }
};

// Combined job runner
export const runEscrowJobs = async () => {
  await Promise.all([processEscrowReleases(), processDepositReturns()]);
};

export default {
  processEscrowReleases,
  processDepositReturns,
  runEscrowJobs,
};
