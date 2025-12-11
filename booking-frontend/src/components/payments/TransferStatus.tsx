import React from "react";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";

export interface TransferConfirmation {
  status: "pending" | "confirmed" | "failed" | "reversed";
  confirmedAt?: string;
  failureReason?: string;
  webhookReceived?: boolean;
}

interface TransferStatusBadgeProps {
  confirmation: TransferConfirmation;
  showDetails?: boolean;
}

export const TransferStatusBadge: React.FC<TransferStatusBadgeProps> = ({
  confirmation,
  showDetails = false,
}) => {
  const getStatusConfig = () => {
    switch (confirmation.status) {
      case "confirmed":
        return {
          icon: CheckCircle,
          text: "Confirmed",
          color: "text-green-600 bg-green-50 border-green-200",
          iconColor: "text-green-600",
        };
      case "failed":
        return {
          icon: XCircle,
          text: "Failed",
          color: "text-red-600 bg-red-50 border-red-200",
          iconColor: "text-red-600",
        };
      case "reversed":
        return {
          icon: AlertTriangle,
          text: "Reversed",
          color: "text-orange-600 bg-orange-50 border-orange-200",
          iconColor: "text-orange-600",
        };
      case "pending":
      default:
        return {
          icon: Clock,
          text: "Pending",
          color: "text-yellow-600 bg-yellow-50 border-yellow-200",
          iconColor: "text-yellow-600",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="inline-block">
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}
      >
        <Icon className={`h-3.5 w-3.5 ${config.iconColor}`} />
        <span>{config.text}</span>
      </div>

      {showDetails && (
        <div className="mt-2 text-xs text-gray-600">
          {confirmation.status === "confirmed" && confirmation.confirmedAt && (
            <div>
              Confirmed at {new Date(confirmation.confirmedAt).toLocaleString()}
            </div>
          )}
          {confirmation.status === "failed" && confirmation.failureReason && (
            <div className="text-red-600">
              Reason: {confirmation.failureReason}
            </div>
          )}
          {confirmation.webhookReceived === false && (
            <div className="text-yellow-600 mt-1">
              ⚠️ Awaiting webhook confirmation
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface EscrowEventWithStatus {
  id: string;
  eventType: string;
  amount: number;
  executedAt: string;
  transactionReference?: string;
  providerResponse?: {
    transferConfirmed?: boolean;
    transferConfirmedAt?: string;
    transferFailed?: boolean;
    transferReversed?: boolean;
    failureReason?: string;
  };
}

interface TransferTimelineProps {
  events: EscrowEventWithStatus[];
}

export const TransferTimeline: React.FC<TransferTimelineProps> = ({
  events,
}) => {
  const getConfirmationStatus = (
    event: EscrowEventWithStatus
  ): TransferConfirmation => {
    const response = event.providerResponse;

    if (response?.transferReversed) {
      return {
        status: "reversed",
        webhookReceived: true,
      };
    }

    if (response?.transferFailed) {
      return {
        status: "failed",
        failureReason: response.failureReason,
        webhookReceived: true,
      };
    }

    if (response?.transferConfirmed) {
      return {
        status: "confirmed",
        confirmedAt: response.transferConfirmedAt,
        webhookReceived: true,
      };
    }

    return {
      status: "pending",
      webhookReceived: false,
    };
  };

  const formatEventType = (type: string): string => {
    return type
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">Transfer History</h3>

      <div className="space-y-3">
        {events.map((event, index) => {
          const confirmation = getConfirmationStatus(event);

          return (
            <div
              key={event.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 bg-white"
            >
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                {index < events.length - 1 && (
                  <div className="w-0.5 h-full bg-gray-200 mt-1" />
                )}
              </div>

              {/* Event details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">
                      {formatEventType(event.eventType)}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(event.executedAt).toLocaleString()}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-1">
                      ₦{event.amount.toLocaleString()}
                    </p>
                    {event.transactionReference && (
                      <p className="text-xs text-gray-400 mt-1 font-mono">
                        Ref: {event.transactionReference}
                      </p>
                    )}
                  </div>

                  <TransferStatusBadge confirmation={confirmation} />
                </div>

                {/* Show details for failed/reversed transfers */}
                {(confirmation.status === "failed" ||
                  confirmation.status === "reversed") && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-700">
                    {confirmation.failureReason || "Transfer was unsuccessful"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <div className="text-center py-8 text-gray-400 text-sm">
          No transfer history available
        </div>
      )}
    </div>
  );
};
