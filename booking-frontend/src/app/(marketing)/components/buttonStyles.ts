import type { CSSProperties } from "react";

import { palette } from "@/app/(marketing)/content";

export type ButtonStyleVars = CSSProperties & Record<string, string>;

export const lightOnDarkCTAStyles: ButtonStyleVars = {
  "--btn-bg": palette.neutralLight,
  "--btn-hover-bg":
    "color-mix(in srgb, var(--marketing-surface, #F3F4F6) 92%, white 8%)",
  "--btn-text": palette.primary,
  "--btn-hover-text": palette.primary,
  "--btn-border": palette.neutralLight,
  "--btn-ring": palette.primary,
  "--btn-ring-offset":
    "color-mix(in srgb, var(--marketing-primary, #1E3A8A) 14%, transparent)",
  boxShadow: "0 20px 48px rgba(30,58,138,0.18)",
};

export const outlineOnDarkCTAStyles: ButtonStyleVars = {
  "--btn-bg": "transparent",
  "--btn-hover-bg":
    "color-mix(in srgb, var(--marketing-primary-foreground, #f1f5f9) 16%, transparent)",
  "--btn-text": palette.primaryForeground,
  "--btn-hover-text": palette.primaryForeground,
  "--btn-border": palette.primaryForeground,
  "--btn-ring": palette.primaryForeground,
  "--btn-ring-offset":
    "color-mix(in srgb, var(--marketing-primary, #1E3A8A) 18%, transparent)",
  boxShadow: "none",
};
