/**
 * Payment retry status types and utilities
 */

export interface RetryStatus {
  isRetrying: boolean;
  currentAttempt: number;
  maxAttempts: number;
  lastError?: string;
  nextRetryIn?: number; // milliseconds
}

export interface PaymentOperationStatus {
  status: "pending" | "processing" | "retrying" | "success" | "failed";
  retryStatus?: RetryStatus;
  message?: string;
}

/**
 * Calculate next retry delay (exponential backoff)
 */
export function getNextRetryDelay(
  attempt: number,
  initialDelay = 2000,
  multiplier = 2,
  maxDelay = 60000
): number {
  const delay = initialDelay * Math.pow(multiplier, attempt - 1);
  return Math.min(delay, maxDelay);
}

/**
 * Format retry status for display
 */
export function formatRetryStatus(retry: RetryStatus): string {
  if (!retry.isRetrying) return "";

  const remaining = retry.maxAttempts - retry.currentAttempt;
  return `Retrying... (${retry.currentAttempt}/${
    retry.maxAttempts
  }, ${remaining} ${remaining === 1 ? "attempt" : "attempts"} left)`;
}

/**
 * Get retry progress percentage
 */
export function getRetryProgress(retry: RetryStatus): number {
  return (retry.currentAttempt / retry.maxAttempts) * 100;
}

/**
 * Check if operation should show retry UI
 */
export function shouldShowRetryUI(status: PaymentOperationStatus): boolean {
  return status.status === "retrying" && !!status.retryStatus?.isRetrying;
}
