"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Wrench,
  CheckCircle2,
  Sparkles,
  Eye,
} from "lucide-react";

interface UpcomingEventsPanelProps {
  brandColors?: {
    primary?: string;
    accent?: string;
    success?: string;
  };
}

export default function UpcomingEventsPanel({
  brandColors,
}: UpcomingEventsPanelProps) {
  const [hoveredEvent, setHoveredEvent] = useState<number | null>(null);

  const events = [
    {
      id: 1,
      type: "inspection",
      icon: CheckCircle2,
      title: "Property Inspection",
      subtitle: "Luxury 2BR Apartment",
      location: "Downtown Lagos",
      time: "Tomorrow, 10:00 AM",
      priority: "high",
      gradient: "from-blue-500 to-indigo-600",
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
      emoji: "🏠",
    },
    {
      id: 2,
      type: "checkin",
      icon: User,
      title: "Guest Check-in",
      subtitle: "John & Mary Smith",
      location: "Marina Suite #305",
      time: "Dec 28, 3:00 PM",
      priority: "medium",
      gradient: "from-amber-500 to-orange-600",
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
      emoji: "👥",
    },
    {
      id: 3,
      type: "maintenance",
      icon: Wrench,
      title: "Maintenance Schedule",
      subtitle: "AC Service - Unit 204",
      location: "Parkview Estate",
      time: "Dec 30, 9:00 AM",
      priority: "low",
      gradient: "from-green-500 to-emerald-600",
      bg: "bg-green-50",
      iconColor: "text-green-600",
      emoji: "🔧",
    },
  ];

  const priorityConfig = {
    high: {
      badge: "Urgent",
      badgeBg: "bg-red-100",
      badgeText: "text-red-700",
    },
    medium: {
      badge: "Important",
      badgeBg: "bg-amber-100",
      badgeText: "text-amber-700",
    },
    low: {
      badge: "Scheduled",
      badgeBg: "bg-green-100",
      badgeText: "text-green-700",
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay: 0.8 }}
      className="bg-white rounded-3xl p-6 shadow-lg border border-gray-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-start space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">
              Upcoming Events
            </h2>
            <p className="text-sm text-gray-500">Your schedule at a glance</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.95 }}
          className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </motion.button>
      </div>

      {/* Events List */}
      <div className="space-y-3">
        {events.map((event, index) => {
          const Icon = event.icon;
          const isHovered = hoveredEvent === event.id;
          const priority =
            priorityConfig[event.priority as keyof typeof priorityConfig];

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + index * 0.08 }}
              onHoverStart={() => setHoveredEvent(event.id)}
              onHoverEnd={() => setHoveredEvent(null)}
              whileHover={{ scale: 1.02, x: 4 }}
              className="relative overflow-hidden group cursor-pointer"
            >
              {/* Card Container */}
              <div
                className={`relative p-4 rounded-2xl border-2 transition-all ${
                  isHovered
                    ? `border-transparent shadow-xl ${event.bg}`
                    : "border-gray-100 bg-gray-50 shadow-sm"
                }`}
              >
                {/* Animated shimmer effect on hover */}
                {isHovered && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl"
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    style={{
                      background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)`,
                    }}
                  />
                )}

                {/* Gradient overlay on hover */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-br ${event.gradient} opacity-0`}
                  animate={{ opacity: isHovered ? 0.08 : 0 }}
                  transition={{ duration: 0.3 }}
                />

                <div className="relative z-10 flex items-start space-x-4">
                  {/* Timeline indicator */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                      className={`relative w-12 h-12 rounded-xl ${event.bg} shadow-md flex items-center justify-center`}
                    >
                      <Icon className={`w-6 h-6 ${event.iconColor}`} />
                      {/* Emoji badge */}
                      <span className="absolute -top-1 -right-1 text-xs">
                        {event.emoji}
                      </span>
                    </motion.div>
                    {/* Connecting line */}
                    {index < events.length - 1 && (
                      <div className="w-0.5 h-6 bg-gradient-to-b from-gray-300 to-transparent mt-2" />
                    )}
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 min-w-0">
                    {/* Title & Priority */}
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-base mb-1">
                          {event.title}
                        </h3>
                        <p className="text-sm text-gray-700 font-medium">
                          {event.subtitle}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-bold ${priority.badgeBg} ${priority.badgeText}`}
                      >
                        {priority.badge}
                      </span>
                    </div>

                    {/* Location & Time */}
                    <div className="space-y-1.5">
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium">{event.location}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs text-gray-600">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="font-medium">{event.time}</span>
                      </div>
                    </div>
                  </div>

                  {/* Hover Action Icon */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex-shrink-0"
                      >
                        <div
                          className={`w-8 h-8 rounded-lg ${event.bg} flex items-center justify-center shadow-md`}
                        >
                          <Eye className={`w-4 h-4 ${event.iconColor}`} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State (if no events) */}
      {events.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          </motion.div>
          <p className="text-gray-500 font-medium">No upcoming events</p>
          <p className="text-sm text-gray-400 mt-1">Your schedule is clear!</p>
        </motion.div>
      )}

      {/* View All Button */}
      <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className="relative w-full mt-6 py-3 rounded-xl font-bold text-sm text-white overflow-hidden shadow-lg group"
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

        {/* Animated shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-30"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />

        {/* Button content */}
        <span className="relative z-10 flex items-center justify-center space-x-2">
          <Calendar className="w-4 h-4" />
          <span>View Full Calendar</span>
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.div>
        </span>

        {/* Sparkle on hover */}
        <AnimatePresence>
          <motion.div
            className="absolute top-2 right-2"
            initial={{ opacity: 0, scale: 0, rotate: 0 }}
            whileHover={{ opacity: 1, scale: 1, rotate: 180 }}
            exit={{ opacity: 0, scale: 0 }}
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </motion.div>
        </AnimatePresence>
      </motion.button>
    </motion.div>
  );
}
