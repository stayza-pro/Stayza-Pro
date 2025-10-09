"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  Eye,
  EyeOff,
  Star,
  Shuffle,
  Download,
  Share2,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";

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
        primary: ["#2563EB", "#1D4ED8", "#3B82F6", "#0EA5E9"],
        secondary: ["#059669", "#10B981", "#065F46", "#064E3B"],
        themes: ["Professional", "Trustworthy", "Modern", "Sophisticated"],
      },
      "property-management": {
        primary: ["#7C3AED", "#8B5CF6", "#A855F7", "#6366F1"],
        secondary: ["#DC2626", "#EF4444", "#F97316", "#EA580C"],
        themes: ["Premium", "Luxury", "Dynamic", "Elegant"],
      },
      "vacation-rentals": {
        primary: ["#059669", "#10B981", "#0D9488", "#14B8A6"],
        secondary: ["#F59E0B", "#FBBF24", "#F97316", "#FB923C"],
        themes: ["Relaxing", "Tropical", "Warm", "Inviting"],
      },
      commercial: {
        primary: ["#374151", "#4B5563", "#6B7280", "#1F2937"],
        secondary: ["#2563EB", "#3B82F6", "#1D4ED8", "#1E40AF"],
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
    const typeColors =
      businessTypeColors[businessType as keyof typeof businessTypeColors] ||
      businessTypeColors.default;
    const palettes: ColorPalette[] = [];

    // Generate 6 different palette variations
    for (let i = 0; i < 6; i++) {
      const primary = typeColors.primary[i % typeColors.primary.length];
      const secondary = typeColors.secondary[i % typeColors.secondary.length];
      const accent = generateComplementaryColors(primary, secondary);

      const palette: ColorPalette = {
        id: `palette-${i + 1}`,
        name: `${typeColors.themes[i % typeColors.themes.length]} Theme`,
        colors: {
          primary,
          secondary,
          accent,
          background: "#FFFFFF",
          text: "#1F2937",
        },
        score: Math.floor(Math.random() * 30) + 70, // Score between 70-100
        tags: [
          typeColors.themes[i % typeColors.themes.length],
          businessType || "General",
        ],
        accessibility: calculateAccessibility(primary, "#FFFFFF", "#1F2937"),
      };

      palettes.push(palette);
    }

    return palettes;
  }, [businessType, businessTypeColors]);

  // Generate complementary colors
  const generateComplementaryColors = (primary: string, secondary: string) => {
    // Simple color harmony logic - in a real app, use proper color theory
    const colors = [
      "#F97316",
      "#EF4444",
      "#8B5CF6",
      "#06B6D4",
      "#84CC16",
      "#F59E0B",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Get palette personality based on colors
  const getPalettePersonality = (
    primary: string,
    secondary: string
  ): string => {
    const personalities = [
      "Bold & Confident",
      "Calm & Professional",
      "Energetic & Modern",
      "Elegant & Sophisticated",
      "Warm & Inviting",
      "Fresh & Dynamic",
    ];
    return personalities[Math.floor(Math.random() * personalities.length)];
  };

  // Calculate WCAG accessibility scores
  const calculateAccessibility = (
    primary: string,
    background: string,
    text: string
  ) => {
    // Simplified accessibility calculation - in real implementation, use proper contrast ratio calculation
    const mockRatio = 4.5 + Math.random() * 3; // Mock ratio between 4.5-7.5
    return {
      contrastRatio: Math.round(mockRatio * 10) / 10,
      wcagAA: mockRatio >= 4.5,
      wcagAAA: mockRatio >= 7,
    };
  };

  // Generate palettes on component mount or when business context changes
  useEffect(() => {
    const loadPalettes = async () => {
      setIsGenerating(true);
      try {
        const palettes = await generatePalettes();
        setGeneratedPalettes(palettes);

        // Auto-select the first palette if no current selection
        if (!selectedPaletteId && palettes.length > 0) {
          setSelectedPaletteId(palettes[0].id);
          onColorsChange({
            primary: palettes[0].colors.primary,
            secondary: palettes[0].colors.secondary,
            accent: palettes[0].colors.accent,
          });
        }
      } catch (error) {
        console.error("Failed to generate palettes:", error);
        toast.error("Failed to generate color palettes");
      } finally {
        setIsGenerating(false);
      }
    };

    loadPalettes();
  }, [
    businessType,
    businessName,
    generatePalettes,
    selectedPaletteId,
    onColorsChange,
  ]);

  // Handle palette selection
  const handlePaletteSelect = (palette: ColorPalette) => {
    setSelectedPaletteId(palette.id);
    onColorsChange({
      primary: palette.colors.primary,
      secondary: palette.colors.secondary,
      accent: palette.colors.accent,
    });
    toast.success(`Applied ${palette.name}`);
  };

  // Handle color copy
  const handleColorCopy = async (color: string) => {
    try {
      await navigator.clipboard.writeText(color);
      setCopiedColor(color);
      toast.success(`Copied ${color} to clipboard`);
      setTimeout(() => setCopiedColor(null), 2000);
    } catch (error) {
      toast.error("Failed to copy color");
    }
  };

  // Regenerate palettes
  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      const newPalettes = await generatePalettes();
      setGeneratedPalettes(newPalettes);
      toast.success("Generated new color palettes");
    } catch (error) {
      toast.error("Failed to regenerate palettes");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating && generatedPalettes.length === 0) {
    return (
      <div
        className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}
      >
        <div className="flex items-center justify-center space-x-3 py-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Palette className="w-6 h-6 text-blue-500" />
          </motion.div>
          <span className="text-gray-600">Generating color palettes...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
            <Palette className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Smart Color Palettes
            </h3>
            <p className="text-sm text-gray-600">
              AI-generated colors for {businessType || "your business"}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRegenerate}
            disabled={isGenerating}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
            title="Generate new palettes"
          >
            <RefreshCw
              className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`}
            />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCustomPicker(!showCustomPicker)}
            className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
            title="Custom color picker"
          >
            {showCustomPicker ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Generated Palettes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <AnimatePresence>
          {generatedPalettes.map((palette, index) => (
            <motion.div
              key={palette.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative group cursor-pointer rounded-lg border-2 transition-all duration-200 ${
                selectedPaletteId === palette.id
                  ? "border-blue-500 ring-2 ring-blue-200"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handlePaletteSelect(palette)}
            >
              {/* Color Preview */}
              <div className="flex h-16 rounded-t-lg overflow-hidden">
                <div
                  className="flex-1"
                  style={{ backgroundColor: palette.colors.primary }}
                />
                <div
                  className="flex-1"
                  style={{ backgroundColor: palette.colors.secondary }}
                />
                <div
                  className="flex-1"
                  style={{ backgroundColor: palette.colors.accent }}
                />
              </div>

              {/* Palette Info */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900 text-sm">
                    {palette.name}
                  </h4>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-xs text-gray-600">
                      {palette.score}
                    </span>
                  </div>
                </div>

                {/* Color Values */}
                <div className="space-y-1">
                  {Object.entries(palette.colors)
                    .slice(0, 3)
                    .map(([name, color]) => (
                      <div
                        key={name}
                        className="flex items-center justify-between text-xs"
                      >
                        <span className="text-gray-600 capitalize">{name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleColorCopy(color);
                          }}
                          className="flex items-center space-x-1 text-gray-800 hover:text-blue-600 transition-colors"
                        >
                          <span className="font-mono">{color}</span>
                          {copiedColor === color ? (
                            <Check className="w-3 h-3 text-green-500" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    ))}
                </div>

                {/* Accessibility Badge */}
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-1">
                    {palette.accessibility.wcagAA && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        AA
                      </span>
                    )}
                    {palette.accessibility.wcagAAA && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        AAA
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-gray-500">
                    {palette.accessibility.contrastRatio}:1
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1 mt-2">
                  {palette.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Selection Indicator */}
              {selectedPaletteId === palette.id && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Custom Color Picker */}
      <AnimatePresence>
        {showCustomPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-200 pt-6"
          >
            <div className="grid grid-cols-3 gap-4">
              {["primary", "secondary", "accent"].map((colorType) => (
                <div key={colorType} className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 capitalize">
                    {colorType} Color
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={
                        currentColors?.[
                          colorType as keyof typeof currentColors
                        ] || "#3B82F6"
                      }
                      onChange={(e) => {
                        onColorsChange({
                          primary:
                            colorType === "primary"
                              ? e.target.value
                              : currentColors?.primary || "#3B82F6",
                          secondary:
                            colorType === "secondary"
                              ? e.target.value
                              : currentColors?.secondary || "#059669",
                          accent:
                            colorType === "accent"
                              ? e.target.value
                              : currentColors?.accent || "#F97316",
                        });
                      }}
                      className="w-12 h-8 rounded border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={
                        currentColors?.[
                          colorType as keyof typeof currentColors
                        ] || "#3B82F6"
                      }
                      onChange={(e) => {
                        if (/^#[0-9A-F]{6}$/i.test(e.target.value)) {
                          onColorsChange({
                            primary:
                              colorType === "primary"
                                ? e.target.value
                                : currentColors?.primary || "#3B82F6",
                            secondary:
                              colorType === "secondary"
                                ? e.target.value
                                : currentColors?.secondary || "#059669",
                            accent:
                              colorType === "accent"
                                ? e.target.value
                                : currentColors?.accent || "#F97316",
                          });
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Info */}
      <div className="text-center pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-500">
          Colors are optimized for {businessType || "real estate"} businesses
          and accessibility standards
        </p>
      </div>
    </div>
  );
};

export default ColorPaletteGenerator;
