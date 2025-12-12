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
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["CONFIRMED", "CHECKED_IN", "CANCELLED"],
  CONFIRMED: ["CHECKED_IN", "CANCELLED"], // Deprecated status
  CHECKED_IN: ["CHECKED_OUT", "DISPUTE_OPENED"],
  DISPUTE_OPENED: ["COMPLETED", "CANCELLED"],
  CHECKED_OUT: ["COMPLETED"],
  COMPLETED: [], // Terminal state
  CANCELLED: [], // Terminal state
};

/**
 * Check if a booking status transition is valid
 */
export const isValidBookingStatusTransition = (
  from: BookingStatus,
  to: BookingStatus
): boolean => {
  return BOOKING_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
};

/**
 * Check if booking status is a terminal state
 */
export const isTerminalBookingStatus = (status: BookingStatus): boolean => {
  return status === "COMPLETED" || status === "CANCELLED";
};

/**
 * Check if booking can be cancelled
 */
export const canCancelBooking = (status: BookingStatus): boolean => {
  return ["PENDING", "PAID", "CONFIRMED"].includes(status);
};

/**
 * Format booking status for display
 */
export const formatBookingStatus = (status: BookingStatus): string => {
  const statusMap: Record<BookingStatus, string> = {
    PENDING: "Pending Payment",
    PAID: "Paid",
    CONFIRMED: "Confirmed",
    CHECKED_IN: "Checked In",
    DISPUTE_OPENED: "Dispute Opened",
    CHECKED_OUT: "Checked Out",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };
  return statusMap[status] || status;
};

/**
 * Get color class for booking status badge
 */
export const getBookingStatusColor = (
  status: BookingStatus
): {
  bg: string;
  text: string;
  border: string;
} => {
  const colorMap: Record<
    BookingStatus,
    { bg: string; text: string; border: string }
  > = {
    PENDING: {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      border: "border-yellow-200",
    },
    PAID: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200",
    },
    CONFIRMED: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
    },
    CHECKED_IN: {
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-200",
    },
    DISPUTE_OPENED: {
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
    },
    CHECKED_OUT: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
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
  return ["ESCROW_HELD", "ROOM_FEE_SPLIT_RELEASED"].includes(status);
};

/**
 * Check if payment is completed/finalized
 */
export const isPaymentCompleted = (status: PaymentStatus): boolean => {
  return [
    "COMPLETED",
    "RELEASED_TO_REALTOR",
    "REFUNDED_TO_CUSTOMER",
    "PARTIAL_PAYOUT_REALTOR",
  ].includes(status);
};

/**
 * Check if payment can be refunded
 */
export const canRefundPayment = (status: PaymentStatus): boolean => {
  return ["ESCROW_HELD", "ROOM_FEE_SPLIT_RELEASED"].includes(status);
};

/**
 * Format payment status for display
 */
export const formatPaymentStatus = (status: PaymentStatus): string => {
  const statusMap: Record<PaymentStatus, string> = {
    INITIATED: "Payment Initiated",
    PENDING: "Pending Confirmation",
    ESCROW_HELD: "In Escrow",
    ROOM_FEE_SPLIT_RELEASED: "Partially Released",
    RELEASED_TO_REALTOR: "Released to Host",
    REFUNDED_TO_CUSTOMER: "Refunded",
    PARTIAL_PAYOUT_REALTOR: "Partially Released",
    COMPLETED: "Completed",
    FAILED: "Failed",
  };
  return statusMap[status] || status;
};

/**
 * Get color class for payment status badge
 */
export const getPaymentStatusColor = (
  status: PaymentStatus
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
    PENDING: {
      bg: "bg-yellow-50",
      text: "text-yellow-700",
      border: "border-yellow-200",
    },
    ESCROW_HELD: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200",
    },
    ROOM_FEE_SPLIT_RELEASED: {
      bg: "bg-indigo-50",
      text: "text-indigo-700",
      border: "border-indigo-200",
    },
    RELEASED_TO_REALTOR: {
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
    },
    REFUNDED_TO_CUSTOMER: {
      bg: "bg-orange-50",
      text: "text-orange-700",
      border: "border-orange-200",
    },
    PARTIAL_PAYOUT_REALTOR: {
      bg: "bg-teal-50",
      text: "text-teal-700",
      border: "border-teal-200",
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
  status: PayoutStatus
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
 * Refund percentage splits for each tier
 * Format: [Guest%, Realtor%, Platform%]
 */
export const REFUND_TIER_SPLITS: Record<RefundTier, [number, number, number]> =
  {
    EARLY: [90, 7, 3], // 24+ hours before check-in
    MEDIUM: [70, 20, 10], // 12-24 hours before check-in
    LATE: [0, 80, 20], // 0-12 hours before check-in
    NONE: [0, 100, 0], // After check-in or no refund
  };

/**
 * Calculate refund tier based on hours until check-in
 */
export const calculateRefundTier = (hoursUntilCheckIn: number): RefundTier => {
  if (hoursUntilCheckIn < 0) return "NONE";
  if (hoursUntilCheckIn < 12) return "LATE";
  if (hoursUntilCheckIn < 24) return "MEDIUM";
  return "EARLY";
};

/**
 * Calculate refund amounts based on tier
 */
export const calculateRefundAmounts = (
  totalAmount: number,
  tier: RefundTier
): {
  guestRefund: number;
  realtorPayout: number;
  platformFee: number;
} => {
  const [guestPercent, realtorPercent, platformPercent] =
    REFUND_TIER_SPLITS[tier];

  return {
    guestRefund: (totalAmount * guestPercent) / 100,
    realtorPayout: (totalAmount * realtorPercent) / 100,
    platformFee: (totalAmount * platformPercent) / 100,
  };
};

/**
 * Format refund tier for display
 */
export const formatRefundTier = (tier: RefundTier): string => {
  const tierMap: Record<RefundTier, string> = {
    EARLY: "Full Refund (90%)",
    MEDIUM: "Partial Refund (70%)",
    LATE: "No Refund",
    NONE: "No Refund Available",
  };
  return tierMap[tier] || tier;
};

/**
 * Get refund tier description
 */
export const getRefundTierDescription = (tier: RefundTier): string => {
  const descMap: Record<RefundTier, string> = {
    EARLY: "Cancelled 24+ hours before check-in. You'll receive 90% refund.",
    MEDIUM: "Cancelled 12-24 hours before check-in. You'll receive 70% refund.",
    LATE: "Cancelled 0-12 hours before check-in. No refund available.",
    NONE: "Booking already started or completed. No refund available.",
  };
  return descMap[tier] || "";
};

// ========================
// Combined Utilities
// ========================

/**
 * Get booking and payment status summary
 */
export const getBookingStatusSummary = (
  bookingStatus: BookingStatus,
  paymentStatus: PaymentStatus
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
        paymentStatus === "REFUNDED_TO_CUSTOMER"
          ? "Booking cancelled. Refund has been processed."
          : "Booking has been cancelled.",
      color: getBookingStatusColor("CANCELLED"),
    };
  }

  if (bookingStatus === "DISPUTE_OPENED") {
    return {
      label: "Dispute Active",
      description:
        "A dispute has been opened for this booking. Admin review in progress.",
      color: getBookingStatusColor("DISPUTE_OPENED"),
    };
  }

  if (bookingStatus === "CHECKED_OUT") {
    return {
      label: "Checked Out",
      description: "Guest has checked out. Finalizing payment release.",
      color: getBookingStatusColor("CHECKED_OUT"),
    };
  }

  if (bookingStatus === "CHECKED_IN") {
    return {
      label: "In Progress",
      description: "Guest is currently checked in at the property.",
      color: getBookingStatusColor("CHECKED_IN"),
    };
  }

  if (bookingStatus === "PAID" || bookingStatus === "CONFIRMED") {
    return {
      label: "Confirmed",
      description: "Payment received. Your booking is confirmed.",
      color: getBookingStatusColor("PAID"),
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
  checkInDate: Date,
  checkOutDate: Date
): boolean => {
  const now = new Date();
  return (
    bookingStatus === "CHECKED_IN" ||
    (bookingStatus === "PAID" && now >= checkInDate && now < checkOutDate)
  );
};

/**
 * Check if booking can be modified
 */
export const canModifyBooking = (
  bookingStatus: BookingStatus,
  checkInDate: Date
): boolean => {
  const now = new Date();
  const hoursUntilCheckIn =
    (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  return (
    bookingStatus === "PENDING" ||
    (bookingStatus === "PAID" && hoursUntilCheckIn > 24)
  );
};
