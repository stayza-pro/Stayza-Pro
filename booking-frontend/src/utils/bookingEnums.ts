/**
 * Booking & Payment Enum Utilities
 *
 * This file provides utility functions and constants for working with booking
 * and payment enums that match the backend Prisma schema exactly.
 */

import {
  BookingStatus,
  PaymentStatus,
  PayoutStatus,
  RefundTier,
  StayStatus,
} from "@/types";

// ========================
// BookingStatus Utilities
// ========================

/**
 * Valid state transitions for BookingStatus
 * Based on backend state machine in bookingStatus.ts
 */
export const BOOKING_STATUS_TRANSITIONS: Record<
  BookingStatus,
  BookingStatus[]
> = {
  PENDING: ["ACTIVE", "CANCELLED", "EXPIRED"],
  ACTIVE: ["DISPUTED", "COMPLETED", "CANCELLED"],
  DISPUTED: ["COMPLETED", "CANCELLED"],
  COMPLETED: [], // Terminal state
  CANCELLED: [], // Terminal state
  EXPIRED: [], // Terminal state
};

/**
 * Check if a booking status transition is valid
 */
export const isValidBookingStatusTransition = (
  from: BookingStatus,
  to: BookingStatus,
): boolean => {
  return BOOKING_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
};

/**
 * Check if booking status is a terminal state
 */
export const isTerminalBookingStatus = (status: BookingStatus): boolean => {
  return (
    status === "COMPLETED" || status === "CANCELLED" || status === "EXPIRED"
  );
};

/**
 * Check if booking can be cancelled
 */
export const canCancelBooking = (status: BookingStatus): boolean => {
  return ["PENDING", "ACTIVE"].includes(status);
};

/**
 * Format booking status for display
 */
export const formatBookingStatus = (
  status: BookingStatus,
  stayStatus?: StayStatus,
): string => {
  if (status === "ACTIVE") {
    if (stayStatus === "CHECKED_IN") return "Checked In";
    if (stayStatus === "CHECKED_OUT") return "Checked Out";
  }

  const statusMap: Record<BookingStatus, string> = {
    PENDING: "Pending Payment",
    ACTIVE: "Confirmed",
    DISPUTED: "Disputed",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    EXPIRED: "Expired",
  };
  return statusMap[status] || status;
};

/**
 * Get color class for booking status badge
 */
export const getBookingStatusColor = (
  status: BookingStatus,
  stayStatus?: StayStatus,
): {
  bg: string;
  text: string;
  border: string;
} => {
  if (status === "ACTIVE") {
    if (stayStatus === "CHECKED_IN") {
      return {
        bg: "bg-indigo-50",
        text: "text-indigo-700",
        border: "border-indigo-200",
      };
    }
    if (stayStatus === "CHECKED_OUT") {
      return {
        bg: "bg-purple-50",
        text: "text-purple-700",
        border: "border-purple-200",
      };
    }
  }

  const colorMap: Record<
    BookingStatus,
    { bg: string; text: string; border: string }
  > = {
    PENDING: {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      border: "border-yellow-200",
    },
    ACTIVE: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
    },
    DISPUTED: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
    },
    COMPLETED: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
    },
    CANCELLED: {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
    },
    EXPIRED: {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
    },
  };
  return (
    colorMap[status] || {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
    }
  );
};

// ========================
// PaymentStatus Utilities
// ========================

/**
 * Check if payment status indicates money is in escrow
 */
export const isPaymentInEscrow = (status: PaymentStatus): boolean => {
  return ["HELD", "PARTIALLY_RELEASED"].includes(status);
};

/**
 * Check if payment is completed/finalized
 */
export const isPaymentCompleted = (status: PaymentStatus): boolean => {
  return ["SETTLED", "REFUNDED"].includes(status);
};

/**
 * Check if a receipt is available for the payment status
 */
export const canDownloadReceipt = (status?: PaymentStatus | null): boolean => {
  if (!status) return false;
  return ["HELD", "PARTIALLY_RELEASED", "SETTLED"].includes(status);
};

/**
 * Check if payment can be refunded
 */
export const canRefundPayment = (status: PaymentStatus): boolean => {
  return ["HELD"].includes(status); // Only HELD status can be refunded (before check-in)
};

/**
 * Format payment status for display
 */
export const formatPaymentStatus = (status: PaymentStatus): string => {
  const statusMap: Record<PaymentStatus, string> = {
    INITIATED: "Payment Initiated",
    HELD: "In Escrow",
    PARTIALLY_RELEASED: "Partially Released",
    SETTLED: "Completed",
    REFUNDED: "Refunded",
    FAILED: "Failed",
  };
  return statusMap[status] || status;
};

/**
 * Get color class for payment status badge
 */
export const getPaymentStatusColor = (
  status: PaymentStatus,
): {
  bg: string;
  text: string;
  border: string;
} => {
  const colorMap: Record<
    PaymentStatus,
    { bg: string; text: string; border: string }
  > = {
    INITIATED: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    },
    HELD: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
    },
    PARTIALLY_RELEASED: {
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-200",
    },
    SETTLED: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
    },
    REFUNDED: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
    },
    FAILED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  };
  return (
    colorMap[status] || {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
    }
  );
};

// ========================
// PayoutStatus Utilities
// ========================

/**
 * Format payout status for display
 */
export const formatPayoutStatus = (status: PayoutStatus): string => {
  const statusMap: Record<PayoutStatus, string> = {
    PENDING: "Pending Check-in",
    READY: "Ready for Transfer",
    PROCESSING: "Processing Transfer",
    COMPLETED: "Paid Out",
    FAILED: "Transfer Failed",
  };
  return statusMap[status] || status;
};

/**
 * Get color class for payout status badge
 */
export const getPayoutStatusColor = (
  status: PayoutStatus,
): {
  bg: string;
  text: string;
  border: string;
} => {
  const colorMap: Record<
    PayoutStatus,
    { bg: string; text: string; border: string }
  > = {
    PENDING: {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      border: "border-yellow-200",
    },
    READY: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    },
    PROCESSING: {
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-200",
    },
    COMPLETED: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
    },
    FAILED: { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  };
  return (
    colorMap[status] || {
      bg: "bg-gray-50",
      text: "text-gray-700",
      border: "border-gray-200",
    }
  );
};

// ========================
// RefundTier Utilities
// ========================

/**
 * Refund percentage splits for each tier (Room fee only)
 * Format: [Customer%, Realtor%, Platform%]
 * Note: Security deposit always 100% to customer
 *       Service fee and cleaning fee never refunded
 */
export const REFUND_TIER_SPLITS: Record<RefundTier, [number, number, number]> =
  {
    EARLY: [90, 7, 3], // 24+ hours before check-in
    MEDIUM: [90, 7, 3], // mapped to EARLY (legacy - not used)
    LATE: [0, 0, 0], // under 24h - not allowed
    NONE: [0, 0, 0], // After check-in - no cancellation allowed
  };

/**
 * Calculate refund tier based on hours until check-in
 */
export const calculateRefundTier = (hoursUntilCheckIn: number): RefundTier => {
  if (hoursUntilCheckIn >= 24) return "EARLY";
  return "NONE";
};

/**
 * Calculate refund amounts with proper fee breakdown
 * Only room fee is split according to tier
 * Security deposit always 100% to customer
 * Service fee and cleaning fee never refunded
 */
export const calculateRefundAmounts = (
  roomFee: number,
  securityDeposit: number,
  serviceFee: number,
  cleaningFee: number,
  tier: RefundTier,
): {
  customerRefund: number;
  realtorPayout: number;
  platformFee: number;
  breakdown: {
    roomFeeToCustomer: number;
    roomFeeToRealtor: number;
    roomFeeToPlatform: number;
    securityDepositToCustomer: number;
    cleaningFeeToRealtor: number;
    serviceFeeToplatform: number;
  };
} => {
  const [customerPercent, realtorPercent, platformPercent] =
    REFUND_TIER_SPLITS[tier];

  // Room fee split according to tier
  const roomFeeToCustomer = (roomFee * customerPercent) / 100;
  const roomFeeToRealtor = (roomFee * realtorPercent) / 100;
  const roomFeeToPlatform = (roomFee * platformPercent) / 100;

  // Security deposit always 100% to customer
  const securityDepositToCustomer = securityDeposit;

  // Service fee and cleaning fee never refunded
  const cleaningFeeToRealtor = cleaningFee;
  const serviceFeeToplatform = serviceFee;

  return {
    customerRefund: roomFeeToCustomer + securityDepositToCustomer,
    realtorPayout: roomFeeToRealtor + cleaningFeeToRealtor,
    platformFee: roomFeeToPlatform + serviceFeeToplatform,
    breakdown: {
      roomFeeToCustomer,
      roomFeeToRealtor,
      roomFeeToPlatform,
      securityDepositToCustomer,
      cleaningFeeToRealtor,
      serviceFeeToplatform,
    },
  };
};

/**
 * Format refund tier for display
 */
export const formatRefundTier = (tier: RefundTier): string => {
  const tierMap: Record<RefundTier, string> = {
    EARLY: "Early Cancellation (90% room fee refund)",
    MEDIUM: "Early Cancellation (90% room fee refund)",
    LATE: "Cancellation Not Allowed (within 24h of check-in)",
    NONE: "No Cancellation Allowed",
  };
  return tierMap[tier] || tier;
};

/**
 * Get refund tier description
 */
export const getRefundTierDescription = (tier: RefundTier): string => {
  const descMap: Record<RefundTier, string> = {
    EARLY:
      "Cancelled 24+ hours before check-in. You'll receive 90% of room fee + 100% security deposit.",
    MEDIUM:
      "Cancelled 24+ hours before check-in. You'll receive 90% of room fee + 100% security deposit.",
    LATE: "Cancellation not allowed within 24 hours of check-in.",
    NONE: "Booking already started. Cancellation not available.",
  };
  return descMap[tier] || "";
};

/**
 * Get what customer receives back for a tier
 */
export const getCustomerRefundSummary = (tier: RefundTier): string => {
  const summaryMap: Record<RefundTier, string> = {
    EARLY: "90% of room fee + full security deposit",
    MEDIUM: "90% of room fee + full security deposit",
    LATE: "No refund (cancellation not allowed within 24h)",
    NONE: "No refund available",
  };
  return summaryMap[tier] || "";
};

// ========================
// Combined Utilities
// ========================

/**
 * Get booking and payment status summary
 */
export const getBookingStatusSummary = (
  bookingStatus: BookingStatus,
  paymentStatus: PaymentStatus,
  stayStatus?: StayStatus,
): {
  label: string;
  description: string;
  color: { bg: string; text: string; border: string };
} => {
  // Priority order for status display
  if (bookingStatus === "COMPLETED") {
    return {
      label: "Completed",
      description: "This booking has been successfully completed.",
      color: getBookingStatusColor("COMPLETED"),
    };
  }

  if (bookingStatus === "CANCELLED") {
    return {
      label: "Cancelled",
      description:
        paymentStatus === "REFUNDED"
          ? "Booking cancelled. Refund has been processed."
          : "Booking has been cancelled.",
      color: getBookingStatusColor("CANCELLED"),
    };
  }

  if (bookingStatus === "DISPUTED") {
    return {
      label: "Dispute Active",
      description:
        "A dispute has been opened for this booking. Admin review in progress.",
      color: getBookingStatusColor("DISPUTED"),
    };
  }

  if (bookingStatus === "ACTIVE" && stayStatus === "CHECKED_OUT") {
    return {
      label: "Checked Out",
      description: "Guest has checked out. Finalizing payment release.",
      color: getBookingStatusColor("ACTIVE", "CHECKED_OUT"),
    };
  }

  if (bookingStatus === "ACTIVE" && stayStatus === "CHECKED_IN") {
    return {
      label: "In Progress",
      description: "Guest is currently checked in at the property.",
      color: getBookingStatusColor("ACTIVE", "CHECKED_IN"),
    };
  }

  if (bookingStatus === "ACTIVE") {
    return {
      label: "Confirmed",
      description: "Payment received. Your booking is confirmed.",
      color: getBookingStatusColor("ACTIVE"),
    };
  }

  // Default to PENDING
  return {
    label: "Pending Payment",
    description: "Waiting for payment to be completed.",
    color: getBookingStatusColor("PENDING"),
  };
};

/**
 * Check if booking is active (guest is at property)
 */
export const isBookingActive = (
  bookingStatus: BookingStatus,
  stayStatus: StayStatus | undefined,
  checkInDate: Date,
  checkOutDate: Date,
): boolean => {
  const now = new Date();
  return (
    (bookingStatus === "ACTIVE" && stayStatus === "CHECKED_IN") ||
    (bookingStatus === "ACTIVE" && now >= checkInDate && now < checkOutDate)
  );
};

/**
 * Check if booking can be modified
 */
export const canModifyBooking = (
  bookingStatus: BookingStatus,
  checkInDate: Date,
): boolean => {
  const now = new Date();
  const hoursUntilCheckIn =
    (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  return (
    bookingStatus === "PENDING" ||
    (bookingStatus === "ACTIVE" && hoursUntilCheckIn > 24)
  );
};
