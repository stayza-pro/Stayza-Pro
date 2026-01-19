"use client";

import { type ComponentType, type ReactElement, lazy, Suspense } from "react";

interface LazyLoadSectionProps {
  /**
   * A function that returns a dynamic import
   * Example: () => import('./MySection')
   */
  importFn: () => Promise<{ default: ComponentType<any> }>;
  /**
   * Fallback content while loading (optional)
   */
  fallback?: ReactElement | null;
  /**
   * Props to pass to the loaded component
   */
  componentProps?: Record<string, any>;
}

/**
 * Lazy load a section/component to improve initial page load performance
 * Uses React.lazy and Suspense for code splitting
 */
export function LazyLoadSection({
  importFn,
  fallback = null,
  componentProps = {},
}: LazyLoadSectionProps) {
  const LazyComponent = lazy(importFn);

  return (
    <Suspense fallback={fallback}>
      <LazyComponent {...componentProps} />
    </Suspense>
  );
}

/**
 * Skeleton loader for sections
 */
export function SectionSkeleton() {
  return (
    <div className="py-24 animate-pulse">
      <div className="container-custom">
        <div className="h-8 w-64 bg-gray-200 rounded-lg mb-4 mx-auto"></div>
        <div className="h-4 w-96 bg-gray-200 rounded-lg mb-12 mx-auto"></div>
        <div className="grid md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    </div>
  );
}
