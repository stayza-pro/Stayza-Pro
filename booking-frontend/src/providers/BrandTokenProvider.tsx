"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";

interface BrandTokens {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryContrast: string;
  secondary: string;
  secondaryHover: string;
  secondaryContrast: string;
  accent: string;
  accentHover: string;
  accentContrast: string;
  realtorName: string;
  tagline: string;
  logoUrl: string | undefined;
  description: string;
  realtorId: string | null;
  isLoading: boolean;
}

const BrandTokenContext = createContext<BrandTokens | null>(null);

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const cleaned = hex.replace("#", "");
  if (cleaned.length !== 6 && cleaned.length !== 3) return null;
  const full = cleaned.length === 3
    ? cleaned.split("").map((c) => c + c).join("")
    : cleaned;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#ffffff";
  const lum = relativeLuminance(rgb.r, rgb.g, rgb.b);
  return lum > 0.179 ? "#1a1a2e" : "#ffffff";
}

function adjustBrightness(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const clamp = (v: number) => Math.min(255, Math.max(0, Math.round(v + amount)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function hexToRgbString(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "0, 0, 0";
  return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}

export function BrandTokenProvider({ children }: { children: React.ReactNode }) {
  const {
    brandColor,
    secondaryColor,
    accentColor,
    realtorName,
    tagline,
    logoUrl,
    description,
    realtorId,
    isLoading,
  } = useRealtorBranding();

  const tokens = useMemo<BrandTokens>(() => {
    const p = brandColor || "#0f172a";
    const s = secondaryColor || "#059669";
    const a = accentColor || "#d97706";

    return {
      primary: p,
      primaryHover: adjustBrightness(p, -20),
      primaryLight: `${p}15`,
      primaryContrast: contrastColor(p),
      secondary: s,
      secondaryHover: adjustBrightness(s, -20),
      secondaryContrast: contrastColor(s),
      accent: a,
      accentHover: adjustBrightness(a, -20),
      accentContrast: contrastColor(a),
      realtorName: realtorName || "Stayza Pro",
      tagline: tagline || "Premium short-let properties",
      logoUrl,
      description: description || "",
      realtorId,
      isLoading,
    };
  }, [brandColor, secondaryColor, accentColor, realtorName, tagline, logoUrl, description, realtorId, isLoading]);

  const cssVars = useMemo(
    () =>
      ({
        "--brand-primary": tokens.primary,
        "--brand-primary-hover": tokens.primaryHover,
        "--brand-primary-light": tokens.primaryLight,
        "--brand-primary-contrast": tokens.primaryContrast,
        "--brand-primary-rgb": hexToRgbString(tokens.primary),
        "--brand-secondary": tokens.secondary,
        "--brand-secondary-hover": tokens.secondaryHover,
        "--brand-secondary-contrast": tokens.secondaryContrast,
        "--brand-secondary-rgb": hexToRgbString(tokens.secondary),
        "--brand-accent": tokens.accent,
        "--brand-accent-hover": tokens.accentHover,
        "--brand-accent-contrast": tokens.accentContrast,
        "--brand-accent-rgb": hexToRgbString(tokens.accent),
      }) as React.CSSProperties,
    [tokens]
  );

  return (
    <BrandTokenContext.Provider value={tokens}>
      <div style={cssVars} className="contents">
        {children}
      </div>
    </BrandTokenContext.Provider>
  );
}

export function useBrandTokens(): BrandTokens {
  const ctx = useContext(BrandTokenContext);
  if (!ctx) {
    return {
      primary: "#0f172a",
      primaryHover: "#0a1022",
      primaryLight: "#0f172a15",
      primaryContrast: "#ffffff",
      secondary: "#059669",
      secondaryHover: "#047857",
      secondaryContrast: "#ffffff",
      accent: "#d97706",
      accentHover: "#b45309",
      accentContrast: "#ffffff",
      realtorName: "Stayza Pro",
      tagline: "Premium short-let properties",
      logoUrl: undefined,
      description: "",
      realtorId: null,
      isLoading: false,
    };
  }
  return ctx;
}
