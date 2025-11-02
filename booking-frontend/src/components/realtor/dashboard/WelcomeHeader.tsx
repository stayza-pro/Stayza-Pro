"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  MessageSquare,
  TrendingUp,
  Sun,
  Moon,
  Sunrise,
  Sunset,
} from "lucide-react";

interface WelcomeHeaderProps {
  userName: string;
  todayStats: {
    newBookings: number;
    checkIns: number;
    messages: number;
  };
  brandColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    success?: string;
  };
}

export default function WelcomeHeader({
  userName,
  todayStats,
  brandColors,
}: WelcomeHeaderProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12)
      return { text: "Good Morning", icon: Sunrise, color: "text-amber-500" };
    if (hour < 17)
      return { text: "Good Afternoon", icon: Sun, color: "text-orange-500" };
    if (hour < 21)
      return { text: "Good Evening", icon: Sunset, color: "text-pink-500" };
    return { text: "Good Night", icon: Moon, color: "text-indigo-500" };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  const quickStats = [
    {
      label: "New Bookings",
      value: todayStats.newBookings,
      icon: Calendar,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700",
    },
    {
      label: "Check-Ins Today",
      value: todayStats.checkIns,
      icon: TrendingUp,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-700",
    },
    {
      label: "Messages",
      value: todayStats.messages,
      icon: MessageSquare,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8"
    >
      {/* Background gradient decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-50 via-purple-50 to-transparent rounded-full blur-3xl opacity-50 -z-0" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-pink-50 via-blue-50 to-transparent rounded-full blur-3xl opacity-40 -z-0" />

      <div className="relative z-10">
        {/* Greeting Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center space-x-3 mb-2"
        >
          <motion.div
            animate={{
              rotate: [0, 10, -10, 10, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
          >
            <GreetingIcon className={`w-8 h-8 ${greeting.color}`} />
          </motion.div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              {greeting.text},{" "}
              <span
                className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                style={
                  brandColors?.primary
                    ? {
                        backgroundImage: `linear-gradient(to right, ${
                          brandColors.primary
                        }, ${brandColors.secondary || brandColors.primary})`,
                      }
                    : undefined
                }
              >
                {userName}!
              </span>
            </h1>
            <p className="text-gray-600 mt-1 text-base">
              Here's what's happening today
            </p>
          </div>
        </motion.div>

        {/* Today's Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8"
        >
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                whileHover={{ scale: 1.03, y: -2 }}
                className={`${stat.bgColor} rounded-2xl p-5 border border-gray-100/50 backdrop-blur-sm transition-all hover:shadow-md cursor-pointer`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      {stat.label}
                    </p>
                    <motion.p
                      className={`text-3xl font-bold ${stat.textColor}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        delay: 0.6 + index * 0.1,
                        type: "spring",
                        stiffness: 200,
                      }}
                    >
                      {stat.value}
                    </motion.p>
                  </div>
                  <motion.div
                    className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </motion.div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.div>
  );
}
