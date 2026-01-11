import { prisma } from "@/config/database";
import { logger } from "@/utils/logger";
import checkinService from "@/services/checkinService";

/**
 * Check-In Fallback Job
 * Runs every 5 minutes to check bookings that need auto check-in confirmation
 * Auto-confirms check-in 30 minutes after official check-in time if not manually confirmed
 */

export const processCheckinFallbacks = async (): Promise<void> => {
  const now = new Date();
  const fallbackThreshold = new Date(now.getTime() - 30 * 60 * 1000); // 30 minutes ago

  try {
    // Find bookings that need auto check-in confirmation
    const eligibleBookings = await prisma.booking.findMany({
      where: {
        status: {
          in: ["ACTIVE"], // Payment completed but not checked in
        },
        checkInDate: {
          lte: fallbackThreshold, // Check-in time + 30 minutes has passed
        },
        checkinConfirmedAt: null, // Not yet confirmed
        payment: {
          status: {
            in: ["HELD"], // Payment must be in escrow
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
      logger.debug("No bookings eligible for auto check-in confirmation");
      return;
    }

    logger.info(
      `Processing auto check-in confirmation for ${eligibleBookings.length} bookings`
    );

    for (const booking of eligibleBookings) {
      try {
        await processBookingCheckinFallback(booking);
      } catch (error) {
        logger.error(
          `Failed to process check-in fallback for booking ${booking.id}:`,
          error
        );
        // Continue with next booking
      }
    }

    logger.info(
      `Check-in fallback job completed. Processed ${eligibleBookings.length} bookings`
    );
  } catch (error) {
    logger.error("Check-in fallback job failed:", error);
    throw error;
  }
};

/**
 * Process auto check-in confirmation for a single booking
 */
const processBookingCheckinFallback = async (booking: any): Promise<void> => {
  const checkInTime = new Date(booking.checkInDate);
  const now = new Date();
  const minutesElapsed = Math.floor(
    (now.getTime() - checkInTime.getTime()) / (60 * 1000)
  );

  logger.info(
    `Auto-confirming check-in for booking ${booking.id} (${minutesElapsed} minutes after check-in time)`
  );

  try {
    // Use check-in service to auto-confirm
    const result = await checkinService.autoConfirmCheckIn(booking.id);

    logger.info(
      `Successfully auto-confirmed check-in for booking ${
        booking.id
      }. Dispute window closes at ${result.disputeWindowClosesAt.toISOString()}`
    );

    // Send additional notification about auto-confirmation
    try {
      // Notify guest
      await prisma.notification.create({
        data: {
          userId: booking.guestId,
          type: "BOOKING_REMINDER",
          title: "Check-In Auto-Confirmed",
          message: `Your check-in has been automatically confirmed. You have 1 hour to report any issues with the property.`,
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
          title: "Check-In Auto-Confirmed",
          message: `Guest check-in for ${booking.property.title} was automatically confirmed.`,
          bookingId: booking.id,
          priority: "medium",
          isRead: false,
        },
      });
    } catch (notificationError) {
      logger.error(
        "Failed to send auto check-in notifications:",
        notificationError
      );
    }
  } catch (error) {
    logger.error(
      `Failed to auto-confirm check-in for booking ${booking.id}:`,
      error
    );
    throw error;
  }
};

export default {
  processCheckinFallbacks,
};
