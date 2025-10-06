"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  AlertCircle,
  TrendingDown,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  Star,
  X,
  Bell,
  BellOff,
  Filter,
  Clock,
  CheckCircle,
} from "lucide-react";
import { PropertyAnalytics } from "@/types/analytics";

interface AlertsPanelProps {
  analytics: PropertyAnalytics;
  propertyId: string;
}

type AlertSeverity = "critical" | "warning" | "info";
type AlertCategory = "occupancy" | "revenue" | "guest" | "review" | "booking";

interface Alert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;
  message: string;
  value?: number;
  threshold?: number;
  trend?: "up" | "down" | "stable";
  timestamp: Date;
  isRead: boolean;
  actionRequired: boolean;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({
  analytics,
  propertyId,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<
    AlertSeverity | "all"
  >("all");
  const [showRead, setShowRead] = useState(false);

  // Generate alerts based on analytics data
  const generateAlerts = (): Alert[] => {
    const alerts: Alert[] = [];

    // Occupancy alerts
    if (analytics.occupancy.currentOccupancy.value < 50) {
      alerts.push({
        id: "low-occupancy",
        severity: "critical",
        category: "occupancy",
        title: "Low Occupancy Rate",
        message: `Current occupancy is ${analytics.occupancy.currentOccupancy.value.toFixed(
          1
        )}%, significantly below the target of 75%`,
        value: analytics.occupancy.currentOccupancy.value,
        threshold: 75,
        trend: analytics.occupancy.currentOccupancy.trend,
        timestamp: new Date(Date.now() - Math.random() * 3600000), // Random time in last hour
        isRead: false,
        actionRequired: true,
      });
    } else if (analytics.occupancy.currentOccupancy.value < 65) {
      alerts.push({
        id: "moderate-occupancy",
        severity: "warning",
        category: "occupancy",
        title: "Below Target Occupancy",
        message: `Occupancy at ${analytics.occupancy.currentOccupancy.value.toFixed(
          1
        )}% is below optimal range`,
        value: analytics.occupancy.currentOccupancy.value,
        threshold: 75,
        trend: analytics.occupancy.currentOccupancy.trend,
        timestamp: new Date(Date.now() - Math.random() * 7200000),
        isRead: false,
        actionRequired: true,
      });
    }

    // Revenue alerts
    if (analytics.revenue.revPAR.value < 90) {
      alerts.push({
        id: "low-revpar",
        severity: "critical",
        category: "revenue",
        title: "Low RevPAR Performance",
        message: `RevPAR of $${analytics.revenue.revPAR.value.toFixed(
          0
        )} is below optimal threshold`,
        value: analytics.revenue.revPAR.value,
        threshold: 112.5,
        trend: analytics.revenue.revPAR.trend,
        timestamp: new Date(Date.now() - Math.random() * 1800000),
        isRead: false,
        actionRequired: true,
      });
    }

    if (analytics.revenue.averageDailyRate.trend === "down") {
      alerts.push({
        id: "declining-adr",
        severity: "warning",
        category: "revenue",
        title: "Declining Average Daily Rate",
        message: `ADR is trending downward from $${analytics.revenue.averageDailyRate.value.toFixed(
          0
        )}`,
        value: analytics.revenue.averageDailyRate.value,
        trend: "down",
        timestamp: new Date(Date.now() - Math.random() * 5400000),
        isRead: false,
        actionRequired: false,
      });
    }

    // Guest satisfaction alerts
    if (analytics.guests.guestSatisfaction.rating < 4.0) {
      alerts.push({
        id: "low-satisfaction",
        severity: "critical",
        category: "guest",
        title: "Low Guest Satisfaction",
        message: `Guest satisfaction score of ${analytics.guests.guestSatisfaction.rating.toFixed(
          1
        )} needs immediate attention`,
        value: analytics.guests.guestSatisfaction.rating,
        threshold: 4.5,
        trend: analytics.guests.guestSatisfaction.trend,
        timestamp: new Date(Date.now() - Math.random() * 10800000),
        isRead: false,
        actionRequired: true,
      });
    } else if (analytics.guests.guestSatisfaction.rating < 4.3) {
      alerts.push({
        id: "moderate-satisfaction",
        severity: "warning",
        category: "guest",
        title: "Guest Satisfaction Below Target",
        message: `Current satisfaction score of ${analytics.guests.guestSatisfaction.rating.toFixed(
          1
        )} could be improved`,
        value: analytics.guests.guestSatisfaction.rating,
        threshold: 4.5,
        trend: analytics.guests.guestSatisfaction.trend,
        timestamp: new Date(Date.now() - Math.random() * 14400000),
        isRead: false,
        actionRequired: false,
      });
    }

    // Review alerts
    if (analytics.reviews.averageRating.value < 4.3) {
      alerts.push({
        id: "low-reviews",
        severity:
          analytics.reviews.averageRating.value < 4.0 ? "critical" : "warning",
        category: "review",
        title: "Review Rating Below Target",
        message: `Average review rating of ${analytics.reviews.averageRating.value.toFixed(
          1
        )} may impact bookings`,
        value: analytics.reviews.averageRating.value,
        threshold: 4.7,
        trend: analytics.reviews.averageRating.trend,
        timestamp: new Date(Date.now() - Math.random() * 18000000),
        isRead: false,
        actionRequired: analytics.reviews.averageRating.value < 4.0,
      });
    }

    if (analytics.reviews.responseRate.value < 80) {
      alerts.push({
        id: "low-response-rate",
        severity: "warning",
        category: "review",
        title: "Low Review Response Rate",
        message: `Only ${analytics.reviews.responseRate.value.toFixed(
          1
        )}% of reviews have responses`,
        value: analytics.reviews.responseRate.value,
        threshold: 90,
        timestamp: new Date(Date.now() - Math.random() * 21600000),
        isRead: false,
        actionRequired: false,
      });
    }

    // Booking alerts
    if (analytics.bookings.cancellationRate.value > 10) {
      alerts.push({
        id: "high-cancellation",
        severity:
          analytics.bookings.cancellationRate.value > 15
            ? "critical"
            : "warning",
        category: "booking",
        title: "High Cancellation Rate",
        message: `Cancellation rate of ${analytics.bookings.cancellationRate.value.toFixed(
          1
        )}% is above acceptable threshold`,
        value: analytics.bookings.cancellationRate.value,
        threshold: 5,
        trend: analytics.bookings.cancellationRate.trend,
        timestamp: new Date(Date.now() - Math.random() * 25200000),
        isRead: false,
        actionRequired: analytics.bookings.cancellationRate.value > 15,
      });
    }

    // Positive alerts (info)
    if (analytics.occupancy.currentOccupancy.value > 85) {
      alerts.push({
        id: "high-occupancy",
        severity: "info",
        category: "occupancy",
        title: "Excellent Occupancy Rate",
        message: `Outstanding occupancy of ${analytics.occupancy.currentOccupancy.value.toFixed(
          1
        )}%`,
        value: analytics.occupancy.currentOccupancy.value,
        timestamp: new Date(Date.now() - Math.random() * 28800000),
        isRead: true,
        actionRequired: false,
      });
    }

    if (analytics.reviews.averageRating.value >= 4.7) {
      alerts.push({
        id: "excellent-reviews",
        severity: "info",
        category: "review",
        title: "Excellent Review Rating",
        message: `Outstanding review rating of ${analytics.reviews.averageRating.value.toFixed(
          1
        )}`,
        value: analytics.reviews.averageRating.value,
        timestamp: new Date(Date.now() - Math.random() * 32400000),
        isRead: true,
        actionRequired: false,
      });
    }

    return alerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const alerts = generateAlerts();

  // Filter alerts
  const filteredAlerts = alerts.filter((alert) => {
    if (selectedSeverity !== "all" && alert.severity !== selectedSeverity)
      return false;
    if (!showRead && alert.isRead) return false;
    return true;
  });

  // Get severity configuration
  const getSeverityConfig = (severity: AlertSeverity) => {
    switch (severity) {
      case "critical":
        return {
          icon: AlertTriangle,
          color: "text-red-600",
          bgColor: "bg-red-50",
          borderColor: "border-red-200",
          badgeColor: "bg-red-100 text-red-800",
        };
      case "warning":
        return {
          icon: AlertCircle,
          color: "text-yellow-600",
          bgColor: "bg-yellow-50",
          borderColor: "border-yellow-200",
          badgeColor: "bg-yellow-100 text-yellow-800",
        };
      case "info":
        return {
          icon: CheckCircle,
          color: "text-blue-600",
          bgColor: "bg-blue-50",
          borderColor: "border-blue-200",
          badgeColor: "bg-blue-100 text-blue-800",
        };
    }
  };

  // Get category icon
  const getCategoryIcon = (category: AlertCategory) => {
    switch (category) {
      case "occupancy":
        return Calendar;
      case "revenue":
        return DollarSign;
      case "guest":
        return Users;
      case "review":
        return Star;
      case "booking":
        return Calendar;
    }
  };

  // Format time ago
  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else {
      return timestamp.toLocaleDateString();
    }
  };

  // Count alerts by severity
  const alertCounts = {
    critical: alerts.filter((a) => a.severity === "critical" && !a.isRead)
      .length,
    warning: alerts.filter((a) => a.severity === "warning" && !a.isRead).length,
    info: alerts.filter((a) => a.severity === "info" && !a.isRead).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Alerts & Notifications
          </h2>
          <p className="text-gray-600">
            Monitor critical issues and performance insights
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowRead(!showRead)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
              showRead
                ? "bg-gray-50 border-gray-300 text-gray-700"
                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {showRead ? (
              <BellOff className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            <span className="text-sm">
              {showRead ? "Hide Read" : "Show All"}
            </span>
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.button
          onClick={() => setSelectedSeverity("critical")}
          className={`p-4 rounded-lg border text-left transition-colors ${
            selectedSeverity === "critical"
              ? "bg-red-50 border-red-200"
              : "bg-white border-gray-200 hover:bg-red-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <span className="text-2xl font-bold text-red-600">
              {alertCounts.critical}
            </span>
          </div>
          <p className="text-sm font-medium text-red-800 mt-1">Critical</p>
        </motion.button>

        <motion.button
          onClick={() => setSelectedSeverity("warning")}
          className={`p-4 rounded-lg border text-left transition-colors ${
            selectedSeverity === "warning"
              ? "bg-yellow-50 border-yellow-200"
              : "bg-white border-gray-200 hover:bg-yellow-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <AlertCircle className="h-6 w-6 text-yellow-600" />
            <span className="text-2xl font-bold text-yellow-600">
              {alertCounts.warning}
            </span>
          </div>
          <p className="text-sm font-medium text-yellow-800 mt-1">Warning</p>
        </motion.button>

        <motion.button
          onClick={() => setSelectedSeverity("info")}
          className={`p-4 rounded-lg border text-left transition-colors ${
            selectedSeverity === "info"
              ? "bg-blue-50 border-blue-200"
              : "bg-white border-gray-200 hover:bg-blue-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <CheckCircle className="h-6 w-6 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">
              {alertCounts.info}
            </span>
          </div>
          <p className="text-sm font-medium text-blue-800 mt-1">Good News</p>
        </motion.button>

        <motion.button
          onClick={() => setSelectedSeverity("all")}
          className={`p-4 rounded-lg border text-left transition-colors ${
            selectedSeverity === "all"
              ? "bg-gray-50 border-gray-300"
              : "bg-white border-gray-200 hover:bg-gray-50"
          }`}
        >
          <div className="flex items-center justify-between">
            <Bell className="h-6 w-6 text-gray-600" />
            <span className="text-2xl font-bold text-gray-900">
              {alertCounts.critical + alertCounts.warning + alertCounts.info}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-800 mt-1">All Alerts</p>
        </motion.button>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredAlerts.map((alert, index) => {
            const severityConfig = getSeverityConfig(alert.severity);
            const CategoryIcon = getCategoryIcon(alert.category);
            const SeverityIcon = severityConfig.icon;

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-lg border p-4 ${
                  severityConfig.borderColor
                } ${alert.isRead ? "opacity-75" : ""}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className={`p-2 rounded-lg ${severityConfig.bgColor}`}>
                      <SeverityIcon
                        className={`h-5 w-5 ${severityConfig.color}`}
                      />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {alert.title}
                        </h3>
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${severityConfig.badgeColor}`}
                        >
                          {alert.severity.toUpperCase()}
                        </span>
                        {alert.actionRequired && (
                          <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-800">
                            ACTION REQUIRED
                          </span>
                        )}
                      </div>

                      <p className="text-gray-700 mb-2">{alert.message}</p>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <CategoryIcon className="h-4 w-4" />
                          <span className="capitalize">{alert.category}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{formatTimeAgo(alert.timestamp)}</span>
                        </div>
                        {alert.trend && (
                          <div className="flex items-center space-x-1">
                            {alert.trend === "up" ? (
                              <TrendingUp className="h-4 w-4 text-green-600" />
                            ) : alert.trend === "down" ? (
                              <TrendingDown className="h-4 w-4 text-red-600" />
                            ) : null}
                            <span className="capitalize">
                              {alert.trend}ward
                            </span>
                          </div>
                        )}
                      </div>

                      {alert.value !== undefined &&
                        alert.threshold !== undefined && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex justify-between items-center text-sm">
                              <span className="font-medium">
                                Current:{" "}
                                {alert.category === "revenue"
                                  ? `$${alert.value.toFixed(0)}`
                                  : alert.category === "review" ||
                                    alert.category === "guest"
                                  ? alert.value.toFixed(1)
                                  : `${alert.value.toFixed(1)}%`}
                              </span>
                              <span className="text-gray-600">
                                Target:{" "}
                                {alert.category === "revenue"
                                  ? `$${alert.threshold.toFixed(0)}`
                                  : alert.category === "review" ||
                                    alert.category === "guest"
                                  ? alert.threshold.toFixed(1)
                                  : `${alert.threshold.toFixed(1)}%`}
                              </span>
                            </div>
                          </div>
                        )}
                    </div>
                  </div>

                  {!alert.isRead && (
                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredAlerts.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No alerts to display
            </h3>
            <p className="text-gray-600">
              {selectedSeverity === "all"
                ? showRead
                  ? "All caught up! No alerts at the moment."
                  : "No unread alerts. Toggle 'Show All' to see read alerts."
                : `No ${selectedSeverity} alerts to show.`}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
