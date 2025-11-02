"use client";

import React from "react";
import { motion } from "framer-motion";
import { HelpCircle, MessageCircle, Phone, Mail } from "lucide-react";

export default function RealtorSupportCenter() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
        >
          <div className="text-center">
            <HelpCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Support Center
            </h1>
            <p className="text-gray-600 mb-8">
              Get help and support for your Stayza Pro account
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800">
                💬 Comprehensive support system coming soon! We're building an
                amazing help center for you.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
