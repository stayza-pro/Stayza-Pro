import { prisma } from "@/config/database";
import { BookingStatus } from "@prisma/client";

export class BookingStatusConflictError extends Error {
  constructor(
    public bookingId: string,
    public expected: BookingStatus,
    public actual?: BookingStatus
  ) {
    super(
      `Booking ${bookingId} status conflict. Expected ${expected} got ${actual}`
    );
  }
}

/**
 * Attempt an atomic booking status transition ensuring current status matches expected.
 * Returns updated record or throws BookingStatusConflictError if mismatch.
 */
export async function transitionBookingStatus(
  bookingId: string,
  from: BookingStatus,
  to: BookingStatus,
  extraData: Record<string, any> = {}
) {
  const updated = await prisma.booking.updateMany({
    where: { id: bookingId, status: from },
    data: { status: to, ...extraData },
  });
  if (updated.count === 0) {
    const current = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { status: true },
    });
    throw new BookingStatusConflictError(
      bookingId,
      from,
      current?.status as BookingStatus | undefined
    );
  }
  return prisma.booking.findUnique({ where: { id: bookingId } });
}

/**
 * Helper to guard operations that require a stable status before performing side-effects.
 * It fetches booking and verifies it hasn't diverged.
 */
export async function assertBookingStatus(
  bookingId: string,
  allowed: BookingStatus[]
) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new Error("Booking not found");
  if (!allowed.includes(booking.status as BookingStatus)) {
    throw new BookingStatusConflictError(
      bookingId,
      allowed[0],
      booking.status as BookingStatus
    );
  }
  return booking;
}
