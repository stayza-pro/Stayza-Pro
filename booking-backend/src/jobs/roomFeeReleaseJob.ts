import { prisma } from "@/config/database";
import { logger } from "@/utils/logger";
import escrowService from "@/services/escrowService";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Room Fee Release Job
 * Runs every 5 minutes to check bookings eligible for room fee release
 * Releases 90% to realtor, 10% to platform after 1-hour guest dispute window
 */

export const processRoomFeeRelease = async (): Promise<void> => {
  const now = new Date();

  try {
    // Find bookings eligible for room fee release
    const eligibleBookings = await prisma.booking.findMany({
      where: {
        status: "ACTIVE",
        stayStatus: { in: ["CHECKED_IN", "CHECKED_OUT"] }, // Guest is staying or has left
        roomFeeReleaseEligibleAt: {
          lte: now, // Release time has passed
        },
        payment: {
          roomFeeSplitDone: false, // Not already released
          status: {
            in: ["HELD"], // Only process if payment is in escrow
          },
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
      logger.debug("No bookings eligible for room fee release");
      return;
    }

    logger.info(
      `Processing room fee release for ${eligibleBookings.length} bookings`
    );

    for (const booking of eligibleBookings) {
      try {
        // ✅ CHECK FOR ACTIVE ROOM FEE DISPUTES (Dispute V2 system)
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
            `Skipping booking ${booking.id}: Active room fee dispute exists (${activeDispute.status})`
          );
          continue; // Skip this booking
        }

        await processBookingRoomFeeRelease(booking);
      } catch (error) {
        logger.error(
          `Failed to process room fee release for booking ${booking.id}:`,
          error
        );
        // Continue with next booking
      }
    }

    logger.info(
      `Room fee release job completed. Processed ${eligibleBookings.length} bookings`
    );
  } catch (error) {
    logger.error("Room fee release job failed:", error);
    throw error;
  }
};

/**
 * Process room fee release for a single booking
 */
const processBookingRoomFeeRelease = async (booking: any): Promise<void> => {
  const { payment, property, roomFee } = booking;

  // Calculate split: 90% realtor, 10% platform
  const realtorAmount = new Decimal(roomFee).mul(0.9);
  const platformAmount = new Decimal(roomFee).mul(0.1);

  logger.info(
    `Releasing room fee for booking ${booking.id}: Realtor ₦${realtorAmount}, Platform ₦${platformAmount}`
  );

  // In a real implementation, this would call Paystack API
  // to transfer funds to realtor's subaccount
  // For now, we'll simulate the release and update database

  try {
    // TODO: Implement actual payment gateway transfer
    // const transferResult = await paystackService.transferToSubAccount({
    //   subaccountCode: property.realtor.paystackSubAccountCode,
    //   amount: realtorAmount.toNumber() * 100, // Convert to kobo
    //   reference: `ROOM_FEE_SPLIT_${booking.id}_${Date.now()}`,
    // });

    const releaseReference = `ROOM_FEE_SPLIT_${booking.id}_${Date.now()}`;
    const now = new Date();

    // Update payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        roomFeeSplitDone: true,
        roomFeeSplitRealtorAmount: realtorAmount,
        roomFeeSplitPlatformAmount: platformAmount,
        roomFeeSplitReleaseReference: releaseReference,
        roomFeeReleasedAt: now,
        status: "PARTIALLY_RELEASED", // Room fee out, deposit still in escrow
      },
    });

    // Log escrow event
    await escrowService.logEscrowEvent({
      bookingId: booking.id,
      eventType: "RELEASE_ROOM_FEE_SPLIT",
      amount: roomFee,
      description: `Room fee released: ₦${realtorAmount} to realtor, ₦${platformAmount} to platform`,
      metadata: {
        realtorAmount: realtorAmount.toString(),
        platformAmount: platformAmount.toString(),
        releaseReference,
      },
    });

    // Send notifications
    try {
      // Create notifications in database (socket.io will handle real-time delivery)
      await prisma.notification.create({
        data: {
          userId: property.realtor.userId,
          type: "PAYOUT_COMPLETED",
          title: "Room Fee Released",
          message: `₦${realtorAmount} from booking has been released to your account.`,
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
          message: `Room fee has been released to the realtor. Your security deposit will be refunded after check-out if no damages are reported.`,
          bookingId: booking.id,
          priority: "low",
          isRead: false,
        },
      });
    } catch (notificationError) {
      logger.error(
        "Failed to send room fee release notifications:",
        notificationError
      );
    }

    logger.info(`Successfully released room fee for booking ${booking.id}`);
  } catch (error) {
    logger.error(
      `Failed to release room fee for booking ${booking.id}:`,
      error
    );
    throw error;
  }
};

export default {
  processRoomFeeRelease,
};
