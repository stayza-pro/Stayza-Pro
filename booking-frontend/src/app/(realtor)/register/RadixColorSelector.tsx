"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

interface ColorOption {
  name: string;
  hex: string;
  tailwindClass: string;
  category: string;
}

interface SelectedColors {
  primary?: string;
  secondary?: string;
  accent?: string;
}

interface RadixColorSelectorProps {
  selectedColors: SelectedColors;
  onColorSelect: (
    colorType: "primary" | "secondary" | "accent",
    color: string,
    name: string
  ) => void;
  className?: string;
}

// Expanded Radix-inspired color palette with professional business colors
const radixColors: ColorOption[] = [
  // Professional Blues (Trust & Reliability)
  {
    name: "Royal Blue",
    hex: "#1E40AF",
    tailwindClass: "bg-blue-800",
    category: "blue",
  },
  {
    name: "Blue",
    hex: "#3B82F6",
    tailwindClass: "bg-blue-500",
    category: "blue",
  },
  {
    name: "Sky Blue",
    hex: "#0EA5E9",
    tailwindClass: "bg-sky-500",
    category: "blue",
  },
  {
    name: "Light Blue",
    hex: "#0284C7",
    tailwindClass: "bg-sky-600",
    category: "blue",
  },
  {
    name: "Indigo",
    hex: "#6366F1",
    tailwindClass: "bg-indigo-500",
    category: "blue",
  },
  {
    name: "Navy",
    hex: "#1E3A8A",
    tailwindClass: "bg-blue-900",
    category: "blue",
  },

  // Success Greens (Growth & Prosperity)
  {
    name: "Forest Green",
    hex: "#047857",
    tailwindClass: "bg-emerald-700",
    category: "green",
  },
  {
    name: "Emerald",
    hex: "#10B981",
    tailwindClass: "bg-emerald-500",
    category: "green",
  },
  {
    name: "Green",
    hex: "#22C55E",
    tailwindClass: "bg-green-500",
    category: "green",
  },
  {
    name: "Lime",
    hex: "#84CC16",
    tailwindClass: "bg-lime-500",
    category: "green",
  },
  {
    name: "Mint",
    hex: "#6EE7B7",
    tailwindClass: "bg-emerald-300",
    category: "green",
  },
  {
    name: "Teal",
    hex: "#14B8A6",
    tailwindClass: "bg-teal-500",
    category: "green",
  },

  // Premium Purples (Luxury & Creativity)
  {
    name: "Deep Purple",
    hex: "#7C3AED",
    tailwindClass: "bg-violet-600",
    category: "purple",
  },
  {
    name: "Purple",
    hex: "#A855F7",
    tailwindClass: "bg-purple-500",
    category: "purple",
  },
  {
    name: "Violet",
    hex: "#8B5CF6",
    tailwindClass: "bg-violet-500",
    category: "purple",
  },
  {
    name: "Lavender",
    hex: "#C4B5FD",
    tailwindClass: "bg-violet-300",
    category: "purple",
  },

  // Energy Reds & Oranges (Action & Warmth)
  {
    name: "Crimson",
    hex: "#DC2626",
    tailwindClass: "bg-red-600",
    category: "red",
  },
  { name: "Red", hex: "#EF4444", tailwindClass: "bg-red-500", category: "red" },
  {
    name: "Rose",
    hex: "#F43F5E",
    tailwindClass: "bg-rose-500",
    category: "red",
  },
  {
    name: "Coral",
    hex: "#FB7185",
    tailwindClass: "bg-rose-400",
    category: "red",
  },
  {
    name: "Orange",
    hex: "#F97316",
    tailwindClass: "bg-orange-500",
    category: "orange",
  },
  {
    name: "Amber",
    hex: "#F59E0B",
    tailwindClass: "bg-amber-500",
    category: "orange",
  },

  // Elegant Pinks (Modern & Approachable)
  {
    name: "Hot Pink",
    hex: "#EC4899",
    tailwindClass: "bg-pink-500",
    category: "pink",
  },
  {
    name: "Fuchsia",
    hex: "#D946EF",
    tailwindClass: "bg-fuchsia-500",
    category: "pink",
  },
  {
    name: "Pink",
    hex: "#F472B6",
    tailwindClass: "bg-pink-400",
    category: "pink",
  },
  {
    name: "Blush",
    hex: "#FBBF24",
    tailwindClass: "bg-pink-300",
    category: "pink",
  },

  // Professional Teals & Cyans (Balance & Clarity)
  {
    name: "Dark Teal",
    hex: "#0891B2",
    tailwindClass: "bg-cyan-600",
    category: "teal",
  },
  {
    name: "Cyan",
    hex: "#06B6D4",
    tailwindClass: "bg-cyan-500",
    category: "teal",
  },
  {
    name: "Turquoise",
    hex: "#22D3EE",
    tailwindClass: "bg-cyan-400",
    category: "teal",
  },

  // Sophisticated Yellows (Optimism & Energy)
  {
    name: "Golden",
    hex: "#D97706",
    tailwindClass: "bg-amber-600",
    category: "yellow",
  },
  {
    name: "Yellow",
    hex: "#EAB308",
    tailwindClass: "bg-yellow-500",
    category: "yellow",
  },
  {
    name: "Sunshine",
    hex: "#FDE047",
    tailwindClass: "bg-yellow-300",
    category: "yellow",
  },

  // Professional Grays (Timeless & Sophisticated)
  {
    name: "Charcoal",
    hex: "#374151",
    tailwindClass: "bg-gray-700",
    category: "gray",
  },
  {
    name: "Slate",
    hex: "#64748B",
    tailwindClass: "bg-slate-500",
    category: "gray",
  },
  {
    name: "Gray",
    hex: "#6B7280",
    tailwindClass: "bg-gray-500",
    category: "gray",
  },
  {
    name: "Silver",
    hex: "#9CA3AF",
    tailwindClass: "bg-gray-400",
    category: "gray",
  },

  // Business Special Colors
  {
    name: "Bronze",
    hex: "#92400E",
    tailwindClass: "bg-amber-800",
    category: "special",
  },
  {
    name: "Copper",
    hex: "#B45309",
    tailwindClass: "bg-amber-700",
    category: "special",
  },
  {
    name: "Mahogany",
    hex: "#7F1D1D",
    tailwindClass: "bg-red-900",
    category: "special",
  },
];

export const RadixColorSelector: React.FC<RadixColorSelectorProps> = ({
  selectedColors,
  onColorSelect,
  className = "",
}) => {
  const [activeSelection, setActiveSelection] = React.useState<
    "primary" | "secondary" | "accent"
  >("primary");

  const getSelectedColorInfo = (
    colorType: "primary" | "secondary" | "accent"
  ) => {
    const selectedHex = selectedColors[colorType];
    return radixColors.find((color) => color.hex === selectedHex);
  };

  // Group colors by category for better organization
  const colorsByCategory = radixColors.reduce((acc, color) => {
    if (!acc[color.category]) {
      acc[color.category] = [];
    }
    acc[color.category].push(color);
    return acc;
  }, {} as Record<string, ColorOption[]>);

  const categoryNames = {
    blue: "Professional Blues",
    green: "Success Greens",
    purple: "Premium Purples",
    red: "Energy Reds",
    orange: "Warm Oranges",
    pink: "Modern Pinks",
    teal: "Balanced Teals",
    yellow: "Optimistic Yellows",
    gray: "Sophisticated Grays",
    special: "Signature Colors",
  };

  const isColorSelected = (colorHex: string) => {
    return Object.values(selectedColors).includes(colorHex);
  };

  const getColorSelectionType = (
    colorHex: string
  ): "primary" | "secondary" | "accent" | null => {
    if (selectedColors.primary === colorHex) return "primary";
    if (selectedColors.secondary === colorHex) return "secondary";
    if (selectedColors.accent === colorHex) return "accent";
    return null;
  };

  const getSelectionBadgeColor = (selectionType: string) => {
    switch (selectionType) {
      case "primary":
        return "bg-blue-600";
      case "secondary":
        return "bg-emerald-600";
      case "accent":
        return "bg-purple-600";
      default:
        return "bg-gray-600";
    }
  };

  const getSelectionRingColor = (selectionType: string) => {
    switch (selectionType) {
      case "primary":
        return "ring-blue-600 bg-blue-50";
      case "secondary":
        return "ring-emerald-600 bg-emerald-50";
      case "accent":
        return "ring-purple-600 bg-purple-50";
      default:
        return "ring-gray-600 bg-gray-50";
    }
  };

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header Section with Color Selection Controls */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
        <div className="flex flex-col gap-8">
          {/* Color Type Selection */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select Colors For:
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Choose which color slot you want to fill
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {(["primary", "secondary", "accent"] as const).map(
                (colorType) => (
                  <button
                    key={colorType}
                    type="button"
                    onClick={() => setActiveSelection(colorType)}
                    className={`
                    flex-1 px-6 py-4 text-sm font-semibold rounded-xl border-2 transition-all duration-200
                    ${
                      activeSelection === colorType
                        ? colorType === "primary"
                          ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200"
                          : colorType === "secondary"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-200"
                          : "bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm"
                    }
                  `}
                  >
                    {colorType.charAt(0).toUpperCase() + colorType.slice(1)}{" "}
                    Color
                  </button>
                )
              )}
            </div>
          </div>

          {/* Selected Colors Preview */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Selected Colors:
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Your chosen brand palette
              </p>
            </div>
            <div className="flex justify-between">
              {(["primary", "secondary", "accent"] as const).map(
                (colorType) => {
                  const colorInfo = getSelectedColorInfo(colorType);
                  const hasColor = selectedColors[colorType];
                  return (
                    <div key={colorType} className="text-center group">
                      <div
                        className={`
                        w-16 h-16 rounded-2xl border-2 mb-3 mx-auto shadow-sm transition-all duration-200
                        ${
                          hasColor
                            ? "border-gray-200 group-hover:shadow-md"
                            : "border-dashed border-gray-300 bg-gray-50"
                        }
                      `}
                        style={{
                          backgroundColor:
                            selectedColors[colorType] || "transparent",
                        }}
                        title={
                          colorInfo
                            ? `${colorInfo.name} (${colorInfo.hex})`
                            : "No color selected"
                        }
                      />
                      <p className="text-xs font-medium text-gray-700 capitalize">
                        {colorType}
                      </p>
                      {colorInfo && (
                        <p className="text-xs text-gray-500 mt-1 font-mono">
                          {colorInfo.hex}
                        </p>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Color Palette Categories */}
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Choose Your Brand Colors
          </h3>
          <p className="text-gray-600">
            Select colors that represent your brand personality and values
          </p>
        </div>

        <div className="grid gap-6">
          {Object.entries(colorsByCategory).map(
            ([category, colors], categoryIndex) => (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.1 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow duration-200"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-semibold text-gray-900">
                    {categoryNames[category as keyof typeof categoryNames] ||
                      category}
                  </h4>
                  <div className="text-sm text-gray-500">
                    {colors.length} colors
                  </div>
                </div>

                {/* Color Grid */}
                <div className="grid grid-cols-6 gap-4">
                  {colors.map((color, colorIndex) => {
                    const selectionType = getColorSelectionType(color.hex);
                    const isSelected = isColorSelected(color.hex);

                    return (
                      <motion.div
                        key={color.hex}
                        className="flex flex-col items-center group"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          delay:
                            (categoryIndex * colors.length + colorIndex) * 0.01,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            onColorSelect(
                              activeSelection,
                              color.hex,
                              color.name
                            )
                          }
                          className={`
                          relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl transition-all duration-200 
                          shadow-sm hover:shadow-md focus:outline-none focus:shadow-lg
                          ${color.tailwindClass}
                          ${
                            isSelected
                              ? `ring-4 ring-offset-2 ${getSelectionRingColor(
                                  selectionType || ""
                                )}`
                              : "hover:ring-2 hover:ring-gray-300 hover:ring-offset-2 hover:scale-105"
                          }
                        `}
                          title={`${color.name} (${color.hex})`}
                        >
                          {/* Selection Indicator */}
                          {isSelected && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute inset-0 flex items-center justify-center"
                            >
                              <div
                                className={`
                                w-6 h-6 rounded-full flex items-center justify-center shadow-lg
                                ${getSelectionBadgeColor(selectionType || "")}
                              `}
                              >
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            </motion.div>
                          )}
                        </button>

                        {/* Color Name */}
                        <div className="mt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <p className="text-xs font-medium text-gray-700">
                            {color.name}
                          </p>
                          <p className="text-xs text-gray-500 font-mono">
                            {color.hex}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )
          )}
        </div>
      </div>

      {/* Your Color Palette Summary */}
      {(selectedColors.primary ||
        selectedColors.secondary ||
        selectedColors.accent) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200 shadow-sm p-8"
        >
          <div className="text-center mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Your Color Palette
            </h3>
            <p className="text-gray-600">
              Preview how your selected colors work together
            </p>
          </div>

          <div className="grid gap-6 max-w-2xl mx-auto">
            {(["primary", "secondary", "accent"] as const).map((colorType) => {
              const colorInfo = getSelectedColorInfo(colorType);
              if (!colorInfo) return null;

              return (
                <motion.div
                  key={colorType}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="group"
                >
                  <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 group-hover:-translate-y-1">
                    {/* Large Color Circle */}
                    <div className="flex justify-center mb-4">
                      <div
                        className="w-20 h-20 rounded-2xl shadow-lg border-2 border-white"
                        style={{ backgroundColor: colorInfo.hex }}
                      />
                    </div>

                    {/* Color Info */}
                    <div className="text-center space-y-2">
                      <div className="flex items-center justify-center gap-2">
                        <div
                          className={`
                            w-3 h-3 rounded-full
                            ${getSelectionBadgeColor(colorType)}
                          `}
                        />
                        <h4 className="text-lg font-semibold text-gray-900 capitalize">
                          {colorType}
                        </h4>
                      </div>

                      <p className="text-sm font-medium text-gray-700">
                        {colorInfo.name}
                      </p>

                      <p className="text-sm text-gray-500 font-mono bg-gray-50 rounded-lg px-3 py-2">
                        {colorInfo.hex}
                      </p>

                      {/* Usage Preview */}
                      <div className="mt-4 pt-4 border-t border-gray-100">
                        <div
                          className="text-xs font-medium px-3 py-2 rounded-lg text-white"
                          style={{ backgroundColor: colorInfo.hex }}
                        >
                          Preview Button
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Palette Actions */}
          <div className="flex justify-center mt-8 pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-200">
              ✨ Your brand colors are ready to use
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RadixColorSelector;
