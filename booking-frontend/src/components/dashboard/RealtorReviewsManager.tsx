"use client";

import React from "react";
import { motion } from "framer-motion";
import { MessageSquare, Star, Users, TrendingUp } from "lucide-react";

export default function RealtorReviewsManager() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
        >
          <div className="text-center">
            <Star className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Reviews Manager
            </h1>
            <p className="text-gray-600 mb-8">
              Manage guest reviews and feedback for your properties
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                ⭐ Review management system is under development! Soon you'll be
                able to manage all guest feedback here.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
