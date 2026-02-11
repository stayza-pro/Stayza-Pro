"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import posthog from "posthog-js";
import { useAuthStore } from "@/store/authStore";
import { clearUserContext, logError, setUserContext } from "@/utils/errorLogger";

export type AnalyticsProviderProps = {
  children: ReactNode;
};

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const { user } = useAuthStore();

  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost =
      process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

    if (!posthogKey) {
      return;
    }

    try {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        capture_pageview: true,
        capture_pageleave: true,
      });

      if (typeof window !== "undefined") {
        window.posthog = posthog;
      }
    } catch (error) {
      logError(error, {
        component: "AnalyticsProvider",
        action: "posthog_init",
      });
    }
  }, []);

  useEffect(() => {
    if (user?.id) {
      setUserContext(user.id, user.email, user.role);
      return;
    }

    clearUserContext();
  }, [user?.email, user?.id, user?.role]);

  if (process.env.NODE_ENV === "development") {
    // This confirms provider initialization during local development.
    console.info("[analytics] provider initialized");
  }

  return <>{children}</>;
}
