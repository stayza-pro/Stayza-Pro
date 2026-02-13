"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  User,
  MapPin,
  DollarSign,
  MoreHorizontal,
  Eye,
  MessageSquare,
  Phone,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useBrand } from "../context/BrandContext";

interface Booking {
  id: string;
  guestName: string;
  guestEmail?: string;
  property: string; // This matches the hook's interface
  propertyLocation?: string;
  checkIn: string;
  checkOut: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  amount: string;
  nights: number;
  guestAvatar?: string;
}

interface RecentBookingsProps {
  title?: string;
  maxItems?: number;
  showActions?: boolean;
  bookings?: Booking[];
}

export default function RecentBookings({
  title = "Recent Bookings",
  maxItems = 5,
  showActions = true,
  bookings: propBookings,
}: RecentBookingsProps) {
  const { brand } = useBrand();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setBookings((propBookings || []).slice(0, maxItems));
    setLoading(false);
  }, [propBookings, maxItems]);
  const getStatusConfig = (status: Booking["status"]) => {
    switch (status) {
      case "confirmed":
        return {
          icon: CheckCircle,
          color: brand.colors.success,
          bgColor: "#10B98115",
          textColor: "#059669",
          label: "Confirmed",
        };
      case "pending":
        return {
          icon: Clock,
          color: brand.colors.warning,
          bgColor: "#F59E0B15",
          textColor: "#D97706",
          label: "Pending",
        };
      case "completed":
        return {
          icon: CheckCircle,
          color: brand.colors.primary,
          bgColor: `${brand.colors.primary}15`,
          textColor: brand.colors.primary,
          label: "Completed",
        };
      case "cancelled":
        return {
          icon: AlertCircle,
          color: brand.colors.danger,
          bgColor: "#EF444415",
          textColor: "#DC2626",
          label: "Cancelled",
        };
      default:
        return {
          icon: Clock,
          color: brand.colors.muted,
          bgColor: "#6B728015",
          textColor: "#6B7280",
          label: status,
        };
    }
  };

  const formatCurrency = (amount: string | number) => {
    // If it's already a formatted string, return as is
    if (typeof amount === "string") {
      return amount;
    }
    // If it's a number, format it
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    return `NGN ${safeAmount.toLocaleString("en-NG")}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <div className="w-48 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="w-24 h-4 bg-gray-200 rounded animate-pulse"></div>
        </div>

        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="flex items-center space-x-4 p-4 animate-pulse"
            >
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="w-32 h-4 bg-gray-200 rounded"></div>
                <div className="w-48 h-3 bg-gray-200 rounded"></div>
              </div>
              <div className="w-20 h-6 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <p className="text-sm text-gray-600 mt-1">
              Latest booking activity from your properties
            </p>
          </div>

          <button
            className="text-sm font-medium hover:underline"
            style={{ color: brand.colors.primary }}
          >
            View All
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {bookings.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No bookings yet
            </h4>
            <p className="text-gray-600">
              Your recent bookings will appear here.
            </p>
          </div>
        ) : (
          <div className="min-w-full">
            {/* Table Header */}
            <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 text-xs font-medium text-gray-500 uppercase tracking-wider">
              <div className="col-span-3">Guest</div>
              <div className="col-span-3">Property</div>
              <div className="col-span-2">Dates</div>
              <div className="col-span-2">Status</div>
              <div className="col-span-1">Amount</div>
              <div className="col-span-1">Actions</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {bookings.map((booking, index) => {
                const statusConfig = getStatusConfig(booking.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="grid grid-cols-1 md:grid-cols-12 gap-4 p-6 hover:bg-gray-50 transition-colors"
                  >
                    {/* Guest Info */}
                    <div className="md:col-span-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                          style={{ backgroundColor: brand.colors.primary }}
                        >
                          {booking.guestName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {booking.guestName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {booking.guestEmail}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Property Info */}
                    <div className="md:col-span-3">
                      <div className="flex items-start space-x-2">
                        <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {booking.property}
                          </p>
                          <p className="text-sm text-gray-600">
                            {booking.propertyLocation}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="md:col-span-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(booking.checkIn)} -{" "}
                            {formatDate(booking.checkOut)}
                          </p>
                          <p className="text-xs text-gray-600">
                            {booking.nights} night
                            {booking.nights > 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="md:col-span-2">
                      <span
                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: statusConfig.bgColor,
                          color: statusConfig.textColor,
                        }}
                      >
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Amount */}
                    <div className="md:col-span-1">
                      <div className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {formatCurrency(booking.amount)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {showActions && (
                      <div className="md:col-span-1">
                        <div className="flex items-center space-x-2">
                          <button
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Contact guest"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button
                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                            title="More actions"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

