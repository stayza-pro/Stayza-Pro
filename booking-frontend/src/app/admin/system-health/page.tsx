"use client";

import React from "react";
import { SystemHealthDashboard } from "@/components/admin/SystemHealthDashboard";
import { Card } from "@/components/ui";
import { Activity, Shield, Server } from "lucide-react";

export default function SystemHealthPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              System Health Monitor
            </h1>
          </div>
          <p className="text-gray-600">
            Real-time monitoring of escrow system operations, webhooks, retries,
            and job locks
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  System Status
                </p>
                <p className="text-2xl font-bold text-green-600">Operational</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Server className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Escrow Protection
                </p>
                <p className="text-2xl font-bold text-blue-600">Active</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Auto-refresh
                </p>
                <p className="text-2xl font-bold text-purple-600">10s</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Dashboard */}
        <SystemHealthDashboard />

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                About System Health Monitoring
              </h3>
              <p className="text-sm text-blue-800">
                This dashboard provides real-time insights into the escrow
                system's operational health. It monitors webhook delivery rates,
                payment retry success rates, transfer confirmations, and active
                job locks. Data refreshes automatically every 10 seconds to
                ensure you have the latest information. If you notice any stuck
                job locks, you can force-release them directly from this
                interface.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
