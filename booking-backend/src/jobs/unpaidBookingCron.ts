import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";
import { config } from "../config";

const prisma = new PrismaClient();
const PAYMENT_TIMEOUT_MINUTES = config.BOOKING_PAYMENT_TIMEOUT_MINUTES;
const PAYMENT_TIMEOUT_MS = PAYMENT_TIMEOUT_MINUTES * 60 * 1000;

const runUnpaidBookingCancellationPass = async () => {
  const oneHourAgo = new Date(Date.now() - PAYMENT_TIMEOUT_MS);

  logger.info("Running unpaid booking cancellation job...");

  const expiredBookings = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      createdAt: {
        lt: oneHourAgo,
      },
      OR: [
        { payment: { is: null } },
        {
          payment: {
            is: {
              paidAt: null,
              status: { in: ["INITIATED", "FAILED"] },
            },
          },
        },
      ],
    },
    include: {
      payment: true,
      property: {
        select: {
          title: true,
        },
      },
      guest: {
        select: {
          email: true,
        },
      },
    },
  });

  logger.info(
    `Found ${expiredBookings.length} expired unpaid bookings to cancel`
  );

  if (expiredBookings.length === 0) {
    return;
  }

  for (const booking of expiredBookings) {
    try {
      await prisma.$transaction(async (tx) => {
        const fresh = await tx.booking.findUnique({
          where: { id: booking.id },
          include: { payment: true },
        });

        if (!fresh || fresh.status !== "PENDING") {
          return;
        }

        const stillUnpaid =
          !fresh.payment ||
          (fresh.payment.paidAt === null &&
            (fresh.payment.status === "INITIATED" ||
              fresh.payment.status === "FAILED"));

        if (!stillUnpaid || fresh.createdAt >= oneHourAgo) {
          return;
        }

        await tx.auditLog.create({
          data: {
            action: "BOOKING_AUTO_CANCELLED",
            entityType: "BOOKING",
            entityId: booking.id,
            userId: booking.guestId,
            details: {
              reason: "PAYMENT_TIMEOUT",
              visibility: "PURGED_FROM_USER_LISTS",
              bookingCreatedAt: fresh.createdAt,
              autoCancelledAt: new Date(),
              paymentStatus: fresh.payment?.status ?? "NONE",
            },
            timestamp: new Date(),
          },
        });

        // Keep stale pending bookings out of UX entirely by purging unpaid records.
        await tx.escrowEvent.deleteMany({
          where: { bookingId: booking.id },
        });
        await tx.escrow.deleteMany({
          where: { bookingId: booking.id },
        });
        await tx.notification.deleteMany({
          where: { bookingId: booking.id },
        });
        await tx.booking.delete({
          where: { id: booking.id },
        });
      });

      logger.info(`Auto-cancelled unpaid booking ${booking.id}`, {
        bookingId: booking.id,
        guestEmail: booking.guest.email,
        propertyTitle: booking.property.title,
        createdAt: booking.createdAt,
      });
    } catch (error) {
      logger.error(`Failed to cancel booking ${booking.id}:`, error);
    }
  }

  logger.info(
    `Unpaid booking cancellation job completed. Cancelled ${expiredBookings.length} bookings.`
  );
};

/**
 * Auto-cancel unpaid bookings after configured timeout.
 * Runs every minute and once immediately on startup.
 */
export const startUnpaidBookingCron = () => {
  runUnpaidBookingCancellationPass().catch((error) => {
    logger.error("Unpaid booking cancellation startup run failed:", error);
  });

  cron.schedule("* * * * *", async () => {
    try {
      await runUnpaidBookingCancellationPass();
    } catch (error) {
      logger.error("Error in unpaid booking cancellation cron:", error);
    }
  });

  logger.info(
    `Unpaid booking auto-cancellation CRON started (timeout=${PAYMENT_TIMEOUT_MINUTES}m, runs every minute)`
  );
};
