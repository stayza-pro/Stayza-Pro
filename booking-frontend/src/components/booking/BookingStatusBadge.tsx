/**
 * BookingStatusBadge Component
 *
 * Displays booking and payment status with proper colors and formatting
 * Uses centralized enum utilities from @/utils/bookingEnums
 */

import React from "react";
import { BookingStatus, PaymentStatus } from "@/types";
import {
  formatBookingStatus,
  getBookingStatusColor,
  formatPaymentStatus,
  getPaymentStatusColor,
  getBookingStatusSummary,
} from "@/utils/bookingEnums";

interface BookingStatusBadgeProps {
  status: BookingStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({
  status,
  size = "md",
  showIcon = true,
}) => {
  const colors = getBookingStatusColor(status);
  const label = formatBookingStatus(status);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const getStatusIcon = () => {
    switch (status) {
      case "PENDING":
        return (
          <svg
            className={iconSizes[size]}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "ACTIVE":
      case "PAID":
      case "CONFIRMED":
        return (
          <svg
            className={iconSizes[size]}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "CHECKED_IN":
        return (
          <svg
            className={iconSizes[size]}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        );
      case "CHECKED_OUT":
        return (
          <svg
            className={iconSizes[size]}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        );
      case "DISPUTED":
      case "DISPUTE_OPENED":
        return (
          <svg
            className={iconSizes[size]}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case "COMPLETED":
        return (
          <svg
            className={iconSizes[size]}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "CANCELLED":
        return (
          <svg
            className={iconSizes[size]}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium border
        ${colors.bg} ${colors.text} ${colors.border}
        ${sizeClasses[size]}
      `}
    >
      {showIcon && getStatusIcon()}
      {label}
    </span>
  );
};

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  size?: "sm" | "md" | "lg";
}

export const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  size = "md",
}) => {
  const colors = getPaymentStatusColor(status);
  const label = formatPaymentStatus(status);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-3 py-1.5 text-base",
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium border
        ${colors.bg} ${colors.text} ${colors.border}
        ${sizeClasses[size]}
      `}
    >
      {label}
    </span>
  );
};

interface BookingStatusCardProps {
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus;
  className?: string;
}

export const BookingStatusCard: React.FC<BookingStatusCardProps> = ({
  bookingStatus,
  paymentStatus,
  className = "",
}) => {
  const summary = getBookingStatusSummary(bookingStatus, paymentStatus);

  return (
    <div
      className={`
        rounded-lg border p-4
        ${summary.color.bg} ${summary.color.border}
        ${className}
      `}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${summary.color.text}`}>
            {summary.label}
          </h3>
          <p className="mt-1 text-sm text-gray-600">{summary.description}</p>
        </div>
        <div className="ml-4 flex flex-col gap-2">
          <BookingStatusBadge status={bookingStatus} size="sm" />
          <PaymentStatusBadge status={paymentStatus} size="sm" />
        </div>
      </div>
    </div>
  );
};
