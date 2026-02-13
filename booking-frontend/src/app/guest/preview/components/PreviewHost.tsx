"use client";
import React, { useEffect, useRef } from "react";

interface BrandData {
  name?: string;
  tagline?: string;
  color?: string;
  logo?: string;
}

export const PreviewHost: React.FC<{ brand: BrandData }> = ({ brand }) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  useEffect(() => {
    if (!iframeRef.current) return;
    try {
      iframeRef.current.contentWindow?.postMessage(
        { __PREVIEW_BRAND__: brand },
        "*",
      );
    } catch (e) {
      // Cross origin might throw; still OK
    }
  }, [brand]);

  const query = new URLSearchParams();
  if (brand.name) query.set("name", brand.name);
  if (brand.tagline) query.set("tagline", brand.tagline);
  if (brand.color) query.set("color", brand.color);
  if (brand.logo) query.set("logo", brand.logo);

  const src = `/preview/temp?${query.toString()}`;

  return (
    <div className="border rounded-xl overflow-hidden h-[55dvh] min-h-[320px] md:h-[65dvh] lg:h-[700px] lg:max-h-[700px] bg-gray-50">
      <iframe
        ref={iframeRef}
        src={src}
        className="w-full h-full"
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  );
};
