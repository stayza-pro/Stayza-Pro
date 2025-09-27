import { prisma } from "@/config/database";
import { auditLogger } from "@/services/auditLogger";
import { config } from "@/config";
import { PaymentStatus } from "@prisma/client";

/**
 * Marks bookings as COMPLETED when their checkout date has passed
 * and they are still in CONFIRMED status (and not already completed/refunded/cancelled).
 * Optionally returns a summary of processed bookings.
 */
export async function completePastBookings(now: Date = new Date()) {
  // Find candidate bookings
  const candidates = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      checkOutDate: { lt: now },
    },
    select: { id: true, guestId: true, checkOutDate: true },
  });

  if (candidates.length === 0) {
    return { processed: 0, bookings: [] as string[] };
  }

  const processedIds: string[] = [];
  for (const b of candidates) {
    try {
      // Double-check & update in a transaction to avoid race with late refunds/cancellations
      await prisma.$transaction(async (tx) => {
        const fresh = await tx.booking.findUnique({
          where: { id: b.id },
          select: { status: true, checkOutDate: true },
        });
        if (!fresh) return;
        if (fresh.status !== "CONFIRMED") return; // state changed concurrently
        if (fresh.checkOutDate >= now) return; // edge case
        await tx.booking.update({
          where: { id: b.id },
          data: { status: "COMPLETED" },
        });
      });
      processedIds.push(b.id);
      auditLogger
        .log("BOOKING_STATUS_UPDATE", "Booking", {
          entityId: b.id,
          userId: b.guestId,
          details: { auto: true, newStatus: "COMPLETED" },
        })
        .catch(() => {});
    } catch (err) {
      console.error("Failed to auto-complete booking", b.id, err);
    }
  }

  return { processed: processedIds.length, bookings: processedIds };
}

/**
 * Cancels stale pending bookings that have exceeded the payment timeout window.
 */
export async function cancelStalePendingBookings(now: Date = new Date()) {
  const timeoutMinutes = config.BOOKING_PAYMENT_TIMEOUT_MINUTES;
  if (!timeoutMinutes || timeoutMinutes <= 0) {
    return { processed: 0, bookings: [] as string[] };
  }

  const threshold = new Date(now.getTime() - timeoutMinutes * 60 * 1000);
  const candidates = await prisma.booking.findMany({
    where: {
      status: "PENDING",
      createdAt: { lt: threshold },
    },
    select: { id: true, guestId: true },
  });

  if (candidates.length === 0) {
    return { processed: 0, bookings: [] as string[] };
  }

  const cancelledIds: string[] = [];

  for (const booking of candidates) {
    try {
      await prisma.$transaction(async (tx) => {
        const fresh = await tx.booking.findUnique({
          where: { id: booking.id },
          include: { payment: true },
        });

        if (!fresh) return;
        if (fresh.status !== "PENDING") return;
        if (fresh.createdAt >= threshold) return;

        if (fresh.payment?.status === PaymentStatus.COMPLETED) {
          return;
        }

        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "CANCELLED" },
        });

        if (fresh.payment) {
          await tx.payment.update({
            where: { id: fresh.payment.id },
            data: { status: PaymentStatus.FAILED },
          });
        }
      });

      cancelledIds.push(booking.id);
      auditLogger
        .log("BOOKING_STATUS_UPDATE", "Booking", {
          entityId: booking.id,
          userId: booking.guestId,
          details: {
            auto: true,
            newStatus: "CANCELLED",
            reason: "PAYMENT_TIMEOUT",
          },
        })
        .catch(() => {});
    } catch (err) {
      console.error("Failed to cancel stale booking", booking.id, err);
    }
  }

  return { processed: cancelledIds.length, bookings: cancelledIds };
}

/**
 * Simple runner you could call manually (e.g. from a cron process script)
 */
export async function runCompletionJob() {
  console.log("[BookingCompletion] Job started");
  const completion = await completePastBookings();
  const cancellations = await cancelStalePendingBookings();
  console.log(
    `[BookingCompletion] Completed. Finalized=${completion.processed}, Cancelled=${cancellations.processed} stale bookings.`
  );
  return { completion, cancellations };
}
