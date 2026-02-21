import { prisma } from "@/config/database";
import { logger } from "@/utils/logger";
import escrowService from "@/services/escrowService";

/**
 * Room Fee Release Job
 * Runs every 5 minutes to check bookings eligible for room fee release.
 * Uses wallet-based escrow split (no direct Paystack transfer path).
 */

export const processRoomFeeRelease = async (): Promise<void> => {
  const now = new Date();

  try {
    const eligibleBookings = await prisma.booking.findMany({
      where: {
        status: "ACTIVE",
        stayStatus: { in: ["CHECKED_IN", "CHECKED_OUT"] },
        roomFeeReleaseEligibleAt: {
          lte: now,
        },
        payment: {
          roomFeeSplitDone: false,
          status: {
            in: ["HELD"],
          },
        },
      },
      select: {
        id: true,
        guestId: true,
        payment: true,
        property: {
          select: {
            title: true,
            realtor: true,
          },
        },
      },
      take: 50,
    });

    if (eligibleBookings.length === 0) {
      logger.debug("No bookings eligible for room fee release");
      return;
    }

    logger.info(
      `Processing room fee release for ${eligibleBookings.length} bookings`,
    );

    for (const booking of eligibleBookings) {
      try {
        const activeDispute = await prisma.dispute.findFirst({
          where: {
            bookingId: booking.id,
            disputeSubject: "ROOM_FEE",
            status: {
              in: ["OPEN", "AWAITING_RESPONSE", "ESCALATED"],
            },
          },
        });

        if (activeDispute) {
          logger.info(
            `Skipping booking ${booking.id}: Active room fee dispute exists (${activeDispute.status})`,
          );
          continue;
        }

        await processBookingRoomFeeRelease(booking);
      } catch (error) {
        logger.error(
          `Failed to process room fee release for booking ${booking.id}:`,
          error,
        );
      }
    }

    logger.info(
      `Room fee release job completed. Processed ${eligibleBookings.length} bookings`,
    );
  } catch (error) {
    logger.error("Room fee release job failed:", error);
    throw error;
  }
};

const processBookingRoomFeeRelease = async (booking: any): Promise<void> => {
  const { payment, property } = booking;

  try {
    const result = await escrowService.releaseRoomFeeSplit(
      booking.id,
      payment.id,
      property.realtor.id,
    );

    try {
      await prisma.notification.create({
        data: {
          userId: property.realtor.userId,
          type: "PAYOUT_COMPLETED",
          title: "Room Fee Released",
          message: `NGN ${result.realtorAmount.toLocaleString()} from booking has been released to your wallet.`,
          bookingId: booking.id,
          priority: "high",
          isRead: false,
        },
      });

      await prisma.notification.create({
        data: {
          userId: booking.guestId,
          type: "PAYMENT_COMPLETED",
          title: "Booking Payment Processed",
          message:
            "Room fee has been released to the realtor. Your security deposit will be refunded after check-out if no damages are reported.",
          bookingId: booking.id,
          priority: "low",
          isRead: false,
        },
      });
    } catch (notificationError) {
      logger.error(
        "Failed to send room fee release notifications:",
        notificationError,
      );
    }

    logger.info(`Successfully released room fee for booking ${booking.id}`);
  } catch (error) {
    logger.error(
      `Failed to release room fee for booking ${booking.id}:`,
      error,
    );
    throw error;
  }
};

export default {
  processRoomFeeRelease,
};
