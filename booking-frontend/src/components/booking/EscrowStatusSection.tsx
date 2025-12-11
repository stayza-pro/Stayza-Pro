import React from "react";
import { Booking } from "@/types";
import { useTransferStatus } from "@/hooks/useEscrow";
import { TransferTimeline } from "@/components/payments/TransferStatus";
import {
  formatToLocal,
  getDisputeWindowRemaining,
  isUserDisputeWindowOpen,
  isRealtorDisputeWindowOpen,
} from "@/utils/timezone";
import { Clock, Shield, CheckCircle, AlertCircle } from "lucide-react";

interface EscrowStatusSectionProps {
  booking: Booking;
  viewType?: "guest" | "host" | "admin";
}

export const EscrowStatusSection: React.FC<EscrowStatusSectionProps> = ({
  booking,
  viewType = "guest",
}) => {
  const { events, stats, isLoading } = useTransferStatus(booking.id);

  // Determine escrow stage based on booking status and timestamps
  const getEscrowStage = () => {
    if (booking.status === "PENDING" || booking.status === "PAID") {
      return {
        stage: "funds_held",
        title: "Funds Held in Escrow",
        description: "Your payment is securely held until check-in.",
        icon: Shield,
        color: "blue",
      };
    }

    if (booking.status === "CHECKED_IN" && booking.checkInTime) {
      const userWindowOpen = isUserDisputeWindowOpen(booking.checkInTime);

      if (userWindowOpen) {
        return {
          stage: "dispute_window",
          title: "Guest Dispute Window",
          description: `You have ${getDisputeWindowRemaining(
            booking.checkInTime,
            1
          )} to report any issues.`,
          icon: Clock,
          color: "yellow",
        };
      }

      return {
        stage: "room_fee_released",
        title: "Room Fee Released",
        description: "Room fee has been released to the host.",
        icon: CheckCircle,
        color: "green",
      };
    }

    if (booking.status === "CHECKED_OUT" && booking.checkOutTime) {
      const realtorWindowOpen = isRealtorDisputeWindowOpen(
        booking.checkOutTime
      );

      if (realtorWindowOpen) {
        return {
          stage: "realtor_dispute_window",
          title: "Host Dispute Window",
          description: `Host has ${getDisputeWindowRemaining(
            booking.checkOutTime,
            2
          )} to report property damages.`,
          icon: Clock,
          color: "yellow",
        };
      }

      return {
        stage: "deposit_returned",
        title: "Security Deposit Returned",
        description: "Your security deposit has been returned.",
        icon: CheckCircle,
        color: "green",
      };
    }

    if (booking.status === "COMPLETED") {
      return {
        stage: "completed",
        title: "Booking Completed",
        description: "All escrow operations completed successfully.",
        icon: CheckCircle,
        color: "green",
      };
    }

    if (booking.status === "CANCELLED") {
      return {
        stage: "refunded",
        title: "Payment Refunded",
        description:
          "Your payment has been refunded according to the cancellation policy.",
        icon: CheckCircle,
        color: "green",
      };
    }

    if (booking.status === "DISPUTE_OPENED") {
      return {
        stage: "dispute",
        title: "Dispute in Progress",
        description:
          "A dispute has been opened. Funds are held pending resolution.",
        icon: AlertCircle,
        color: "orange",
      };
    }

    return {
      stage: "unknown",
      title: "Status Unknown",
      description: "Unable to determine escrow status.",
      icon: AlertCircle,
      color: "gray",
    };
  };

  const escrowStage = getEscrowStage();
  const Icon = escrowStage.icon;

  return (
    <div className="space-y-6">
      {/* Current Escrow Stage */}
      <div
        className={`bg-${escrowStage.color}-50 border border-${escrowStage.color}-200 rounded-lg p-4`}
      >
        <div className="flex items-start gap-3">
          <Icon
            className={`h-6 w-6 text-${escrowStage.color}-600 flex-shrink-0 mt-0.5`}
          />
          <div className="flex-1">
            <h3
              className={`text-sm font-semibold text-${escrowStage.color}-900`}
            >
              {escrowStage.title}
            </h3>
            <p className={`text-sm text-${escrowStage.color}-700 mt-1`}>
              {escrowStage.description}
            </p>
          </div>
        </div>
      </div>

      {/* Transfer Statistics */}
      {(viewType === "admin" || events.length > 0) && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Confirmed</div>
            <div className="text-2xl font-bold text-green-600">
              {stats.confirmed}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-3">
            <div className="text-xs text-gray-500 mb-1">Pending</div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pending}
            </div>
          </div>

          {stats.failed > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Failed</div>
              <div className="text-2xl font-bold text-red-600">
                {stats.failed}
              </div>
            </div>
          )}

          {stats.reversed > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="text-xs text-gray-500 mb-1">Reversed</div>
              <div className="text-2xl font-bold text-orange-600">
                {stats.reversed}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transfer Timeline */}
      {events.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <TransferTimeline events={events} />
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      )}

      {/* Escrow Protection Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700">
            <p className="font-semibold mb-1">Protected by Escrow System</p>
            <p>
              Your payment is securely held and only released according to the
              booking terms.
              {viewType === "guest" &&
                " You have 1 hour after check-in to report any issues."}
              {viewType === "host" &&
                " You have 2 hours after check-out to report property damages."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
