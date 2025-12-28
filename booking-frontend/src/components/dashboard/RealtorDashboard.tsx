"use client";

import React from "react";
import { motion } from "framer-motion";
import { Home, ArrowRight } from "lucide-react";
import Link from "next/link";

export function RealtorDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100"
        >
          <div className="text-center">
            <Home className="w-16 h-16 mx-auto mb-4 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to Stayza Pro
            </h1>
            <p className="text-gray-600 mb-8">
              Your realtor dashboard has been upgraded!
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <p className="text-blue-800 font-medium mb-2">
                🎉 Dashboard Upgrade Available
              </p>
              <p className="text-blue-700 mb-4">
                We've built a brand new, modern dashboard experience for you
                with enhanced features and better performance.
              </p>

              <Link
                href="/realtor"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to New Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
