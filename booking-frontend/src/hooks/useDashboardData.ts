import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";

export interface DashboardStats {
  totalRevenue: {
    value: string;
    change: { value: number; type: "increase" | "decrease" };
  };
  activeBookings: {
    value: string;
    change: { value: number; type: "increase" | "decrease" };
  };
  propertiesListed: {
    value: string;
    change: { value: number; type: "increase" | "decrease" };
  };
  guestSatisfaction: {
    value: string;
    change: { value: number; type: "increase" | "decrease" };
  };
}

export interface RecentBooking {
  id: string;
  guestName: string;
  guestAvatar?: string;
  property: string;
  propertyLocation?: string;
  guestEmail?: string;
  checkIn: string;
  checkOut: string;
  status: "confirmed" | "pending" | "cancelled" | "completed";
  amount: string;
  nights: number;
}

export interface QuickStat {
  label: string;
  value: string | number;
}

export interface DashboardData {
  stats: DashboardStats;
  recentBookings: RecentBooking[];
  quickStats: QuickStat[];
  userName: string;
  todayStats: {
    newBookings: number;
    checkIns: number;
    messages: number;
  };
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const defaultState: Omit<DashboardData, "loading" | "error" | "refresh"> = {
  stats: {
    totalRevenue: { value: "₦0.00", change: { value: 0, type: "increase" } },
    activeBookings: { value: "0", change: { value: 0, type: "increase" } },
    propertiesListed: { value: "0", change: { value: 0, type: "increase" } },
    guestSatisfaction: {
      value: "0.0/5.0",
      change: { value: 0, type: "increase" },
    },
  },
  recentBookings: [],
  quickStats: [],
  userName: "User",
  todayStats: { newBookings: 0, checkIns: 0, messages: 0 },
};

export function useDashboardData(): DashboardData {
  const [data, setData] = useState<Omit<DashboardData, "loading" | "error" | "refresh">>(
    defaultState
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, accessToken } = useAuthStore();

  const toUiBookingStatus = useCallback(
    (
    status: string | undefined
  ): RecentBooking["status"] => {
    switch ((status || "").toUpperCase()) {
      case "ACTIVE":
        return "confirmed";
      case "COMPLETED":
        return "completed";
      case "CANCELLED":
        return "cancelled";
      case "PENDING":
      default:
        return "pending";
    }
  },
    []
  );

  const fetchDashboardData = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      setError("Not authenticated");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";

      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      };

      const [statsResponse, bookingsResponse, profileResponse] = await Promise.all([
        fetch(`${baseUrl}/realtors/dashboard/stats`, { headers }),
        fetch(`${baseUrl}/realtors/bookings/recent?limit=5`, { headers }),
        fetch(`${baseUrl}/realtors/profile`, { headers }),
      ]);

      if (statsResponse.ok) {
        const payload = await statsResponse.json();
        const statsData = payload?.data ?? payload;

        setData((prev) => ({
          ...prev,
          stats: {
            totalRevenue: {
              value: `₦${(statsData.totalRevenue || 0).toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`,
              change: statsData.revenueChange || { value: 0, type: "increase" },
            },
            activeBookings: {
              value: statsData.activeBookings?.toString() || "0",
              change: statsData.bookingsChange || {
                value: 0,
                type: "increase",
              },
            },
            propertiesListed: {
              value: statsData.propertiesCount?.toString() || "0",
              change: statsData.propertiesChange || {
                value: 0,
                type: "increase",
              },
            },
            guestSatisfaction: {
              value: `${(statsData.averageRating || 0).toFixed(1)}/5.0`,
              change: statsData.ratingChange || { value: 0, type: "increase" },
            },
          },
          todayStats: {
            newBookings: statsData.todayBookings || 0,
            checkIns: statsData.todayCheckIns || 0,
            messages: statsData.unreadMessages || 0,
          },
        }));
      }

      if (bookingsResponse.ok) {
        const payload = await bookingsResponse.json();
        const bookingsData = payload?.data ?? payload;

        const formattedBookings: RecentBooking[] = (bookingsData.bookings || []).map(
          (booking: any) => ({
            id: booking.id,
            guestName:
              `${booking.guest?.firstName || ""} ${
                booking.guest?.lastName || ""
              }`.trim() || "Guest",
            guestEmail: booking.guest?.email,
            guestAvatar: booking.guest?.profilePicture,
            property: booking.property?.title || "Property",
            propertyLocation:
              booking.property?.location || booking.property?.address,
            checkIn: booking.checkInDate,
            checkOut: booking.checkOutDate,
            status: toUiBookingStatus(booking.status),
            amount: `₦${booking.totalAmount?.toLocaleString() || "0"}`,
            nights:
              booking.nights ||
              Math.ceil(
                (new Date(booking.checkOutDate).getTime() -
                  new Date(booking.checkInDate).getTime()) /
                  (1000 * 60 * 60 * 24)
              ) ||
              1,
          })
        );

        setData((prev) => ({
          ...prev,
          recentBookings: formattedBookings,
        }));
      }

      if (profileResponse.ok) {
        const payload = await profileResponse.json();
        const profileData = payload?.data ?? payload;

        setData((prev) => ({
          ...prev,
          userName: profileData.firstName || user?.firstName || "User",
        }));
      }
    } catch (err) {
      setError("Failed to load dashboard data");

      setData((prev) => ({
        ...prev,
        userName: user?.firstName || "User",
      }));
    } finally {
      setLoading(false);
    }
  }, [accessToken, toUiBookingStatus, user?.firstName]);

  useEffect(() => {
    if (user && accessToken) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user, accessToken, fetchDashboardData]);

  useEffect(() => {
    if (user && accessToken) {
      const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user, accessToken, fetchDashboardData]);

  return {
    ...data,
    loading,
    error,
    refresh: fetchDashboardData,
  };
}
