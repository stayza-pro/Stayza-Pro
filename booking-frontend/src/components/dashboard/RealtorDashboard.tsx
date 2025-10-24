"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useBranding } from "@/hooks/useBranding";
import { getRealtorSubdomain, getMainDomainUrl } from "@/utils/subdomain";
import { deleteCookie } from "@/utils/cookies";
import { propertyService } from "@/services/properties";
import { bookingService } from "@/services/bookings";
import { paymentService } from "@/services/payments";
import {
  Building2,
  Calendar,
  DollarSign,
  Star,
  TrendingUp,
  Loader2,
  Eye,
  Copy,
  ArrowUp,
  ArrowDown,
  CreditCard,
  LogOut,
} from "lucide-react";

interface StatsCard {
  title: string;
  value: string;
  change: string;
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  color: string;
}

interface DashboardStats {
  propertyCount: number;
  activeBookings: number;
  monthlyRevenue: number;
  averageRating: number;
  occupancyRate: number;
  propertyChange?: string;
  bookingChange?: string;
  revenueChange?: string;
  ratingChange?: string;
  occupancyChange?: string;
}

interface RecentBooking {
  id: string;
  guestName: string;
  guestAvatar: string;
  propertyName: string;
  checkIn: string;
  status: "confirmed" | "pending" | "cancelled";
  amount: number;
}

export function RealtorDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const { branding } = useBranding();
  const realtorSubdomain = getRealtorSubdomain();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentBookings, setRecentBookings] = useState<RecentBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch properties count
        const propertiesResponse = await propertyService.getHostProperties(
          user?.id,
          { page: 1, limit: 1 }
        );
        const propertyCount = propertiesResponse.pagination?.totalItems ?? 0;

        // Fetch active bookings count
        const bookingsResponse = await bookingService.getHostBookings({
          page: 1,
          limit: 1,
        });
        // Filter for confirmed bookings
        const activeBookings =
          bookingsResponse.data?.filter(
            (booking) => booking.status === "CONFIRMED"
          ).length ?? 0;

        // Fetch payment stats (monthly revenue)
        const paymentsResponse = await paymentService.getHostPayments({
          page: 1,
          limit: 100, // Get recent payments to calculate
        });

        // Calculate monthly revenue from current month payments
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRevenue = paymentsResponse.data
          .filter((payment) => {
            const paymentDate = new Date(payment.createdAt);
            return (
              paymentDate.getMonth() === currentMonth &&
              paymentDate.getFullYear() === currentYear &&
              payment.status === "COMPLETED"
            );
          })
          .reduce((sum, payment) => sum + payment.amount, 0);

        // Calculate average rating (would need review API)
        // For now, set a placeholder - we'll implement when reviews are added
        const averageRating = 0; // TODO: Fetch from reviews API

        // Calculate occupancy rate (simplified calculation)
        const occupancyRate =
          propertyCount > 0
            ? Math.round((activeBookings / propertyCount) * 100)
            : 0;

        // Fetch recent bookings for table
        const recentBookingsData = await bookingService.getHostBookings({
          page: 1,
          limit: 5,
        });

        const formattedBookings: RecentBooking[] =
          recentBookingsData.data?.slice(0, 5).map((booking) => ({
            id: booking.id,
            guestName: booking.guest
              ? `${booking.guest.firstName || ""} ${
                  booking.guest.lastName || ""
                }`.trim() || "Guest"
              : "Guest",
            guestAvatar:
              (booking.guest?.firstName
                ? booking.guest.firstName.charAt(0).toUpperCase()
                : "") +
                (booking.guest?.lastName
                  ? booking.guest.lastName.charAt(0).toUpperCase()
                  : "") || "G",
            propertyName: booking.property?.title || "Property",
            checkIn: new Date(booking.checkIn).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            status: booking.status.toLowerCase() as
              | "confirmed"
              | "pending"
              | "cancelled",
            amount: booking.totalPrice,
          })) || [];

        setRecentBookings(formattedBookings);

        setStats({
          propertyCount,
          activeBookings,
          monthlyRevenue: monthlyRevenue / 100, // Convert from cents
          averageRating,
          occupancyRate,
          propertyChange:
            propertyCount > 0 ? `${propertyCount} total` : "No properties yet",
          bookingChange:
            activeBookings > 0
              ? `${activeBookings} active`
              : "No active bookings",
          revenueChange: monthlyRevenue > 0 ? "This month" : "No revenue yet",
          ratingChange:
            averageRating > 0 ? "Based on reviews" : "No reviews yet",
          occupancyChange: occupancyRate > 0 ? "+5% from last month" : "N/A",
        });
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError("Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchDashboardStats();
    }
  }, [user?.id]);

  const brandColors = branding?.colors || {
    primary: "#3B82F6",
    secondary: "#1E40AF",
    accent: "#F59E0B",
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Could add a toast notification here
    alert("Copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white border border-red-200 rounded-lg p-8 max-w-md shadow-lg">
          <h2 className="text-red-800 font-semibold mb-2 text-xl">
            Error Loading Dashboard
          </h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 flex-shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Welcome back, {user?.firstName || "User"} 👋
            </h1>
            <p className="text-gray-600 flex items-center space-x-2">
              <span>Your website:</span>
              <span
                className="font-semibold px-3 py-1 rounded-md text-sm"
                style={{
                  color: brandColors.primary,
                  backgroundColor: brandColors.primary + "15",
                }}
              >
                {realtorSubdomain || "yourcompany"}.stayza.pro
              </span>
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() =>
                copyToClipboard(
                  `https://${realtorSubdomain || "yourcompany"}.stayza.pro`
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </button>
            <button
              onClick={() =>
                window.open(
                  `https://${realtorSubdomain || "yourcompany"}.stayza.pro`,
                  "_blank"
                )
              }
              className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center space-x-2"
              style={{ backgroundColor: brandColors.primary }}
            >
              <Eye className="w-4 h-4" />
              <span>Preview Site</span>
            </button>
            <button
              onClick={() => {
                // Clear all storage
                localStorage.clear();
                sessionStorage.clear();

                // Clear authentication cookies
                deleteCookie("accessToken");
                deleteCookie("refreshToken");

                // Redirect to main domain landing page (domain-aware)
                window.location.href = getMainDomainUrl("/");
              }}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm hover:bg-red-50 transition-colors flex items-center space-x-2"
              title="Logout and return to homepage"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dashboard Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats &&
              [
                {
                  label: "Total Properties",
                  value: stats.propertyCount.toString(),
                  change: "+12%",
                  changeType: "increase" as const,
                  color: brandColors.primary,
                  icon: Building2,
                },
                {
                  label: "Active Bookings",
                  value: stats.activeBookings.toString(),
                  change: "+23%",
                  changeType: "increase" as const,
                  color: brandColors.secondary,
                  icon: Calendar,
                },
                {
                  label: "Monthly Revenue",
                  value: `$${stats.monthlyRevenue.toLocaleString("en-US", {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  })}`,
                  change: "+8%",
                  changeType: "increase" as const,
                  color: brandColors.accent,
                  icon: DollarSign,
                },
                {
                  label: "Occupancy Rate",
                  value: `${stats.occupancyRate}%`,
                  change: stats.occupancyChange || "+5%",
                  changeType: "increase" as const,
                  color: "#10B981",
                  icon: TrendingUp,
                },
              ].map((stat, i) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div
                        className="p-3 rounded-lg"
                        style={{
                          backgroundColor: stat.color + "15",
                          color: stat.color,
                        }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <div
                        className={`flex items-center text-xs px-2 py-1 rounded-full ${
                          stat.changeType === "increase"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {stat.changeType === "increase" ? (
                          <ArrowUp className="w-3 h-3 mr-1" />
                        ) : (
                          <ArrowDown className="w-3 h-3 mr-1" />
                        )}
                        {stat.change}
                      </div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Charts & Tables Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Bookings Table */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Bookings
                  </h3>
                  <button
                    onClick={() => router.push("/realtor/bookings")}
                    className="text-sm font-medium hover:underline"
                    style={{ color: brandColors.primary }}
                  >
                    View all
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                {recentBookings.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-gray-600 font-medium">
                          Guest
                        </th>
                        <th className="px-6 py-3 text-left text-gray-600 font-medium">
                          Property
                        </th>
                        <th className="px-6 py-3 text-left text-gray-600 font-medium">
                          Check-in
                        </th>
                        <th className="px-6 py-3 text-left text-gray-600 font-medium">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-gray-600 font-medium">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {recentBookings.map((booking) => (
                        <tr key={booking.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 flex items-center space-x-3">
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                              style={{
                                backgroundColor: brandColors.primary,
                              }}
                            >
                              {booking.guestAvatar}
                            </div>
                            <span className="font-medium text-gray-900">
                              {booking.guestName}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {booking.propertyName}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {booking.checkIn}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${
                                booking.status === "confirmed"
                                  ? "bg-green-100 text-green-800"
                                  : booking.status === "pending"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            ${booking.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-12 text-center text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No recent bookings</p>
                  </div>
                )}
              </div>
            </div>

            {/* Revenue Chart Placeholder */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Revenue Trend
              </h3>
              <div className="space-y-4">
                {/* Mock chart bars */}
                <div className="flex items-end space-x-2 h-32">
                  {[40, 65, 45, 80, 60, 85, 90].map((height, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full rounded-t"
                        style={{
                          height: `${height}%`,
                          backgroundColor: brandColors.primary,
                          opacity: 0.8,
                        }}
                      />
                      <span className="text-xs text-gray-500 mt-1">
                        {["M", "T", "W", "T", "F", "S", "S"][i]}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Growth indicator */}
                <div
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: brandColors.primary + "10",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">This week</span>
                    <span className="text-green-600 text-sm font-medium">
                      +23%
                    </span>
                  </div>
                  <div className="text-xl font-bold text-gray-900 mt-1">
                    ${stats?.monthlyRevenue.toLocaleString() || "0"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions & Notifications */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Next Payout */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                    <CreditCard className="w-5 h-5 text-green-600 mr-2" />
                    Next Payout
                  </h4>
                  <p className="text-gray-700 mb-3">
                    <span className="text-2xl font-bold text-green-700">
                      ${stats?.monthlyRevenue.toLocaleString() || "0"}
                    </span>{" "}
                    <span className="text-sm">
                      available {new Date().toLocaleDateString()}
                    </span>
                  </p>
                  <button
                    onClick={() => router.push("/dashboard/payments")}
                    className="text-sm font-medium px-4 py-2 rounded-lg bg-white shadow-sm hover:shadow-md transition-all"
                    style={{ color: brandColors.primary }}
                  >
                    View Details →
                  </button>
                </div>
                <div className="text-4xl">💳</div>
              </div>
            </div>

            {/* Performance Summary */}
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Quick Stats</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Avg. Rating</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold">
                      {(stats?.averageRating ?? 0) > 0
                        ? (stats?.averageRating ?? 0).toFixed(1)
                        : "N/A"}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Response Time</span>
                  <span className="font-semibold text-green-600">
                    &lt; 1 hour
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Acceptance Rate</span>
                  <span className="font-semibold">
                    {(stats?.propertyCount ?? 0) > 0 ? "96%" : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
