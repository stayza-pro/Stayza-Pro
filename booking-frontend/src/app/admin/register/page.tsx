"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Shield, ArrowLeft, AlertTriangle, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function AdminRegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5 text-gray-600" />
              <span className="text-gray-600 hover:text-gray-900">
                Back to Home
              </span>
            </Link>
            <div className="text-2xl font-bold bg-gradient-to-r from-red-600 to-gray-800 bg-clip-text text-transparent">
              Stayza
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full space-y-8"
        >
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Admin Registration
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Administrative account creation is restricted
            </p>
          </div>

          {/* Restricted Access Notice */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-start">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-3 mt-1" />
              <div>
                <h3 className="text-lg font-medium text-red-800 mb-2">
                  Restricted Access
                </h3>
                <p className="text-sm text-red-700 mb-4">
                  Administrator accounts cannot be self-registered for security
                  reasons. Admin accounts are created by existing administrators
                  or through secure internal processes.
                </p>
                <div className="text-sm text-red-700">
                  <p className="font-medium mb-2">To obtain admin access:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Contact an existing system administrator</li>
                    <li>
                      Request access through your organization's IT department
                    </li>
                    <li>
                      Email support with proper authorization documentation
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center">
              <Lock className="h-5 w-5 text-gray-600 mr-2" />
              <p className="text-sm text-gray-700">
                <span className="font-medium">Need admin access?</span>
                <br />
                Contact: admin@stayza.com
              </p>
            </div>
          </div>

          {/* Alternative Links */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600 mb-4">
              Looking to create a different type of account?
            </p>
            <div className="space-y-2">
              <Link
                href="/guest/register"
                className="block w-full py-2 px-4 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                Register as Guest
              </Link>
              <Link
                href="/onboarding"
                className="block w-full py-2 px-4 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
              >
                Apply as Realtor
              </Link>
            </div>
          </div>

          {/* Login Link */}
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Already have an admin account?{" "}
              <Link
                href="/admin/login"
                className="font-medium text-green-600 hover:text-green-500 transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
