"use client";

import React from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Plus, Calendar, DollarSign, Star } from "lucide-react";
import { useBrand } from "../context/BrandContext";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  description: string;
  color: string;
}

export default function QuickActions() {
  const router = useRouter();
  const { brand } = useBrand();

  const actions: QuickAction[] = [
    {
      id: "add-property",
      label: "Add Property",
      icon: Plus,
      href: "/dashboard/properties/new",
      description: "List a new property",
      color: brand.colors.primary,
    },
    {
      id: "view-bookings",
      label: "View Bookings",
      icon: Calendar,
      href: "/dashboard/bookings",
      description: "Manage reservations",
      color: brand.colors.accent,
    },
    {
      id: "withdraw-earnings",
      label: "Withdraw Earnings",
      icon: DollarSign,
      href: "/dashboard/revenue/withdraw",
      description: "Request payout",
      color: brand.colors.success,
    },
    {
      id: "manage-reviews",
      label: "Manage Reviews",
      icon: Star,
      href: "/reviews",
      description: "Respond to feedback",
      color: "#8B5CF6", // Purple
    },
  ];

  const handleActionClick = (href: string) => {
    router.push(href);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action, index) => {
        const Icon = action.icon;
        
        return (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.5, 
              delay: index * 0.1,
              ease: "easeOut"
            }}
            whileHover={{ 
              y: -2,
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleActionClick(action.href)}
            className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-lg transition-all duration-300 text-left group"
          >
            <div className="flex items-center justify-between">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                style={{ backgroundColor: `${action.color}15` }}
              >
                <div style={{ color: action.color }}>
                  <Icon className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                </div>
              </div>
              
              <motion.div 
                className="w-2 h-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ backgroundColor: action.color }}
              />
            </div>

            <div className="mt-4">
              <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                {action.label}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {action.description}
              </p>
            </div>

            {/* Hover Effect Line */}
            <motion.div 
              className="mt-4 h-0.5 bg-gradient-to-r from-transparent via-gray-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ 
                backgroundImage: `linear-gradient(90deg, transparent 0%, ${action.color} 50%, transparent 100%)` 
              }}
            />
          </motion.button>
        );
      })}
    </div>
  );
}
