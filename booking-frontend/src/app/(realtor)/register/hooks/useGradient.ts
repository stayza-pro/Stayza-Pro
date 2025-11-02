import { useMemo } from "react";
import { BrandColors } from "../types/preview";

interface GradientOptions {
  angle?: string;
  opacity?: number;
  fallback?: string;
}

export const useGradient = (
  colors: BrandColors,
  options: GradientOptions = {}
) => {
  const { angle = "135deg", opacity = 1, fallback = "#374151" } = options;

  const gradients = useMemo(() => {
    const validColors = [
      colors.primary,
      colors.secondary,
      colors.accent,
      colors.neutral,
    ]
      .filter(Boolean)
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .slice(0, 4);

    if (validColors.length === 0) {
      return {
        primary: fallback,
        secondary: `${fallback}80`,
        linear: fallback,
        radial: fallback,
        mesh: fallback,
      };
    }

    if (validColors.length === 1) {
      const primary = validColors[0];
      return {
        primary,
        secondary: `${primary}80`,
        linear: primary,
        radial: primary,
        mesh: primary,
      };
    }

    const stops = validColors
      .map(
        (color, idx) => `${color} ${(idx / (validColors.length - 1)) * 100}%`
      )
      .join(", ");

    return {
      primary: validColors[0],
      secondary: validColors[1] || `${validColors[0]}80`,
      linear: `linear-gradient(${angle}, ${stops})`,
      radial: `radial-gradient(circle, ${stops})`,
      mesh: `linear-gradient(${angle}, ${validColors[0]}${Math.round(
        opacity * 255
      ).toString(16)}, ${validColors[1] || validColors[0]}${Math.round(
        opacity * 128
      ).toString(16)})`,
    };
  }, [
    colors.primary,
    colors.secondary,
    colors.accent,
    colors.neutral,
    angle,
    opacity,
    fallback,
  ]);

  const getCSSVar = (colorName: keyof BrandColors) => {
    return `var(--preview-${colorName}, ${colors[colorName] || fallback})`;
  };

  const setCSSVars = () => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.style.setProperty("--preview-primary", colors.primary || fallback);
      root.style.setProperty(
        "--preview-secondary",
        colors.secondary || fallback
      );
      root.style.setProperty("--preview-accent", colors.accent || fallback);
      root.style.setProperty("--preview-neutral", colors.neutral || fallback);
    }
  };

  return {
    ...gradients,
    getCSSVar,
    setCSSVars,
    colors: colors,
  };
};

// WCAG contrast compliance checker
export const checkContrast = (
  foreground: string,
  background: string
): "AAA" | "AA" | "fail" => {
  // Convert hex to RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const getLuminance = (r: number, g: number, b: number) => {
    const [rs, gs, bs] = [r, g, b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const fg = hexToRgb(foreground);
  const bg = hexToRgb(background);

  if (!fg || !bg) return "fail";

  const fgLum = getLuminance(fg.r, fg.g, fg.b);
  const bgLum = getLuminance(bg.r, bg.g, bg.b);

  const ratio =
    (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05);

  if (ratio >= 7) return "AAA";
  if (ratio >= 4.5) return "AA";
  return "fail";
};
