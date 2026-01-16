/**
 * Error logging utility
 * Can be easily upgraded to use Sentry, LogRocket, or similar service
 * For now, provides structured logging to console with optional future integration
 */

interface ErrorContext {
  userId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, any>;
}

class ErrorLogger {
  private isProduction = process.env.NODE_ENV === "production";
  private sentryEnabled = false; // Set to true after integrating Sentry

  /**
   * Log an error with context
   */
  logError(error: Error | unknown, context?: ErrorContext): void {
    const errorData = {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      ...context,
    };

    // Log to console in development
    if (!this.isProduction) {
      
    }

    // In production, send to error tracking service
    if (this.isProduction && this.sentryEnabled) {
      // TODO: Send to Sentry or other error tracking service
      // Example with Sentry:
      // Sentry.captureException(error, {
      //   contexts: { custom: context },
      // });
    }

    // Always log to console for now
    
  }

  /**
   * Log a warning
   */
  logWarning(message: string, context?: ErrorContext): void {
    const warningData = {
      message,
      level: "warning",
      timestamp: new Date().toISOString(),
      ...context,
    };

    

    if (this.isProduction && this.sentryEnabled) {
      // TODO: Send to Sentry
      // Sentry.captureMessage(message, {
      //   level: 'warning',
      //   contexts: { custom: context },
      // });
    }
  }

  /**
   * Log info (for tracking important events)
   */
  logInfo(message: string, metadata?: Record<string, any>): void {
    const infoData = {
      message,
      level: "info",
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    

    // Can send to analytics service
    if (this.isProduction) {
      // TODO: Send to analytics (Google Analytics, Mixpanel, etc.)
    }
  }

  /**
   * Track user action for analytics
   */
  trackAction(
    action: string,
    category: string,
    metadata?: Record<string, any>
  ): void {
    const actionData = {
      action,
      category,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    

    if (this.isProduction) {
      // TODO: Send to analytics service
      // Example with Google Analytics:
      // gtag('event', action, {
      //   event_category: category,
      //   ...metadata,
      // });
    }
  }

  /**
   * Set user context for error tracking
   */
  setUserContext(userId: string, email?: string, role?: string): void {
    if (this.sentryEnabled) {
      // TODO: Set Sentry user context
      // Sentry.setUser({
      //   id: userId,
      //   email,
      //   role,
      // });
    }

    
  }

  /**
   * Clear user context (on logout)
   */
  clearUserContext(): void {
    if (this.sentryEnabled) {
      // TODO: Clear Sentry user context
      // Sentry.setUser(null);
    }

    
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger();

// Helper functions for easy usage
export const logError = (error: Error | unknown, context?: ErrorContext) =>
  errorLogger.logError(error, context);

export const logWarning = (message: string, context?: ErrorContext) =>
  errorLogger.logWarning(message, context);

export const logInfo = (message: string, metadata?: Record<string, any>) =>
  errorLogger.logInfo(message, metadata);

export const trackAction = (
  action: string,
  category: string,
  metadata?: Record<string, any>
) => errorLogger.trackAction(action, category, metadata);

export const setUserContext = (userId: string, email?: string, role?: string) =>
  errorLogger.setUserContext(userId, email, role);

export const clearUserContext = () => errorLogger.clearUserContext();
