"use client";

import React from "react";
import { motion } from "framer-motion";
import { User, Building, MapPin, Phone, Mail, Calendar } from "lucide-react";

export default function BusinessProfileManager() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
        >
          <div className="text-center">
            <Building className="w-16 h-16 mx-auto mb-4 text-blue-500" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Business Profile Manager
            </h1>
            <p className="text-gray-600 mb-8">
              Manage your business information and settings
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                🚧 This feature is coming soon! Stay tuned for comprehensive
                business profile management.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
