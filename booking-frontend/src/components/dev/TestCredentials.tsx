"use client";

import React, { useState } from "react";
import { Copy, Eye, EyeOff, Users } from "lucide-react";
import { toast } from "react-hot-toast";

interface UserCredential {
  role: string;
  email: string;
  password: string;
  name: string;
  description: string;
}

const testCredentials: UserCredential[] = [
  {
    role: "REALTOR",
    email: "john.realtor@example.com",
    password: "SecurePass123!",
    name: "John Anderson",
    description:
      "Anderson Properties - Approved realtor with branded dashboard",
  },
  {
    role: "ADMIN",
    email: "admin@stayza.com",
    password: "SecurePass123!",
    name: "System Administrator",
    description: "Full system administrator access",
  },
  {
    role: "GUEST",
    email: "mike.guest@example.com",
    password: "SecurePass123!",
    name: "Michael Thompson",
    description: "Regular guest user for bookings",
  },
];

export function TestCredentials() {
  const [showPasswords, setShowPasswords] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${type} copied to clipboard!`);
    });
  };

  // Only show in development
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow-lg transition-colors mb-2"
      >
        <Users className="h-4 w-4" />
        Test Credentials
      </button>

      {/* Credentials Panel */}
      {isExpanded && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-xl p-4 max-w-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Test Accounts</h3>
            <button
              onClick={() => setShowPasswords(!showPasswords)}
              className="text-gray-500 hover:text-gray-700"
            >
              {showPasswords ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="space-y-4">
            {testCredentials.map((cred, index) => (
              <div
                key={index}
                className="border border-gray-100 rounded-lg p-3 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    {cred.role}
                  </span>
                </div>

                <h4 className="font-medium text-gray-900 text-sm mb-1">
                  {cred.name}
                </h4>
                <p className="text-xs text-gray-600 mb-3">{cred.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-12">Email:</span>
                    <code className="text-xs bg-white px-2 py-1 rounded border flex-1">
                      {cred.email}
                    </code>
                    <button
                      onClick={() => copyToClipboard(cred.email, "Email")}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-12">Pass:</span>
                    <code className="text-xs bg-white px-2 py-1 rounded border flex-1">
                      {showPasswords ? cred.password : "••••••••••••"}
                    </code>
                    <button
                      onClick={() => copyToClipboard(cred.password, "Password")}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
            <strong>Note:</strong> These are test credentials for development
            only. Use them to test the different user roles and dashboards.
          </div>
        </div>
      )}
    </div>
  );
}
