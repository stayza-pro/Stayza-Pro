import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

/**
 * Auto-cancel unpaid bookings after 1 hour
 * Runs every 15 minutes to check for expired bookings
 */
export const startUnpaidBookingCron = () => {
  // Run every 15 minutes
  cron.schedule("*/15 * * * *", async () => {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      logger.info("⏰ Running unpaid booking cancellation job...");

      // Find bookings that are:
      // 1. Still in PENDING status (not confirmed/cancelled)
      // 2. Created more than 1 hour ago
      // 3. Payment is PENDING (not completed)
      const expiredBookings = await prisma.booking.findMany({
        where: {
          status: "PENDING",
          createdAt: {
            lt: oneHourAgo,
          },
          payment: {
            status: "INITIATED",
          },
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
              firstName: true,
              lastName: true,
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

      // Cancel each expired booking
      for (const booking of expiredBookings) {
        try {
          // Check if payment was actually completed (funds held in escrow)
          // If payment status is still INITIATED, no money was received, so no escrow to handle
          const paymentWasCompleted = booking.payment?.status !== "INITIATED";

          // Update booking status to CANCELLED
          await prisma.booking.update({
            where: { id: booking.id },
            data: {
              status: "CANCELLED",
              updatedAt: new Date(),
            },
          });

          // Update payment status to FAILED
          if (booking.payment) {
            await prisma.payment.update({
              where: { id: booking.payment.id },
              data: {
                status: "FAILED",
                updatedAt: new Date(),
              },
            });
          }

          // Only delete escrow if it exists (it shouldn't for INITIATED payments)
          // This is a safety check to clean up any orphaned escrow records
          if (!paymentWasCompleted) {
            const escrowRecord = await prisma.escrow.findUnique({
              where: { bookingId: booking.id },
            });

            if (escrowRecord) {
              logger.warn(
                `Found escrow record for unpaid booking ${booking.id} - cleaning up`,
                { escrowId: escrowRecord.id }
              );

              // Delete escrow record and any related events
              await prisma.escrowEvent.deleteMany({
                where: { bookingId: booking.id },
              });

              await prisma.escrow.delete({
                where: { bookingId: booking.id },
              });
            }
          }

          // Create audit log
          await prisma.auditLog.create({
            data: {
              action: "BOOKING_AUTO_CANCELLED",
              entityType: "BOOKING",
              entityId: booking.id,
              userId: booking.guestId,
              details: {
                reason: "Payment not completed within 1 hour",
                propertyTitle: booking.property.title,
                bookingCreatedAt: booking.createdAt,
                autoCancelledAt: new Date(),
                paymentStatus: booking.payment?.status,
                escrowCreated: paymentWasCompleted,
              },
              timestamp: new Date(),
            },
          });

          logger.info(`✅ Auto-cancelled booking ${booking.id}`, {
            bookingId: booking.id,
            guestEmail: booking.guest.email,
            propertyTitle: booking.property.title,
            createdAt: booking.createdAt,
          });

          // Optionally: Send notification to guest
          // NotificationService.create({
          //   userId: booking.guestId,
          //   type: "BOOKING_AUTO_CANCELLED",
          //   title: "Booking Expired",
          //   message: `Your booking for ${booking.property.title} was cancelled due to incomplete payment.`,
          // });
        } catch (error) {
          logger.error(`Failed to cancel booking ${booking.id}:`, error);
        }
      }

      logger.info(
        `✅ Unpaid booking cancellation job completed. Cancelled ${expiredBookings.length} bookings.`
      );
    } catch (error) {
      logger.error("Error in unpaid booking cancellation cron:", error);
    }
  });

  logger.info(
    "🕐 Unpaid booking auto-cancellation CRON started (runs every 15 minutes)"
  );
};
