import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Wand2,
  Copy,
  Check,
  RefreshCw,
  Eye,
  Download,
  Upload,
} from "lucide-react";
import { cn } from "@/utils/cn";

interface ColorPalette {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  score: number;
  tags: string[];
  accessibility: {
    contrastRatio: number;
    wcagAA: boolean;
    wcagAAA: boolean;
  };
}

interface ColorPaletteGeneratorProps {
  businessType?: string;
  businessName?: string;
  currentColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  onColorsChange: (colors: {
    primary: string;
    secondary: string;
    accent: string;
  }) => void;
  className?: string;
}

export const ColorPaletteGenerator: React.FC<ColorPaletteGeneratorProps> = ({
  businessType = "",
  businessName = "",
  currentColors,
  onColorsChange,
  className,
}) => {
  const [generatedPalettes, setGeneratedPalettes] = useState<ColorPalette[]>(
    []
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedPaletteId, setSelectedPaletteId] = useState<string | null>(
    null
  );
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  // Business type to color associations
  const businessTypeColors = useMemo(
    () => ({
      "real-estate": {
        primary: ["#2563EB", "#1D4ED8", "#3B82F6", "#0EA5E9"], // Blues - trust, professionalism
        secondary: ["#059669", "#10B981", "#065F46", "#064E3B"], // Greens - growth, stability
        themes: ["Professional", "Trustworthy", "Modern", "Sophisticated"],
      },
      "property-management": {
        primary: ["#7C3AED", "#8B5CF6", "#A855F7", "#6366F1"], // Purples - luxury, premium
        secondary: ["#DC2626", "#EF4444", "#F97316", "#EA580C"], // Reds/Oranges - energy, action
        themes: ["Premium", "Luxury", "Dynamic", "Elegant"],
      },
      "vacation-rentals": {
        primary: ["#059669", "#10B981", "#0D9488", "#14B8A6"], // Teals/Greens - relaxation, nature
        secondary: ["#F59E0B", "#FBBF24", "#F97316", "#FB923C"], // Oranges/Yellows - warmth, vacation
        themes: ["Relaxing", "Tropical", "Warm", "Inviting"],
      },
      commercial: {
        primary: ["#374151", "#4B5563", "#6B7280", "#1F2937"], // Grays - corporate, serious
        secondary: ["#2563EB", "#3B82F6", "#1D4ED8", "#1E40AF"], // Blues - business, trust
        themes: ["Corporate", "Professional", "Serious", "Established"],
      },
      default: {
        primary: ["#3B82F6", "#2563EB", "#1D4ED8", "#1E40AF"],
        secondary: ["#10B981", "#059669", "#047857", "#065F46"],
        themes: ["Modern", "Clean", "Professional", "Versatile"],
      },
    }),
    []
  );

  // Generate color palettes based on business context
  const generatePalettes = useCallback(async (): Promise<ColorPalette[]> => {
    const typeKey = businessType
      .toLowerCase()
      .replace(/\s+/g, "-") as keyof typeof businessTypeColors;
    const colorSet = businessTypeColors[typeKey] || businessTypeColors.default;

    const palettes: ColorPalette[] = [];

    // Generate 6 different palette variations
    for (let i = 0; i < 6; i++) {
      const primaryColor = colorSet.primary[i % colorSet.primary.length];
      const secondaryColor = colorSet.secondary[i % colorSet.secondary.length];

      // Generate complementary colors
      const { accent, background, text } = generateComplementaryColors(
        primaryColor,
        secondaryColor
      );

      // Calculate accessibility scores
      const accessibility = calculateAccessibility(
        primaryColor,
        background,
        text
      );

      palettes.push({
        id: `palette-${i + 1}`,
        name: `${colorSet.themes[i % colorSet.themes.length]} ${
          businessType || "Business"
        }`,
        colors: {
          primary: primaryColor,
          secondary: secondaryColor,
          accent,
          background,
          text,
        },
        score: 85 + Math.random() * 15, // Simulated AI score
        tags: [
          colorSet.themes[i % colorSet.themes.length],
          accessibility.wcagAA ? "WCAG AA" : "Needs Contrast",
          getPalettePersonality(primaryColor, secondaryColor),
        ],
        accessibility,
      });
    }

    return palettes.sort((a, b) => b.score - a.score);
  }, [businessType, businessTypeColors]);

  // Generate complementary colors
  const generateComplementaryColors = (primary: string, secondary: string) => {
    // Convert hex to HSL for better color manipulation
    const primaryHsl = hexToHsl(primary);
    const secondaryHsl = hexToHsl(secondary);

    // Generate accent (tertiary color)
    const accentHue = (primaryHsl.h + 120) % 360;
    const accent = hslToHex({
      h: accentHue,
      s: Math.min(primaryHsl.s * 0.8, 80),
      l: Math.min(primaryHsl.l * 1.2, 75),
    });

    // Generate background (light neutral)
    const background = hslToHex({
      h: primaryHsl.h,
      s: 10,
      l: 97,
    });

    // Generate text color (dark contrast)
    const text = hslToHex({
      h: primaryHsl.h,
      s: 15,
      l: 15,
    });

    return { accent, background, text };
  };

  // Get palette personality based on colors
  const getPalettePersonality = (
    primary: string,
    secondary: string
  ): string => {
    const primaryHsl = hexToHsl(primary);

    if (primaryHsl.h >= 0 && primaryHsl.h < 60) return "Energetic";
    if (primaryHsl.h >= 60 && primaryHsl.h < 120) return "Natural";
    if (primaryHsl.h >= 120 && primaryHsl.h < 180) return "Calming";
    if (primaryHsl.h >= 180 && primaryHsl.h < 240) return "Trustworthy";
    if (primaryHsl.h >= 240 && primaryHsl.h < 300) return "Creative";
    return "Sophisticated";
  };

  // Calculate WCAG accessibility scores
  const calculateAccessibility = (
    primary: string,
    background: string,
    text: string
  ) => {
    const contrastRatio = calculateContrastRatio(primary, "#FFFFFF");
    return {
      contrastRatio,
      wcagAA: contrastRatio >= 4.5,
      wcagAAA: contrastRatio >= 7,
    };
  };

  // Calculate contrast ratio between two colors
  const calculateContrastRatio = (color1: string, color2: string): number => {
    const lum1 = getRelativeLuminance(color1);
    const lum2 = getRelativeLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  };

  // Get relative luminance of a color
  const getRelativeLuminance = (hex: string): number => {
    const rgb = hexToRgb(hex);
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  // Color conversion utilities
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 };
  };

  const hexToHsl = (hex: string) => {
    const { r, g, b } = hexToRgb(hex);
    const rNorm = r / 255;
    const gNorm = g / 255;
    const bNorm = b / 255;

    const max = Math.max(rNorm, gNorm, bNorm);
    const min = Math.min(rNorm, gNorm, bNorm);
    let h = 0,
      s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case rNorm:
          h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
          break;
        case gNorm:
          h = (bNorm - rNorm) / d + 2;
          break;
        case bNorm:
          h = (rNorm - gNorm) / d + 4;
          break;
      }
      h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const hslToHex = ({
    h,
    s,
    l,
  }: {
    h: number;
    s: number;
    l: number;
  }): string => {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    let r, g, b;
    if (s === 0) {
      r = g = b = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    const toHex = (c: number) => {
      const hex = Math.round(c * 255).toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Copy color to clipboard
  const copyColor = async (color: string) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedColor(color);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch (err) {
      console.error("Failed to copy color:", err);
    }
  };

  // Auto-generate palettes when business context changes
  useEffect(() => {
    if (businessType || businessName) {
      setIsGenerating(true);

      const timeoutId = setTimeout(async () => {
        try {
          const palettes = await generatePalettes();
          setGeneratedPalettes(palettes);
        } catch (error) {
          console.error("Failed to generate palettes:", error);
        } finally {
          setIsGenerating(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [businessType, businessName, generatePalettes]);

  const handlePaletteSelect = (palette: ColorPalette) => {
    setSelectedPaletteId(palette.id);
    onColorsChange({
      primary: palette.colors.primary,
      secondary: palette.colors.secondary,
      accent: palette.colors.accent,
    });
  };

  const regeneratePalettes = async () => {
    setIsGenerating(true);
    try {
      const palettes = await generatePalettes();
      setGeneratedPalettes(palettes);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">AI Color Palette</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={regeneratePalettes}
            disabled={isGenerating}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={cn(
                "h-4 w-4 text-gray-600",
                isGenerating && "animate-spin"
              )}
            />
          </button>

          <button
            type="button"
            onClick={() => setShowCustomPicker(!showCustomPicker)}
            className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Custom
          </button>
        </div>
      </div>

      {/* Loading State */}
      {isGenerating && (
        <div className="flex items-center justify-center py-8 text-gray-500">
          <Wand2 className="h-5 w-5 mr-2 animate-pulse" />
          <span className="text-sm">Generating perfect palettes...</span>
        </div>
      )}

      {/* Generated Palettes */}
      <AnimatePresence mode="wait">
        {!isGenerating && generatedPalettes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {generatedPalettes.map((palette, index) => (
              <motion.button
                key={palette.id}
                type="button"
                onClick={() => handlePaletteSelect(palette)}
                className={cn(
                  "p-4 rounded-xl border-2 transition-all text-left group hover:scale-105",
                  selectedPaletteId === palette.id
                    ? "border-purple-500 bg-purple-50"
                    : "border-gray-200 hover:border-gray-300"
                )}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {/* Color Preview - Website Style Gradient */}
                <div className="mb-3 space-y-3">
                  {/* Main Gradient Preview */}
                  <div className="relative h-16 rounded-xl overflow-hidden border-2 border-gray-200 hover:border-gray-300 transition-colors">
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(135deg, ${palette.colors.primary} 0%, ${palette.colors.secondary} 100%)`,
                      }}
                    />
                    {/* Accent Color Highlight */}
                    <div
                      className="absolute top-2 right-2 w-8 h-8 rounded-full border-2 border-white shadow-md"
                      style={{ backgroundColor: palette.colors.accent }}
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
                        Click to select
                      </span>
                    </div>
                  </div>

                  {/* Individual Color Swatches */}
                  <div className="flex gap-1">
                    <div
                      className="flex-1 h-6 rounded cursor-pointer border border-gray-200 hover:border-gray-300 transition-colors relative overflow-hidden"
                      style={{ backgroundColor: palette.colors.primary }}
                      onClick={(e) => {
                        e.stopPropagation();
                        copyColor(palette.colors.primary);
                      }}
                      title={`Primary: ${palette.colors.primary}`}
                    >
                      <span className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                        {copiedColor === palette.colors.primary ? (
                          <Check className="h-3 w-3 text-white" />
                        ) : (
                          <Copy className="h-3 w-3 text-white" />
                        )}
                      </span>
                    </div>
                    <div
                      className="flex-1 h-6 rounded cursor-pointer border border-gray-200 hover:border-gray-300 transition-colors relative overflow-hidden"
                      style={{ backgroundColor: palette.colors.secondary }}
                      onClick={(e) => {
                        e.stopPropagation();
                        copyColor(palette.colors.secondary);
                      }}
                      title={`Secondary: ${palette.colors.secondary}`}
                    >
                      <span className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                        {copiedColor === palette.colors.secondary ? (
                          <Check className="h-3 w-3 text-white" />
                        ) : (
                          <Copy className="h-3 w-3 text-white" />
                        )}
                      </span>
                    </div>
                    <div
                      className="flex-1 h-6 rounded cursor-pointer border border-gray-200 hover:border-gray-300 transition-colors relative overflow-hidden"
                      style={{ backgroundColor: palette.colors.accent }}
                      onClick={(e) => {
                        e.stopPropagation();
                        copyColor(palette.colors.accent);
                      }}
                      title={`Accent: ${palette.colors.accent}`}
                    >
                      <span className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                        {copiedColor === palette.colors.accent ? (
                          <Check className="h-3 w-3 text-white" />
                        ) : (
                          <Copy className="h-3 w-3 text-white" />
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Color Labels */}
                  <div className="flex justify-between text-xs text-gray-500 px-1">
                    <span className="font-medium">Primary</span>
                    <span className="font-medium">Secondary</span>
                    <span className="font-medium">Accent</span>
                  </div>
                </div>

                {/* Palette Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm text-gray-900">
                      {palette.name}
                    </h4>
                    <span className="text-xs font-bold text-purple-600">
                      {Math.round(palette.score)}%
                    </span>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {palette.tags.map((tag) => (
                      <span
                        key={tag}
                        className={cn(
                          "px-2 py-0.5 text-xs rounded-full font-medium",
                          tag.includes("WCAG")
                            ? "bg-green-100 text-green-700"
                            : tag === "Needs Contrast"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-100 text-gray-600"
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Accessibility Score */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Eye className="h-3 w-3" />
                    <span>
                      Contrast: {palette.accessibility.contrastRatio.toFixed(1)}
                      :1
                      {palette.accessibility.wcagAA && " ✓ WCAG AA"}
                    </span>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Color Picker */}
      <AnimatePresence>
        {showCustomPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <h4 className="font-medium text-sm text-gray-900 mb-3">
              Custom Colors
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Primary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={currentColors?.primary || "#3B82F6"}
                    onChange={(e) =>
                      onColorsChange({
                        primary: e.target.value,
                        secondary: currentColors?.secondary || "#10B981",
                        accent: currentColors?.accent || "#F59E0B",
                      })
                    }
                    className="w-12 h-8 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={currentColors?.primary || "#3B82F6"}
                    onChange={(e) =>
                      onColorsChange({
                        primary: e.target.value,
                        secondary: currentColors?.secondary || "#10B981",
                        accent: currentColors?.accent || "#F59E0B",
                      })
                    }
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Secondary Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={currentColors?.secondary || "#10B981"}
                    onChange={(e) =>
                      onColorsChange({
                        primary: currentColors?.primary || "#3B82F6",
                        secondary: e.target.value,
                        accent: currentColors?.accent || "#F59E0B",
                      })
                    }
                    className="w-12 h-8 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={currentColors?.secondary || "#10B981"}
                    onChange={(e) =>
                      onColorsChange({
                        primary: currentColors?.primary || "#3B82F6",
                        secondary: e.target.value,
                        accent: currentColors?.accent || "#F59E0B",
                      })
                    }
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="#10B981"
                  />
                </div>
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Accent Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={currentColors?.accent || "#F59E0B"}
                    onChange={(e) =>
                      onColorsChange({
                        primary: currentColors?.primary || "#3B82F6",
                        secondary: currentColors?.secondary || "#10B981",
                        accent: e.target.value,
                      })
                    }
                    className="w-12 h-8 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={currentColors?.accent || "#F59E0B"}
                    onChange={(e) =>
                      onColorsChange({
                        primary: currentColors?.primary || "#3B82F6",
                        secondary: currentColors?.secondary || "#10B981",
                        accent: e.target.value,
                      })
                    }
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
                    placeholder="#F59E0B"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* No Palettes State */}
      {!isGenerating &&
        generatedPalettes.length === 0 &&
        (businessType || businessName) && (
          <div className="text-center py-8 text-gray-500">
            <Palette className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No palettes generated yet.</p>
            <button
              type="button"
              onClick={regeneratePalettes}
              className="mt-2 text-sm text-purple-600 hover:text-purple-700"
            >
              Generate Palettes
            </button>
          </div>
        )}
    </div>
  );
};

export default ColorPaletteGenerator;
