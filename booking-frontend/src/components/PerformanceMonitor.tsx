"use client";

import { useEffect } from "react";

/**
 * Performance monitoring component to track and optimize rendering
 * Helps prevent forced reflows and layout thrashing
 */
export function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Batch DOM reads and writes to prevent forced reflows
    let rafId: number;
    const pendingReads: Array<() => void> = [];
    const pendingWrites: Array<() => void> = [];

    const flushQueue = () => {
      // Execute all reads first
      pendingReads.forEach((fn) => fn());
      pendingReads.length = 0;

      // Then execute all writes
      pendingWrites.forEach((fn) => fn());
      pendingWrites.length = 0;
    };

    const scheduleFlush = () => {
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          flushQueue();
          rafId = 0;
        });
      }
    };

    // Make batch utilities available globally
    (window as any).__batchDOMRead = (fn: () => void) => {
      pendingReads.push(fn);
      scheduleFlush();
    };

    (window as any).__batchDOMWrite = (fn: () => void) => {
      pendingWrites.push(fn);
      scheduleFlush();
    };

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, []);

  return null;
}
