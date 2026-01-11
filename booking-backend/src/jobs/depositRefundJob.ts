import { prisma } from "@/config/database";
import { logger } from "@/utils/logger";
import escrowService from "@/services/escrowService";

/**
 * Deposit Refund Job
 * Runs every 5 minutes to check bookings eligible for deposit refund
 * Refunds full deposit to guest after 4-hour realtor dispute window (if no dispute)
 */

export const processDepositRefunds = async (): Promise<void> => {
  const now = new Date();

  try {
    // Find bookings eligible for deposit refund
    const eligibleBookings = await prisma.booking.findMany({
      where: {
        status: "ACTIVE",
        stayStatus: "CHECKED_OUT", // Guest has checked out
        depositRefundEligibleAt: {
          lte: now, // Refund time has passed
        },
        payment: {
          depositRefunded: false, // Not already refunded
          depositInEscrow: true, // Deposit is in escrow
        },
      },
      include: {
        payment: true,
        property: {
          include: {
            realtor: true,
          },
        },
        guest: true,
      },
      take: 50, // Process in batches
    });

    if (eligibleBookings.length === 0) {
      logger.debug("No bookings eligible for deposit refund");
      return;
    }

    logger.info(
      `Processing deposit refunds for ${eligibleBookings.length} bookings`
    );

    for (const booking of eligibleBookings) {
      try {
        // ✅ CHECK FOR ACTIVE DEPOSIT DISPUTES (Dispute V2 system)
        const activeDispute = await prisma.dispute.findFirst({
          where: {
            bookingId: booking.id,
            disputeSubject: "SECURITY_DEPOSIT",
            status: {
              in: ["OPEN", "AWAITING_RESPONSE", "ESCALATED"],
            },
          },
        });

        if (activeDispute) {
          logger.info(
            `Skipping booking ${booking.id}: Active deposit dispute exists (${activeDispute.status})`
          );
          continue; // Skip this booking
        }

        await processBookingDepositRefund(booking);
      } catch (error) {
        logger.error(
          `Failed to process deposit refund for booking ${booking.id}:`,
          error
        );
        // Continue with next booking
      }
    }

    logger.info(
      `Deposit refund job completed. Processed ${eligibleBookings.length} bookings`
    );
  } catch (error) {
    logger.error("Deposit refund job failed:", error);
    throw error;
  }
};

/**
 * Process deposit refund for a single booking
 */
const processBookingDepositRefund = async (booking: any): Promise<void> => {
  const { payment, securityDeposit } = booking;

  logger.info(
    `Refunding deposit for booking ${booking.id}: ₦${securityDeposit}`
  );

  try {
    // ✅ USE ESCROW SERVICE FOR PROPER REFUND HANDLING
    // This includes:
    // - Paystack refund API call
    // - Escrow status updates
    // - Payment record updates
    // - Escrow event logging
    await escrowService.returnSecurityDeposit(
      booking.id,
      payment.id,
      booking.guestId
    );

    // Update booking status to COMPLETED
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: "COMPLETED",
        payoutStatus: "COMPLETED",
        payoutCompletedAt: new Date(),
      },
    });

    // Send notifications
    try {
      // Notify guest
      await prisma.notification.create({
        data: {
          userId: booking.guestId,
          type: "PAYMENT_COMPLETED",
          title: "Security Deposit Refunded",
          message: `Your security deposit of ₦${securityDeposit} has been refunded.`,
          bookingId: booking.id,
          priority: "high",
          isRead: false,
        },
      });

      // Notify realtor
      await prisma.notification.create({
        data: {
          userId: booking.property.realtor.userId,
          type: "BOOKING_CONFIRMED",
          title: "Booking Completed",
          message: `Guest's security deposit has been refunded. Booking is now completed.`,
          bookingId: booking.id,
          priority: "low",
          isRead: false,
        },
      });
    } catch (notificationError) {
      logger.error(
        "Failed to send deposit refund notifications:",
        notificationError
      );
    }

    logger.info(`Successfully refunded deposit for booking ${booking.id}`);
  } catch (error) {
    logger.error(`Failed to refund deposit for booking ${booking.id}:`, error);
    throw error;
  }
};

export default {
  processDepositRefunds,
};
