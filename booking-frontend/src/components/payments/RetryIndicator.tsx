import React from "react";
import { Loader2, AlertCircle } from "lucide-react";
import {
  RetryStatus,
  formatRetryStatus,
  getRetryProgress,
} from "@/utils/retryStatus";

interface RetryIndicatorProps {
  retryStatus: RetryStatus;
  className?: string;
}

export const RetryIndicator: React.FC<RetryIndicatorProps> = ({
  retryStatus,
  className = "",
}) => {
  if (!retryStatus.isRetrying) return null;

  const progress = getRetryProgress(retryStatus);
  const statusText = formatRetryStatus(retryStatus);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
        <div
          className="absolute inset-0 rounded-full border-2 border-blue-200"
          style={{
            clipPath: `polygon(0 0, 100% 0, 100% ${progress}%, 0 ${progress}%)`,
          }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700">{statusText}</p>
        {retryStatus.lastError && (
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {retryStatus.lastError}
          </p>
        )}
        {retryStatus.nextRetryIn && retryStatus.nextRetryIn > 0 && (
          <p className="text-xs text-gray-400 mt-0.5">
            Next attempt in {Math.ceil(retryStatus.nextRetryIn / 1000)}s
          </p>
        )}
      </div>
    </div>
  );
};

interface PaymentRetryAlertProps {
  retryStatus: RetryStatus;
  operationType?: string;
}

export const PaymentRetryAlert: React.FC<PaymentRetryAlertProps> = ({
  retryStatus,
  operationType = "operation",
}) => {
  if (!retryStatus.isRetrying) return null;

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-blue-900">
            Retrying {operationType}
          </h4>
          <p className="text-sm text-blue-700 mt-1">
            {formatRetryStatus(retryStatus)}
          </p>

          {retryStatus.lastError && (
            <div className="mt-2 p-2 rounded bg-blue-100 border border-blue-200">
              <p className="text-xs font-medium text-blue-900 mb-1">
                Previous error:
              </p>
              <p className="text-xs text-blue-700">{retryStatus.lastError}</p>
            </div>
          )}

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-blue-600 mb-1">
              <span>Progress</span>
              <span>{Math.round(getRetryProgress(retryStatus))}%</span>
            </div>
            <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${getRetryProgress(retryStatus)}%` }}
              />
            </div>
          </div>

          <p className="text-xs text-blue-600 mt-2">
            Please wait while we process your request. This may take a moment.
          </p>
        </div>
      </div>
    </div>
  );
};

interface RetryFailedAlertProps {
  error: string;
  onRetry?: () => void;
  showRetryButton?: boolean;
}

export const RetryFailedAlert: React.FC<RetryFailedAlertProps> = ({
  error,
  onRetry,
  showRetryButton = true,
}) => {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-red-900">
            Operation Failed
          </h4>
          <p className="text-sm text-red-700 mt-1">
            All retry attempts have been exhausted.
          </p>

          <div className="mt-2 p-2 rounded bg-red-100 border border-red-200">
            <p className="text-xs font-medium text-red-900 mb-1">Error:</p>
            <p className="text-xs text-red-700">{error}</p>
          </div>

          {showRetryButton && onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          )}

          <p className="text-xs text-red-600 mt-2">
            If this issue persists, please contact support.
          </p>
        </div>
      </div>
    </div>
  );
};

interface InlineRetryIndicatorProps {
  isRetrying: boolean;
  attemptNumber?: number;
  maxAttempts?: number;
}

export const InlineRetryIndicator: React.FC<InlineRetryIndicatorProps> = ({
  isRetrying,
  attemptNumber = 1,
  maxAttempts = 3,
}) => {
  if (!isRetrying) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-blue-600">
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      <span className="font-medium">
        Retrying ({attemptNumber}/{maxAttempts})
      </span>
    </span>
  );
};
