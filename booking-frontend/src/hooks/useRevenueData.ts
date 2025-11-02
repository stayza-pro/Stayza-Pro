import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";

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

  const generateMockData = (
    period: "7d" | "30d" | "90d" | "1y"
  ): RevenueData[] => {
    const now = new Date();
    const data: RevenueData[] = [];
    let days = 7;
    let format = "MMM dd";

    switch (period) {
      case "7d":
        days = 7;
        format = "MMM dd";
        break;
      case "30d":
        days = 30;
        format = "MMM dd";
        break;
      case "90d":
        days = 90;
        format = "MMM dd";
        break;
      case "1y":
        days = 365;
        format = "MMM yyyy";
        break;
    }

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);

      // Generate realistic revenue data with some randomization
      const baseAmount =
        50000 + Math.sin(i * 0.1) * 20000 + Math.random() * 30000;

      data.push({
        period: date.toLocaleDateString("en-US", {
          month: "short",
          day: period === "1y" ? undefined : "numeric",
          year: period === "1y" ? "numeric" : undefined,
        }),
        amount: Math.round(baseAmount),
        date: date.toISOString().split("T")[0],
      });
    }

    return data;
  };

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      setError(null);

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

      const response = await fetch(
        `${baseUrl}/api/realtors/revenue-analytics?period=${selectedPeriod}`,
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
        throw new Error("Failed to fetch revenue data");
      }
    } catch (err) {
      console.error("Revenue data fetch error:", err);
      setError("Failed to load revenue data");

      // Use mock data as fallback
      const mockData = generateMockData(selectedPeriod);
      setData(mockData);
      setTotalRevenue(mockData.reduce((sum, item) => sum + item.amount, 0));
      setPeriodChange({ value: 12.5, type: "increase" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accessToken) {
      fetchRevenueData();
    } else {
      // Use mock data when no accessToken
      const mockData = generateMockData(selectedPeriod);
      setData(mockData);
      setTotalRevenue(mockData.reduce((sum, item) => sum + item.amount, 0));
      setPeriodChange({ value: 12.5, type: "increase" });
      setLoading(false);
    }
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
