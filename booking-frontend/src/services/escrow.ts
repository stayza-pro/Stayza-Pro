import api from "./api";

export interface EscrowEvent {
  id: string;
  bookingId: string;
  eventType:
    | "HOLD_ROOM_FEE"
    | "HOLD_SECURITY_DEPOSIT"
    | "RELEASE_ROOM_FEE_SPLIT"
    | "RELEASE_DEPOSIT_TO_CUSTOMER"
    | "PAY_REALTOR_FROM_DEPOSIT"
    | "PAY_BALANCE_FROM_CUSTOMER"
    | "REFUND_ROOM_FEE_TO_CUSTOMER"
    | "REFUND_PARTIAL_TO_CUSTOMER"
    | "REFUND_PARTIAL_TO_REALTOR";
  amount: number;
  currency: string;
  fromParty: string | null;
  toParty: string | null;
  executedAt: string;
  transactionReference: string | null;
  providerResponse?: {
    transferConfirmed?: boolean;
    transferConfirmedAt?: string;
    transferFailed?: boolean;
    transferReversed?: boolean;
    failureReason?: string;
    webhookData?: any;
  };
  notes?: string;
  triggeredBy?: string;
}

export interface JobLock {
  id: string;
  jobName: string;
  lockedAt: string;
  lockedBy: string;
  expiresAt: string;
  bookingIds: string[];
}

export interface SystemHealthStats {
  webhooks: {
    totalReceived: number;
    successRate: number;
    failedCount: number;
    lastReceived?: string;
    byProvider: {
      paystack: number;
    };
  };
  retries: {
    totalRetries: number;
    successRate: number;
    averageRetries: number;
    maxRetriesReached: number;
  };
  transfers: {
    pending: number;
    confirmed: number;
    failed: number;
    reversed: number;
  };
}

export interface EmailWorkerJobSummary {
  id: string;
  to: string[];
  attempts: number;
  maxAttempts: number;
}

export interface EmailWorkerPendingJob extends EmailWorkerJobSummary {
  nextAttemptAt: string;
  lastError: string | null;
  createdAt: string;
}

export interface EmailWorkerFailedJob extends EmailWorkerJobSummary {
  lastError: string | null;
  updatedAt: string;
  provider: string | null;
}

export interface EmailWorkerLatestSentJob {
  id: string;
  to: string[];
  sentAt: string | null;
  provider: string | null;
  providerMessageId: string | null;
}

export interface EmailWorkerHealth {
  worker: {
    enabled: boolean;
    intervalMs: number;
    batchSize: number;
    lockTimeoutMs: number;
    maxRetries: number;
  };
  queue: {
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    stuckProcessing: number;
    total: number;
  };
  latestSentJob: EmailWorkerLatestSentJob | null;
  nextPendingJobs: EmailWorkerPendingJob[];
  recentFailedJobs: EmailWorkerFailedJob[];
  checkedAt: string;
}

// New Escrow Tracker Types
export interface FundStatus {
  status: string;
  amount: number;
  realtorAmount?: number;
  platformAmount?: number;
  releasedAt?: string;
  refundedAt?: string;
}

export interface TimerStatus {
  date: string;
  isPast: boolean;
  remainingMs: number;
}

export interface DisputeInfo {
  hasDispute: boolean;
  disputeId?: string;
  status?: string;
  openedAt?: string;
  resolvedAt?: string;
}

export interface EscrowStatusData {
  bookingId: string;
  funds: {
    roomFee: FundStatus;
    cleaningFee: FundStatus;
    securityDeposit: FundStatus;
    serviceFee: FundStatus;
    platformFee: FundStatus;
  };
  timers: {
    checkInWindow: TimerStatus;
    roomFeeRelease: TimerStatus;
    depositRefund: TimerStatus;
    disputeWindow: TimerStatus;
  };
  dispute: DisputeInfo;
  events: Array<{
    id: string;
    type: string;
    description: string;
    amount?: number;
    createdAt: string;
  }>;
}

const toSafeNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Get escrow events for a booking
 */
export async function getBookingEscrowEvents(
  bookingId: string
): Promise<EscrowEvent[]> {
  const response = await api.get(`/bookings/${bookingId}/escrow-events`);
  const data = response.data?.data ?? response.data;
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map((event) => ({
    ...event,
    amount: toSafeNumber(event?.amount),
  })) as EscrowEvent[];
}

/**
 * Get active job locks (admin only)
 */
export async function getActiveJobLocks(): Promise<JobLock[]> {
  const response = await api.get("/admin/system/job-locks");
  const data = response.data?.data ?? response.data;
  return Array.isArray(data) ? data : [];
}

/**
 * Get system health statistics (admin only)
 */
export async function getSystemHealthStats(): Promise<SystemHealthStats> {
  const response = await api.get("/admin/system/health-stats");
  return response.data?.data ?? response.data;
}

/**
 * Get email worker and queue health (admin only)
 */
export async function getEmailWorkerHealth(): Promise<EmailWorkerHealth> {
  const response = await api.get("/admin/system/email-worker-health");
  return response.data?.data ?? response.data;
}

/**
 * Force release an expired job lock (admin only)
 */
export async function forceReleaseJobLock(lockId: string): Promise<void> {
  await api.delete(`/admin/system/job-locks/${lockId}`);
}

/**
 * Get webhook delivery status for a booking (admin only)
 */
export async function getWebhookDeliveryStatus(bookingId: string) {
  const response = await api.get(`/admin/webhooks/booking/${bookingId}`);
  return response.data;
}

/**
 * Get escrow status for a booking (guest or realtor)
 */
export async function getEscrowStatus(
  bookingId: string
): Promise<EscrowStatusData> {
  const response = await api.get(`/escrow/${bookingId}`);
  // Backend wraps response in {success, message, data} structure
  return response.data.data;
}

export const escrowService = {
  getBookingEscrowEvents,
  getActiveJobLocks,
  getSystemHealthStats,
  getEmailWorkerHealth,
  forceReleaseJobLock,
  getWebhookDeliveryStatus,
  getEscrowStatus,
};
