"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  MapPin,
  User,
  ChevronRight,
  Clock,
  Eye,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Booking {
  id: string;
  guestName: string;
  property: string;
  checkIn: string;
  checkOut: string;
  status: string;
  amount: string;
}

interface RecentBookingsPanelProps {
  bookings: Booking[];
}

export default function RecentBookingsPanel({
  bookings,
}: RecentBookingsPanelProps) {
  const router = useRouter();
  const [hoveredBooking, setHoveredBooking] = useState<string | null>(null);

  const getStatusConfig = (status: string) => {
    const configs: Record<
      string,
      {
        bg: string;
        text: string;
        border: string;
        gradient: string;
        icon: string;
      }
    > = {
      confirmed: {
        bg: "bg-green-50",
        text: "text-green-700",
        border: "border-green-200",
        gradient: "from-green-500 to-emerald-600",
        icon: "✓",
      },
      pending: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        gradient: "from-amber-500 to-orange-600",
        icon: "⏳",
      },
      cancelled: {
        bg: "bg-red-50",
        text: "text-red-700",
        border: "border-red-200",
        gradient: "from-red-500 to-rose-600",
        icon: "✕",
      },
      completed: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        gradient: "from-blue-500 to-indigo-600",
        icon: "✓",
      },
    };
    return (
      configs[status.toLowerCase()] || {
        bg: "bg-gray-50",
        text: "text-gray-700",
        border: "border-gray-200",
        gradient: "from-gray-500 to-gray-600",
        icon: "•",
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.6 }}
      className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Recent Bookings
            </h2>
            <p className="text-sm text-gray-500">
              Latest reservations activity
            </p>
          </div>
        </div>
        <motion.button
          onClick={() => router.push("/bookings")}
          whileHover={{ scale: 1.05, x: 2 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center space-x-1 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 hover:from-purple-100 hover:to-pink-100 font-medium transition-all shadow-sm hover:shadow-md"
        >
          <span className="text-sm">View All</span>
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Bookings List */}
      <div className="space-y-3">
        {bookings.slice(0, 5).map((booking, index) => {
          const isHovered = hoveredBooking === booking.id;
          const statusConfig = getStatusConfig(booking.status);

          return (
            <motion.div
              key={booking.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.05 }}
              onHoverStart={() => setHoveredBooking(booking.id)}
              onHoverEnd={() => setHoveredBooking(null)}
              whileHover={{ scale: 1.02, x: 4 }}
              onClick={() => router.push(`/bookings/${booking.id}`)}
              className={`relative overflow-hidden group flex items-center justify-between p-4 rounded-2xl transition-all cursor-pointer border ${
                isHovered
                  ? "bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 shadow-lg"
                  : "bg-gray-50 border-gray-100 hover:border-gray-200"
              }`}
            >
              {/* Background shimmer effect on hover */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    exit={{ x: "200%" }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                    style={{ pointerEvents: "none" }}
                  />
                )}
              </AnimatePresence>

              <div className="flex items-start space-x-4 flex-1 relative z-10">
                {/* Avatar */}
                <motion.div
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ${statusConfig.bg}`}
                >
                  <User className={`w-6 h-6 ${statusConfig.text}`} />
                </motion.div>

                {/* Booking Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-bold text-gray-900">
                      {booking.guestName}
                    </h4>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                      >
                        <Eye className="w-4 h-4 text-purple-500" />
                      </motion.div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="truncate font-medium">
                      {booking.property}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {booking.checkIn} → {booking.checkOut}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status and Amount */}
              <div className="flex flex-col items-end space-y-2 ml-4 relative z-10">
                <motion.span
                  whileHover={{ scale: 1.1 }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} shadow-sm`}
                >
                  <span className="mr-1">{statusConfig.icon}</span>
                  {booking.status}
                </motion.span>
                <span className="text-base font-bold text-gray-900">
                  {booking.amount}
                </span>
              </div>

              {/* Arrow indicator */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    <ChevronRight className="w-5 h-5 text-purple-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {bookings.length === 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-16"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4"
          >
            <Calendar className="w-10 h-10 text-purple-400" />
          </motion.div>
          <p className="text-gray-500 font-medium">No recent bookings</p>
          <p className="text-sm text-gray-400 mt-1">
            New bookings will appear here
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
