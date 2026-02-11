interface ErrorContext {
  userId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

type LogLevel = "error" | "warning" | "info";

type AnalyticsClient = {
  capture?: (event: string, properties?: Record<string, unknown>) => void;
  identify?: (id: string, properties?: Record<string, unknown>) => void;
  reset?: () => void;
};

type VercelAnalyticsClient = {
  track?: (event: string, data?: Record<string, unknown>) => void;
};

type LogPayload = {
  timestamp: string;
  environment: string | undefined;
  url: string | undefined;
  userAgent: string | undefined;
  userId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
};

declare global {
  interface Window {
    posthog?: AnalyticsClient;
    va?: VercelAnalyticsClient;
  }
}

class ErrorLogger {
  private readonly isProduction = process.env.NODE_ENV === "production";
  private readonly logEndpoint = process.env.NEXT_PUBLIC_CLIENT_LOG_ENDPOINT;
  private userContext: { userId: string; email?: string; role?: string } | null =
    null;

  private basePayload(context?: ErrorContext): LogPayload {
    return {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      userId: context?.userId || this.userContext?.userId,
      component: context?.component,
      action: context?.action,
      metadata: context?.metadata,
    };
  }

  private analyticsClients():
    | { posthog?: AnalyticsClient; vercel?: VercelAnalyticsClient }
    | undefined {
    if (typeof window === "undefined") return undefined;

    return {
      posthog: window.posthog,
      vercel: window.va,
    };
  }

  private sendToEndpoint(level: LogLevel, payload: LogPayload): void {
    if (!this.logEndpoint || typeof window === "undefined") return;

    fetch(this.logEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ level, ...payload }),
      keepalive: true,
    }).catch(() => {
      // Avoid recursive logging if endpoint itself fails.
    });
  }

  private capture(event: string, payload: LogPayload): void {
    const clients = this.analyticsClients();
    clients?.posthog?.capture?.(event, payload);
    clients?.vercel?.track?.(event, payload);
  }

  logError(error: Error | unknown, context?: ErrorContext): void {
    const payload: LogPayload = {
      ...this.basePayload(context),
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    };

    if (!this.isProduction) {
      console.error("[errorLogger] error", payload);
    }

    this.capture("frontend_error", payload);
    this.sendToEndpoint("error", payload);
  }

  logWarning(message: string, context?: ErrorContext): void {
    const payload: LogPayload = {
      ...this.basePayload(context),
      message,
      level: "warning",
    };

    if (!this.isProduction) {
      console.warn("[errorLogger] warning", payload);
    }

    this.capture("frontend_warning", payload);
    this.sendToEndpoint("warning", payload);
  }

  logInfo(message: string, metadata?: Record<string, unknown>): void {
    const payload: LogPayload = {
      ...this.basePayload({ metadata }),
      message,
      level: "info",
    };

    if (!this.isProduction) {
      console.info("[errorLogger] info", payload);
    }

    this.capture("frontend_info", payload);
    this.sendToEndpoint("info", payload);
  }

  trackAction(
    action: string,
    category: string,
    metadata?: Record<string, unknown>
  ): void {
    const payload: LogPayload = {
      ...this.basePayload({ action, metadata }),
      action,
      category,
    };

    if (!this.isProduction) {
      console.info("[errorLogger] action", payload);
    }

    this.capture(`action_${category}`, payload);
  }

  setUserContext(userId: string, email?: string, role?: string): void {
    this.userContext = { userId, email, role };

    const clients = this.analyticsClients();
    clients?.posthog?.identify?.(userId, { email, role });

    if (!this.isProduction) {
      console.info("[errorLogger] user context set", this.userContext);
    }
  }

  clearUserContext(): void {
    this.userContext = null;

    const clients = this.analyticsClients();
    clients?.posthog?.reset?.();

    if (!this.isProduction) {
      console.info("[errorLogger] user context cleared");
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
