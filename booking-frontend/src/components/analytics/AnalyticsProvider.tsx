"use client";

import type { ReactNode } from "react";

export type AnalyticsProviderProps = {
  children: ReactNode;
};

// MVP Version: Simple analytics provider without external tracking
// Advanced analytics features will be added in post-MVP releases
export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  // For MVP, we're just passing through children without analytics
  // This can be enhanced with PostHog, Google Analytics, etc. in future releases

  if (process.env.NODE_ENV === "development") {
    console.log(
      "Analytics disabled for MVP - will be enabled in future releases"
    );
  }

  return <>{children}</>;
}
