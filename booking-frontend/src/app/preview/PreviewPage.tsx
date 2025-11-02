"use client";
import React, { useState, useEffect } from "react";
import { PreviewHost } from "./components/PreviewHost";

export default function PreviewPage() {
  const [brand, setBrand] = useState({
    name: "Your Agency",
    tagline: "Premium short-let properties",
    color: "#3B82F6",
    logo: undefined,
  });

  // Listen for window events if parent provided initial state
  useEffect(() => {
    const saved = (window as any).__PREVIEW_BRAND_INIT__;
    if (saved) setBrand((prev) => ({ ...prev, ...saved }));
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Live Preview</h2>
      <PreviewHost brand={brand} />
    </div>
  );
}
