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

  try {
    // Auto check-in candidates (at/after scheduled check-in snapshot)
    const eligibleCheckins = await prisma.booking.findMany({
      where: {
        status: "ACTIVE",
        checkInAtSnapshot: { lte: now },
        checkinConfirmedAt: null, // Not yet confirmed
        stayStatus: "NOT_STARTED",
        payment: {
          status: {
            in: ["HELD"], // Payment must be in escrow
          },
        },
      },
      select: {
        id: true,
        guestId: true,
        checkInDate: true,
        checkInAtSnapshot: true,
        property: {
          select: {
            title: true,
            realtor: true,
          },
        },
      },
      take: 50, // Process in batches
    });

    // Auto checkout candidates (at/after scheduled checkout snapshot)
    const eligibleCheckouts = await prisma.booking.findMany({
      where: {
        status: { in: ["ACTIVE", "DISPUTED"] },
        checkOutAtSnapshot: { lte: now },
        checkOutTime: null,
        stayStatus: { in: ["CHECKED_IN", "NOT_STARTED"] },
      },
      select: {
        id: true,
        checkOutDate: true,
        checkOutAtSnapshot: true,
        property: {
          select: {
            realtor: true,
          },
        },
      },
      take: 50,
    });

    if (eligibleCheckins.length === 0 && eligibleCheckouts.length === 0) {
      logger.debug("No bookings eligible for lifecycle automation");
      return;
    }

    logger.info(
      `Processing lifecycle automation: ${eligibleCheckins.length} auto check-ins, ${eligibleCheckouts.length} auto check-outs`,
    );

    for (const booking of eligibleCheckins) {
      try {
        await processBookingCheckinFallback(booking);
      } catch (error) {
        logger.error(
          `Failed to process check-in fallback for booking ${booking.id}:`,
          error,
        );
        // Continue with next booking
      }
    }

    for (const booking of eligibleCheckouts) {
      try {
        await processBookingCheckoutFallback(booking);
      } catch (error) {
        logger.error(
          `Failed to process checkout fallback for booking ${booking.id}:`,
          error,
        );
      }
    }

    logger.info(
      `Lifecycle automation job completed. Processed ${eligibleCheckins.length + eligibleCheckouts.length} bookings`,
    );
  } catch (error) {
    logger.error("Lifecycle automation job failed:", error);
    throw error;
  }
};

/**
 * Process auto check-in confirmation for a single booking
 */
const processBookingCheckinFallback = async (booking: any): Promise<void> => {
  const checkInTime = new Date(
    booking.checkInAtSnapshot || booking.checkInDate,
  );
  const now = new Date();
  const minutesElapsed = Math.floor(
    (now.getTime() - checkInTime.getTime()) / (60 * 1000),
  );

  logger.info(
    `Auto-confirming check-in for booking ${booking.id} (${minutesElapsed} minutes after check-in time)`,
  );

  try {
    // Use check-in service to auto-confirm
    const result = await checkinService.autoConfirmCheckIn(booking.id);

    logger.info(
      `Successfully auto-confirmed check-in for booking ${
        booking.id
      }. Dispute window closes at ${result.disputeWindowClosesAt.toISOString()}`,
    );

    // Send additional notification about auto-confirmation
    try {
      // Notify guest
      await prisma.notification.create({
        data: {
          userId: booking.guestId,
          type: "BOOKING_REMINDER",
          title: "Check-In Auto-Confirmed",
          message: `Your check-in has been automatically confirmed. You have 1 hour 10 minutes to report any issues with the property.`,
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
        notificationError,
      );
    }
  } catch (error) {
    logger.error(
      `Failed to auto-confirm check-in for booking ${booking.id}:`,
      error,
    );
    throw error;
  }
};

const processBookingCheckoutFallback = async (booking: any): Promise<void> => {
  const checkOutTime = new Date(
    booking.checkOutAtSnapshot || booking.checkOutDate,
  );
  const now = new Date();
  const minutesElapsed = Math.floor(
    (now.getTime() - checkOutTime.getTime()) / (60 * 1000),
  );

  logger.info(
    `Auto-confirming checkout for booking ${booking.id} (${minutesElapsed} minutes after scheduled checkout)`,
  );

  await checkinService.autoCheckOut(booking.id);
};

export default {
  processCheckinFallbacks,
};
