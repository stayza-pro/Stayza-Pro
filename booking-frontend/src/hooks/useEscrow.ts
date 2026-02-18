import { useMutation, useQuery, useQueryClient } from "react-query";
import {
  getBookingEscrowEvents,
  getActiveJobLocks,
  getSystemHealthStats,
  getEmailWorkerHealth,
  forceReleaseJobLock,
  getWebhookDeliveryStatus,
  EscrowEvent,
  JobLock,
  SystemHealthStats,
  EmailWorkerHealth,
} from "@/services/escrow";

/**
 * Hook to fetch escrow events for a booking
 */
export function useBookingEscrowEvents(
  bookingId: string | undefined,
  enabled = true
) {
  return useQuery<EscrowEvent[], Error>({
    queryKey: ["escrow-events", bookingId],
    queryFn: () => {
      if (!bookingId) throw new Error("Booking ID is required");
      return getBookingEscrowEvents(bookingId);
    },
    enabled: !!bookingId && enabled,
    refetchInterval: 30000, // Refetch every 30 seconds to get webhook updates
    staleTime: 10000,
  });
}

/**
 * Hook to fetch active job locks (admin only)
 */
export function useActiveJobLocks(enabled = true) {
  return useQuery<JobLock[], Error>({
    queryKey: ["job-locks"],
    queryFn: getActiveJobLocks,
    enabled,
    refetchInterval: 5000, // Refetch every 5 seconds (same as job cron interval)
    staleTime: 2000,
  });
}

/**
 * Hook to fetch system health stats (admin only)
 */
export function useSystemHealthStats(enabled = true) {
  return useQuery<SystemHealthStats, Error>({
    queryKey: ["system-health-stats"],
    queryFn: getSystemHealthStats,
    enabled,
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000,
  });
}

/**
 * Hook to fetch email worker health (admin only)
 */
export function useEmailWorkerHealth(enabled = true) {
  return useQuery<EmailWorkerHealth, Error>({
    queryKey: ["email-worker-health"],
    queryFn: getEmailWorkerHealth,
    enabled,
    refetchInterval: 15000,
    staleTime: 8000,
  });
}

/**
 * Hook to fetch webhook delivery timeline for a booking (admin only)
 */
export function useWebhookDeliveryStatus(
  bookingId: string | undefined,
  enabled = true,
) {
  return useQuery<any, Error>({
    queryKey: ["webhook-delivery-status", bookingId],
    queryFn: () => {
      if (!bookingId) throw new Error("Booking ID is required");
      return getWebhookDeliveryStatus(bookingId);
    },
    enabled: Boolean(bookingId) && enabled,
    refetchInterval: 15000,
    staleTime: 8000,
  });
}

/**
 * Hook to force-release stuck job locks (admin only)
 */
export function useForceReleaseJobLock() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (lockId: string) => forceReleaseJobLock(lockId),
    onSuccess: async () => {
      await queryClient.invalidateQueries(["job-locks"]);
      await queryClient.invalidateQueries(["system-health-stats"]);
    },
  });
}

/**
 * Hook to get transfer confirmation status for a booking
 */
export function useTransferStatus(bookingId: string | undefined) {
  const { data: events, isLoading } = useBookingEscrowEvents(bookingId);

  const transferEvents =
    events?.filter((event: EscrowEvent) =>
      [
        "RELEASE_ROOM_FEE_SPLIT",
        "RELEASE_DEPOSIT_TO_CUSTOMER",
        "PAY_REALTOR_FROM_DEPOSIT",
        "REFUND_ROOM_FEE_TO_CUSTOMER",
      ].includes(event.eventType)
    ) || [];

  const stats = {
    pending: transferEvents.filter(
      (e: EscrowEvent) =>
        !e.providerResponse?.transferConfirmed &&
        !e.providerResponse?.transferFailed
    ).length,
    confirmed: transferEvents.filter(
      (e: EscrowEvent) => e.providerResponse?.transferConfirmed
    ).length,
    failed: transferEvents.filter(
      (e: EscrowEvent) => e.providerResponse?.transferFailed
    ).length,
    reversed: transferEvents.filter(
      (e: EscrowEvent) => e.providerResponse?.transferReversed
    ).length,
  };

  return {
    events: transferEvents,
    stats,
    isLoading,
    hasEvents: transferEvents.length > 0,
  };
}
