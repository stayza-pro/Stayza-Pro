import { prisma } from "@/config/database";
import { auditLogger } from "@/services/auditLogger";

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
 * Simple runner you could call manually (e.g. from a cron process script)
 */
export async function runCompletionJob() {
  console.log("[BookingCompletion] Job started");
  const result = await completePastBookings();
  console.log(
    `[BookingCompletion] Completed. Processed=${result.processed} bookings.`
  );
  return result;
}
