import { prisma } from "@/config/database";
import { BookingStatus } from "@prisma/client";
import { auditLogger } from "./auditLogger";

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

export class InvalidStatusTransitionError extends Error {
  constructor(
    public from: BookingStatus,
    public to: BookingStatus,
    public reason?: string
  ) {
    super(
      `Invalid booking status transition from ${from} to ${to}${
        reason ? `: ${reason}` : ""
      }`
    );
  }
}

// Define valid status transitions in a state machine
export const BOOKING_STATUS_TRANSITIONS: Record<
  BookingStatus,
  BookingStatus[]
> = {
  PENDING: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  CONFIRMED: [
    BookingStatus.CHECKED_IN_CONFIRMED,
    BookingStatus.COMPLETED,
    BookingStatus.CANCELLED,
  ],
  CANCELLED: [], // Terminal state - no transitions allowed
  COMPLETED: [], // Terminal state - no transitions allowed
  PAID: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  CHECKED_IN: [
    BookingStatus.CHECKED_IN_CONFIRMED,
    BookingStatus.CHECKED_OUT,
    BookingStatus.DISPUTE_OPENED,
  ],
  CHECKED_IN_CONFIRMED: [
    BookingStatus.CHECKED_OUT,
    BookingStatus.DISPUTE_OPENED,
  ], // NEW STATE
  DISPUTE_OPENED: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  CHECKED_OUT: [BookingStatus.COMPLETED],
};

// Business rules for status transitions
export const STATUS_TRANSITION_RULES: Partial<
  Record<
    BookingStatus,
    {
      requiresPayment?: boolean;
      allowedPaymentStatuses?: string[];
      requiresCheckIn?: boolean;
      allowRefund?: boolean;
      description: string;
    }
  >
> = {
  [BookingStatus.CONFIRMED]: {
    requiresPayment: true,
    allowedPaymentStatuses: ["COMPLETED"],
    description: "Booking can only be confirmed when payment is completed",
  },
  [BookingStatus.COMPLETED]: {
    requiresCheckIn: true,
    description: "Booking can only be completed after check-in date has passed",
  },
  [BookingStatus.CANCELLED]: {
    allowRefund: true,
    description: "Booking cancellation may trigger refund processing",
  },
};

/**
 * Validates if a status transition is allowed based on business rules
 */
export function isTransitionAllowed(
  from: BookingStatus,
  to: BookingStatus,
  context?: {
    paymentStatus?: string;
    checkInDate?: Date;
    currentDate?: Date;
  }
): { allowed: boolean; reason?: string } {
  // Check if transition exists in state machine
  const allowedTransitions = BOOKING_STATUS_TRANSITIONS[from];
  if (!allowedTransitions.includes(to)) {
    return {
      allowed: false,
      reason: `Direct transition from ${from} to ${to} is not allowed`,
    };
  }

  // Apply business rules
  const rule = STATUS_TRANSITION_RULES[to];
  if (rule) {
    // Check payment requirement for CONFIRMED status
    if (to === BookingStatus.CONFIRMED && rule.requiresPayment) {
      if (
        !context?.paymentStatus ||
        !rule.allowedPaymentStatuses?.includes(context.paymentStatus)
      ) {
        return {
          allowed: false,
          reason: "Payment must be completed before confirming booking",
        };
      }
    }

    // Check check-in date requirement for COMPLETED status
    if (to === BookingStatus.COMPLETED && rule.requiresCheckIn) {
      const currentDate = context?.currentDate || new Date();
      if (context?.checkInDate && context.checkInDate > currentDate) {
        return {
          allowed: false,
          reason: "Cannot complete booking before check-in date",
        };
      }
    }
  }

  return { allowed: true };
}

/**
 * Enhanced atomic booking status transition with validation and audit logging
 */
export async function transitionBookingStatus(
  bookingId: string,
  from: BookingStatus,
  to: BookingStatus,
  options: {
    userId?: string;
    adminId?: string;
    reason?: string;
    extraData?: Record<string, any>;
    skipValidation?: boolean;
  } = {}
) {
  // Get current booking to validate context
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
      property: true,
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  // Validate current status matches expected 'from' status
  if (booking.status !== from) {
    throw new BookingStatusConflictError(
      bookingId,
      from,
      booking.status as BookingStatus
    );
  }

  // Skip validation if explicitly requested (for admin overrides)
  if (!options.skipValidation) {
    const context = {
      paymentStatus: booking.payment?.status,
      checkInDate: booking.checkInDate,
      currentDate: new Date(),
    };

    const validation = isTransitionAllowed(from, to, context);
    if (!validation.allowed) {
      throw new InvalidStatusTransitionError(from, to, validation.reason);
    }
  }

  // Perform atomic status update
  const updated = await prisma.booking.updateMany({
    where: { id: bookingId, status: from },
    data: {
      status: to,
      updatedAt: new Date(),
      ...options.extraData,
    },
  });

  if (updated.count === 0) {
    // Double-check current status for better error reporting
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

  // Get updated booking for return
  const updatedBooking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
      property: true,
      guest: true,
    },
  });

  // Audit log the status change
  try {
    await auditLogger.log("BOOKING_STATUS_UPDATE", "BOOKING", {
      entityId: bookingId,
      userId: options.userId,
      adminId: options.adminId,
      details: {
        from,
        to,
        reason: options.reason,
        propertyId: booking.property.id,
        guestId: booking.guestId,
      },
    });
  } catch (auditError) {
    console.error("Failed to audit log booking status transition:", auditError);
  }

  return updatedBooking;
}

/**
 * Safe status transition that validates business rules and handles errors gracefully
 */
export async function safeTransitionBookingStatus(
  bookingId: string,
  to: BookingStatus,
  options: {
    userId?: string;
    adminId?: string;
    reason?: string;
    extraData?: Record<string, any>;
    skipValidation?: boolean;
  } = {}
): Promise<{ success: boolean; booking?: any; error?: string }> {
  try {
    // Get current status
    const currentBooking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: { status: true },
    });

    if (!currentBooking) {
      return { success: false, error: "Booking not found" };
    }

    const from = currentBooking.status as BookingStatus;

    // Attempt transition
    const booking = await transitionBookingStatus(bookingId, from, to, options);

    return { success: true, booking };
  } catch (error) {
    if (error instanceof BookingStatusConflictError) {
      return {
        success: false,
        error: `Status conflict: booking is in ${error.actual} status, expected ${error.expected}`,
      };
    }

    if (error instanceof InvalidStatusTransitionError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Helper to guard operations that require specific status before performing side-effects
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

/**
 * Get all possible next states for a given booking status
 */
export function getNextAllowedStatuses(
  currentStatus: BookingStatus
): BookingStatus[] {
  return BOOKING_STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Check if a booking can be cancelled based on current status and business rules
 */
export async function canCancelBooking(
  bookingId: string
): Promise<{ canCancel: boolean; reason?: string; refundEligible?: boolean }> {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
      property: {
        include: {
          realtor: true,
        },
      },
    },
  });

  if (!booking) {
    return { canCancel: false, reason: "Booking not found" };
  }

  const currentStatus = booking.status as BookingStatus;

  // Check if cancellation is allowed from current status
  if (
    !BOOKING_STATUS_TRANSITIONS[currentStatus].includes(BookingStatus.CANCELLED)
  ) {
    return {
      canCancel: false,
      reason: `Cannot cancel booking with status ${currentStatus}`,
    };
  }

  // Check timing - prevent cancellation after check-in (NONE tier)
  const now = new Date();
  const checkInDate = new Date(booking.checkInDate);
  const hoursUntilCheckIn =
    (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  // NONE tier: After check-in time, no cancellation allowed
  if (hoursUntilCheckIn <= 0) {
    return {
      canCancel: false,
      reason: "Cannot cancel booking after check-in time",
      refundEligible: false,
    };
  }

  // Determine refund eligibility based on tier
  // EARLY (24+ hours): 90% refund
  // MEDIUM (12-24 hours): 70% refund
  // LATE (0-12 hours): 0% refund (but cancellation allowed)
  const refundEligible = hoursUntilCheckIn >= 12; // Only EARLY and MEDIUM get refunds

  let reason = "";
  if (hoursUntilCheckIn >= 24) {
    reason = "EARLY cancellation: 90% refund to guest";
  } else if (hoursUntilCheckIn >= 12) {
    reason = "MEDIUM cancellation: 70% refund to guest";
  } else {
    reason =
      "LATE cancellation: No refund to guest (realtor receives 80%, platform 20%)";
  }

  return {
    canCancel: true,
    refundEligible,
    reason,
  };
}

/**
 * Batch status update for multiple bookings (useful for admin operations)
 */
export async function batchUpdateBookingStatus(
  bookingIds: string[],
  to: BookingStatus,
  options: {
    adminId: string;
    reason: string;
    skipValidation?: boolean;
  }
): Promise<{
  successful: string[];
  failed: Array<{ bookingId: string; error: string }>;
}> {
  const successful: string[] = [];
  const failed: Array<{ bookingId: string; error: string }> = [];

  for (const bookingId of bookingIds) {
    const result = await safeTransitionBookingStatus(bookingId, to, {
      adminId: options.adminId,
      reason: options.reason,
      skipValidation: options.skipValidation,
    });

    if (result.success) {
      successful.push(bookingId);
    } else {
      failed.push({ bookingId, error: result.error || "Unknown error" });
    }
  }

  return { successful, failed };
}
