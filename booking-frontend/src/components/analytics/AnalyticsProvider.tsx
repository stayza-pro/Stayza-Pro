"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const apiHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com";

export type AnalyticsProviderProps = {
  children: ReactNode;
};

export function AnalyticsProvider({ children }: AnalyticsProviderProps) {
  const initialized = useRef(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hasKey = typeof apiKey === "string" && apiKey.length > 0;

  useEffect(() => {
    if (!hasKey || initialized.current || typeof window === "undefined") {
      return;
    }

    posthog.init(apiKey, {
      api_host: apiHost,
      capture_pageview: false,
      disable_session_recording: true,
      persistence: "memory",
      autocapture: false,
    });

    initialized.current = true;
  }, [hasKey]);

  useEffect(() => {
    if (!hasKey || !initialized.current || typeof window === "undefined") {
      return;
    }

    const search = searchParams?.toString();
    posthog.capture("$pageview", {
      pathname,
      search: search ? `?${search}` : undefined,
    });
  }, [hasKey, pathname, searchParams]);

  if (!hasKey) {
    return <>{children}</>;
  }

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
