import { logger } from "./logger";

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 30000, // 30 seconds
  backoffMultiplier: 2, // Exponential backoff
  retryableErrors: [
    "ECONNRESET",
    "ETIMEDOUT",
    "ENOTFOUND",
    "ENETUNREACH",
    "EHOSTUNREACH",
    "EAI_AGAIN",
    "ECONNREFUSED",
  ],
};

/**
 * Exponential backoff retry wrapper for async operations
 *
 * @param operation - The async operation to retry
 * @param operationName - Name for logging purposes
 * @param options - Retry configuration
 * @returns The result of the operation
 * @throws The last error if all retries fail
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_OPTIONS, ...options };
  let lastError: any;
  let delay = config.initialDelayMs;

  for (let attempt = 1; attempt <= config.maxRetries + 1; attempt++) {
    try {
      const result = await operation();

      if (attempt > 1) {
        logger.info(`${operationName} succeeded after ${attempt} attempts`);
      }

      return result;
    } catch (error: any) {
      lastError = error;

      // Check if this is the last attempt
      if (attempt > config.maxRetries) {
        logger.error(`${operationName} failed after ${attempt} attempts`, {
          error: error.message,
          stack: error.stack,
        });
        throw error;
      }

      // Check if error is retryable
      const isRetryable = isRetryableError(error, config.retryableErrors);

      if (!isRetryable) {
        logger.warn(`${operationName} failed with non-retryable error`, {
          error: error.message,
          errorCode: error.code,
        });
        throw error;
      }

      // Log retry attempt
      logger.warn(
        `${operationName} failed (attempt ${attempt}/${
          config.maxRetries + 1
        }), retrying in ${delay}ms`,
        {
          error: error.message,
          errorCode: error.code,
          attempt,
          delay,
        }
      );

      // Wait before retrying
      await sleep(delay);

      // Calculate next delay with exponential backoff
      delay = Math.min(delay * config.backoffMultiplier, config.maxDelayMs);
    }
  }

  throw lastError;
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any, retryableErrors: string[]): boolean {
  // Network errors
  if (error.code && retryableErrors.includes(error.code)) {
    return true;
  }

  // HTTP errors - retry on 5xx and specific 4xx
  if (error.response?.status) {
    const status = error.response.status;

    // Always retry server errors (5xx)
    if (status >= 500 && status < 600) {
      return true;
    }

    // Retry specific client errors
    if ([408, 429].includes(status)) {
      return true; // Request Timeout, Too Many Requests
    }
  }

  // Gateway-specific retryable errors
  if (error.message) {
    const retryableMessages = [
      "timeout",
      "timed out",
      "network error",
      "connection error",
      "socket hang up",
      "ESOCKETTIMEDOUT",
      "rate limit",
      "too many requests",
    ];

    const messageLower = error.message.toLowerCase();
    if (retryableMessages.some((msg) => messageLower.includes(msg))) {
      return true;
    }
  }

  return false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry wrapper specifically for payment gateway operations
 */
export async function withPaymentRetry<T>(
  operation: () => Promise<T>,
  operationName: string,
  provider: "paystack"
): Promise<T> {
  return withRetry(operation, `${provider.toUpperCase()} ${operationName}`, {
    maxRetries: 3,
    initialDelayMs: 2000, // Start with 2 seconds for payment operations
    maxDelayMs: 60000, // Max 1 minute
    backoffMultiplier: 2,
  });
}
