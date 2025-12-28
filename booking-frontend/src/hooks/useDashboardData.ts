import { useState, useEffect } from "react";
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

export function useDashboardData(): DashboardData {
  const [data, setData] = useState<
    Omit<DashboardData, "loading" | "error" | "refresh">
  >({
    stats: {
      totalRevenue: { value: "₦0.00", change: { value: 0, type: "increase" } },
      activeBookings: { value: "0", change: { value: 0, type: "increase" } },
      propertiesListed: { value: "0", change: { value: 0, type: "increase" } },
      guestSatisfaction: {
        value: "0.0",
        change: { value: 0, type: "increase" },
      },
    },
    recentBookings: [],
    quickStats: [],
    userName: "User",
    todayStats: { newBookings: 0, checkIns: 0, messages: 0 },
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, accessToken } = useAuthStore();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // API endpoints
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";

      const headers = {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      };

      // Fetch dashboard stats
      const statsResponse = await fetch(
        `${baseUrl}/realtors/dashboard/stats`,
        {
          headers,
        }
      );

      // Fetch recent bookings
      const bookingsResponse = await fetch(
        `${baseUrl}/realtors/bookings/recent?limit=5`,
        {
          headers,
        }
      );

      // Fetch realtor profile for additional info
      const profileResponse = await fetch(`${baseUrl}/realtors/profile`, {
        headers,
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();

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
        const bookingsData = await bookingsResponse.json();

        const formattedBookings: RecentBooking[] = (
          bookingsData.bookings || []
        ).map((booking: any) => ({
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
          status: booking.status?.toLowerCase() || "pending",
          amount: `₦${booking.totalAmount?.toLocaleString() || "0"}`,
          nights:
            booking.nights ||
            Math.ceil(
              (new Date(booking.checkOutDate).getTime() -
                new Date(booking.checkInDate).getTime()) /
                (1000 * 60 * 60 * 24)
            ) ||
            1,
        }));

        setData((prev) => ({
          ...prev,
          recentBookings: formattedBookings,
        }));
      }

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setData((prev) => ({
          ...prev,
          userName: profileData.firstName || user?.firstName || "User",
        }));
      }
    } catch (err) {
      console.error("Dashboard data fetch error:", err);
      setError("Failed to load dashboard data");

      // Set fallback data based on user info
      setData((prev) => ({
        ...prev,
        userName: user?.firstName || "User",
        stats: {
          totalRevenue: {
            value: "₦2,450,000",
            change: { value: 12.5, type: "increase" },
          },
          activeBookings: {
            value: "87",
            change: { value: 8.3, type: "increase" },
          },
          propertiesListed: {
            value: "24",
            change: { value: 2, type: "increase" },
          },
          guestSatisfaction: {
            value: "4.8",
            change: { value: 0.2, type: "increase" },
          },
        },
        todayStats: { newBookings: 5, checkIns: 2, messages: 3 },
        recentBookings: [
          {
            id: "1",
            guestName: "John Smith",
            property: "Luxury 2BR Apartment",
            checkIn: "2025-10-30",
            checkOut: "2025-11-02",
            status: "confirmed",
            amount: "₦450,000",
            nights: 3,
          },
          {
            id: "2",
            guestName: "Sarah Johnson",
            property: "Modern Studio",
            checkIn: "2025-10-31",
            checkOut: "2025-11-05",
            status: "pending",
            amount: "₦280,000",
            nights: 5,
          },
        ],
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && accessToken) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [user, accessToken]);

  // Refresh data every 5 minutes
  useEffect(() => {
    if (user && accessToken) {
      const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [user, accessToken]);

  return {
    ...data,
    loading,
    error,
    refresh: fetchDashboardData,
  };
}
