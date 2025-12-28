import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/store/authStore";

/**
 * Hook to fetch refund requests and their status
 * Supports filtering by: approved, pending, rejected
 * Includes timestamps and booking references
 */

export interface RefundRequest {
  id: string;
  bookingId: string;
  bookingReference: string;
  propertyTitle: string;
  guestName: string;
  guestEmail: string;
  amount: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  requestedAt: string;
  processedAt?: string;
  rejectionReason?: string;
  adminNotes?: string;
}

interface UseRefundRequestsParams {
  status?: "PENDING" | "APPROVED" | "REJECTED" | "ALL";
  page?: number;
  limit?: number;
  autoFetch?: boolean;
}

interface UseRefundRequestsReturn {
  refunds: RefundRequest[];
  total: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setPage: (page: number) => void;
  setStatus: (status: "PENDING" | "APPROVED" | "REJECTED" | "ALL") => void;
  stats: {
    pending: number;
    approved: number;
    rejected: number;
    totalAmount: number;
  } | null;
}

export function useRefundRequests(
  params: UseRefundRequestsParams = {}
): UseRefundRequestsReturn {
  const { status = "ALL", page = 1, limit = 20, autoFetch = true } = params;
  const [refunds, setRefunds] = useState<RefundRequest[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(page);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [hasNext, setHasNext] = useState<boolean>(false);
  const [hasPrev, setHasPrev] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentStatus, setCurrentStatus] = useState<
    "PENDING" | "APPROVED" | "REJECTED" | "ALL"
  >(status);
  const [stats, setStats] = useState<{
    pending: number;
    approved: number;
    rejected: number;
    totalAmount: number;
  } | null>(null);
  const { accessToken, user } = useAuthStore();

  const fetchRefunds = useCallback(async () => {
    if (!accessToken || !user) {
      setIsLoading(false);
      setError("Not authenticated");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";

      // Build query params
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
        ...(currentStatus !== "ALL" && { status: currentStatus }),
      });

      const response = await fetch(
        `${baseUrl}/refunds/realtor/requests?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch refunds: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.success && result.data) {
        // Transform refund data
        const transformedRefunds: RefundRequest[] = (
          result.data.refunds || []
        ).map((refund: any) => ({
          id: refund.id,
          bookingId: refund.bookingId,
          bookingReference:
            refund.booking?.paymentReference || refund.bookingId,
          propertyTitle: refund.booking?.property?.title || "Property",
          guestName:
            `${refund.guest?.firstName || ""} ${
              refund.guest?.lastName || ""
            }`.trim() || "Guest",
          guestEmail: refund.guest?.email || "",
          amount: refund.refundAmount || 0,
          reason: refund.reason || "",
          status: refund.status,
          requestedAt: refund.createdAt,
          processedAt: refund.processedAt,
          rejectionReason: refund.rejectionReason,
          adminNotes: refund.adminNotes,
        }));

        setRefunds(transformedRefunds);
        setTotal(result.data.pagination?.total || transformedRefunds.length);
        setTotalPages(result.data.pagination?.totalPages || 1);
        setHasNext(result.data.pagination?.hasNext || false);
        setHasPrev(result.data.pagination?.hasPrev || false);

        // Calculate stats
        if (result.data.stats) {
          setStats(result.data.stats);
        } else {
          // Calculate stats from refunds
          const pending = transformedRefunds.filter(
            (r) => r.status === "PENDING"
          ).length;
          const approved = transformedRefunds.filter(
            (r) => r.status === "APPROVED"
          ).length;
          const rejected = transformedRefunds.filter(
            (r) => r.status === "REJECTED"
          ).length;
          const totalAmount = transformedRefunds.reduce(
            (sum, r) => sum + r.amount,
            0
          );

          setStats({
            pending,
            approved,
            rejected,
            totalAmount,
          });
        }
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load refund requests";
      setError(errorMessage);
      console.error("Error fetching refunds:", err);
      setRefunds([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, user, currentStatus, currentPage, limit]);

  useEffect(() => {
    if (autoFetch) {
      fetchRefunds();
    }
  }, [fetchRefunds, autoFetch]);

  const setPage = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);

  const setStatus = useCallback(
    (newStatus: "PENDING" | "APPROVED" | "REJECTED" | "ALL") => {
      setCurrentStatus(newStatus);
      setCurrentPage(1); // Reset to first page on status change
    },
    []
  );

  return {
    refunds,
    total,
    currentPage,
    totalPages,
    hasNext,
    hasPrev,
    isLoading,
    error,
    refetch: fetchRefunds,
    setPage,
    setStatus,
    stats,
  };
}
