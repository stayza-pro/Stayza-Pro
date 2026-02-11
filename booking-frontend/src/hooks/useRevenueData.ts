import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { logError } from "@/utils/errorLogger";

export interface RevenueData {
  period: string;
  amount: number;
  date: string;
}

export interface RevenueChartData {
  data: RevenueData[];
  loading: boolean;
  error: string | null;
  totalRevenue: number;
  periodChange: {
    value: number;
    type: "increase" | "decrease";
  };
  selectedPeriod: "7d" | "30d" | "90d" | "1y";
  setPeriod: (period: "7d" | "30d" | "90d" | "1y") => void;
}

export function useRevenueData(): RevenueChartData {
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<
    "7d" | "30d" | "90d" | "1y"
  >("30d");
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [periodChange, setPeriodChange] = useState<{
    value: number;
    type: "increase" | "decrease";
  }>({ value: 0, type: "increase" });

  const { accessToken } = useAuthStore();

  const fetchRevenueData = async () => {
    if (!accessToken) {
      setData([]);
      setTotalRevenue(0);
      setPeriodChange({ value: 0, type: "increase" });
      setError("Sign in to view revenue analytics");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";

      const response = await fetch(
        `${baseUrl}/realtors/revenue-analytics?period=${selectedPeriod}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        setData(result.data || []);
        setTotalRevenue(result.totalRevenue || 0);
        setPeriodChange(result.periodChange || { value: 0, type: "increase" });
      } else {
        const responseText = await response.text();
        throw new Error(
          responseText || `Failed to fetch revenue data (${response.status})`
        );
      }
    } catch (err) {
      logError(err, {
        component: "useRevenueData",
        action: "fetch_revenue_data",
        metadata: { selectedPeriod },
      });
      setError("Failed to load revenue data");
      setData([]);
      setTotalRevenue(0);
      setPeriodChange({ value: 0, type: "increase" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueData();
  }, [selectedPeriod, accessToken]);

  const setPeriod = (period: "7d" | "30d" | "90d" | "1y") => {
    setSelectedPeriod(period);
  };

  return {
    data,
    loading,
    error,
    totalRevenue,
    periodChange,
    selectedPeriod,
    setPeriod,
  };
}
