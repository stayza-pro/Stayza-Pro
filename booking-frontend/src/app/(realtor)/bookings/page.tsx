"use client";

import React, { useState } from "react";
import { useBookingsData } from "@/hooks/realtor/useBookingsData";
import { useBranding } from "@/hooks/useBranding";
import { BookingStatus } from "@/types";
import { useRouter } from "next/navigation";
import {
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Search,
  Home,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";
import { format } from "date-fns";

export default function RealtorBookingsPage() {
  const router = useRouter();
  const { branding } = useBranding();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">(
    "all",
  );
  const [currentPage, setCurrentPage] = useState(1);

  const { bookings, total, totalPages, isLoading, error } = useBookingsData({
    page: currentPage,
    limit: 10,
    status: (statusFilter !== "all" ? statusFilter : "ALL") as
      | BookingStatus
      | "ALL"
      | undefined,
  });

  const brandColor = branding?.colors?.primary || "#3B82F6";

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount || 0);

  const statusConfig: Record<
    BookingStatus,
    {
      label: string;
      color: string;
      icon: React.ComponentType<{ className?: string }>;
    }
  > = {
    PENDING: {
      label: "Pending",
      color: "bg-amber-50 text-amber-700 border-amber-200",
      icon: Clock,
    },
    ACTIVE: {
      label: "Active",
      color: "bg-green-50 text-green-700 border-green-200",
      icon: CheckCircle,
    },
    DISPUTED: {
      label: "Disputed",
      color: "bg-orange-50 text-orange-700 border-orange-200",
      icon: AlertCircle,
    },
    COMPLETED: {
      label: "Completed",
      color: "bg-green-50 text-green-700 border-green-200",
      icon: CheckCircle,
    },
    CANCELLED: {
      label: "Cancelled",
      color: "bg-red-50 text-red-700 border-red-200",
      icon: XCircle,
    },
  };

  if (isLoading && bookings.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
          <p className="text-gray-600 font-medium">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Error Loading Bookings
          </h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Section Title */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">Bookings</h2>
        <p className="text-gray-600">Manage your property bookings</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Bookings",
            value: total || 0,
            icon: Calendar,
            useBrand: true,
          },
          {
            label: "Pending",
            value: bookings.filter((b) => b.status === "PENDING").length,
            icon: Clock,
            color: "#F59E0B",
          },
          {
            label: "Active",
            value: bookings.filter((b) => b.status === "ACTIVE").length,
            icon: CheckCircle,
            color: "#10B981",
          },
          {
            label: "Completed",
            value: bookings.filter((b) => b.status === "COMPLETED").length,
            icon: CheckCircle,
            color: "#8B5CF6",
          },
        ].map((stat) => {
          const Icon = stat.icon;
          const iconColor = stat.useBrand ? brandColor : stat.color;
          return (
            <div
              key={stat.label}
              className="bg-white rounded-2xl p-6 border border-gray-200"
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${iconColor}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: iconColor }} />
                </div>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="flex gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as BookingStatus | "all")
            }
            className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="all">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="ACTIVE">Active</option>
            <option value="DISPUTED">Disputed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-200">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            No Bookings Found
          </h3>
          <p className="text-gray-600">
            {searchQuery || statusFilter !== "all"
              ? "Try adjusting your search or filters"
              : "You don't have any bookings yet"}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {bookings
              .filter((booking) =>
                searchQuery
                  ? booking.property?.title
                      ?.toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    booking.guest?.firstName
                      ?.toLowerCase()
                      .includes(searchQuery.toLowerCase()) ||
                    booking.guest?.lastName
                      ?.toLowerCase()
                      .includes(searchQuery.toLowerCase())
                  : true,
              )
              .map((booking) => {
                const status =
                  statusConfig[booking.status] || statusConfig.PENDING;
                const StatusIcon = status.icon;

                return (
                  <div
                    key={booking.id}
                    className="bg-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start justify-between">
                      {/* Left Side - Booking Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="p-2 bg-gray-100 rounded-lg">
                            <Home className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg text-gray-900">
                              {booking.property?.title || "Property"}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Booking ID: {booking.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="flex items-center gap-2 text-sm">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-gray-600">Guest</p>
                              <p className="font-medium text-gray-900">
                                {booking.guest?.firstName}{" "}
                                {booking.guest?.lastName}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-gray-600">
                                Check-in / Check-out
                              </p>
                              <p className="font-medium text-gray-900">
                                {format(
                                  new Date(booking.checkInDate),
                                  "MMM dd",
                                )}{" "}
                                -{" "}
                                {format(
                                  new Date(booking.checkOutDate),
                                  "MMM dd",
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-sm">
                            <div>
                              <p className="text-gray-600">Total Price</p>
                              <p className="font-bold text-gray-900">
                                {formatCurrency(booking.totalPrice || 0)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Cancelled booking notice */}
                        {booking.status === "CANCELLED" && (
                          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-xs text-red-800">
                              <strong>Cancelled:</strong> Refund processed
                              automatically. Your earnings calculated per
                              cancellation tier. Check escrow for details.
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right Side - Status & Actions */}
                      <div className="flex flex-col items-end gap-3">
                        <div
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border ${status.color}`}
                        >
                          <StatusIcon className="w-4 h-4" />
                          {status.label}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              router.push(`/bookings/${booking.id}`)
                            }
                            className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Pagination */}
          {totalPages && totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    );
                  })
                  .map((page, index, array) => (
                    <React.Fragment key={page}>
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-2 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-xl font-bold transition-all ${
                          currentPage === page
                            ? "text-white"
                            : "border border-gray-300 hover:bg-gray-50 text-gray-700"
                        }`}
                        style={
                          currentPage === page
                            ? { backgroundColor: brandColor }
                            : {}
                        }
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
