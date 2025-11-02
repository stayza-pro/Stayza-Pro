"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Calendar,
  DollarSign,
  Star,
  ArrowRight,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface QuickActionsPanelProps {
  brandColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
}

export default function QuickActionsPanel({
  brandColors,
}: QuickActionsPanelProps) {
  const router = useRouter();
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  const actions = [
    {
      id: "add-property",
      label: "Add Property",
      description: "List a new property",
      icon: Plus,
      href: "/properties/new",
      gradient: "from-blue-500 to-blue-600",
      hoverGradient: "from-blue-600 to-blue-700",
      glowColor: "shadow-blue-500/50",
    },
    {
      id: "view-bookings",
      label: "View Bookings",
      description: "Manage reservations",
      icon: Calendar,
      href: "/bookings",
      gradient: "from-green-500 to-green-600",
      hoverGradient: "from-green-600 to-green-700",
      glowColor: "shadow-green-500/50",
    },
    {
      id: "withdraw-earnings",
      label: "Withdraw Earnings",
      description: "Request payout",
      icon: DollarSign,
      href: "/revenue",
      gradient: "from-amber-500 to-amber-600",
      hoverGradient: "from-amber-600 to-amber-700",
      glowColor: "shadow-amber-500/50",
    },
    {
      id: "manage-reviews",
      label: "Manage Reviews",
      description: "Respond to guests",
      icon: Star,
      href: "/reviews",
      gradient: "from-purple-500 to-purple-600",
      hoverGradient: "from-purple-600 to-purple-700",
      glowColor: "shadow-purple-500/50",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Quick Actions</h2>
            <p className="text-sm text-gray-500">Fast access to key features</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const isHovered = hoveredAction === action.id;

          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + index * 0.05, type: "spring" }}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.98 }}
              onHoverStart={() => setHoveredAction(action.id)}
              onHoverEnd={() => setHoveredAction(null)}
              onClick={() => router.push(action.href)}
              className={`relative overflow-hidden group flex flex-col items-center p-5 rounded-2xl border-2 transition-all duration-300 ${
                isHovered
                  ? `${action.glowColor} shadow-xl border-transparent`
                  : "border-gray-200 shadow-sm"
              }`}
            >
              {/* Animated background gradient */}
              <motion.div
                className={`absolute inset-0 bg-gradient-to-br ${
                  isHovered ? action.hoverGradient : action.gradient
                } opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                initial={false}
                animate={isHovered ? { scale: 1.1 } : { scale: 1 }}
              />

              {/* Icon with animation */}
              <motion.div
                animate={isHovered ? { rotate: [0, -10, 10, -10, 0] } : {}}
                transition={{ duration: 0.5 }}
                className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 shadow-lg group-hover:shadow-xl transition-shadow`}
              >
                <Icon className="w-7 h-7 text-white" />

                {/* Glow effect */}
                <motion.div
                  className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${action.gradient} blur-md`}
                  animate={
                    isHovered ? { opacity: [0.3, 0.6, 0.3] } : { opacity: 0 }
                  }
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.div>

              {/* Text content */}
              <div className="relative z-10 text-center">
                <span className="text-sm font-semibold text-gray-900 block mb-1">
                  {action.label}
                </span>
                <span className="text-xs text-gray-500 group-hover:text-gray-700 transition-colors">
                  {action.description}
                </span>
              </div>

              {/* Arrow indicator on hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="absolute top-3 right-3"
                  >
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Bottom bar indicator */}
              <motion.div
                className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${action.gradient}`}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: isHovered ? 1 : 0 }}
                transition={{ duration: 0.3 }}
                style={{ transformOrigin: "left" }}
              />
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
