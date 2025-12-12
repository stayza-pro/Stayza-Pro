import apiClient from "./api";
import { Dispute } from "@/types";

export interface OpenDisputeRequest {
  bookingId: string;
  disputeType: "USER_DISPUTE" | "REALTOR_DISPUTE";
  initialMessage: string;
  evidence: string[]; // Array of photo/video URLs
}

export interface SendMessageRequest {
  message: string;
  attachments?: string[];
}

export interface ProposeSettlementRequest {
  amount: number;
  message?: string;
}

export interface AdminResolveRequest {
  decision: "FAVOR_GUEST" | "FAVOR_REALTOR" | "SPLIT";
  amount?: number;
  notes: string;
}

/**
 * Open a new dispute for a booking
 */
export const openDispute = async (
  data: OpenDisputeRequest
): Promise<Dispute> => {
  const response = await apiClient.post<{
    success: boolean;
    data: Dispute;
  }>("/disputes/open", data);

  return response.data.data;
};

/**
 * Get dispute details by ID
 */
export const getDisputeById = async (disputeId: string): Promise<Dispute> => {
  const response = await apiClient.get<{
    success: boolean;
    data: Dispute;
  }>(`/disputes/${disputeId}`);

  return response.data.data;
};

/**
 * Get all disputes for a booking
 */
export const getDisputesByBooking = async (
  bookingId: string
): Promise<Dispute[]> => {
  const response = await apiClient.get<{
    success: boolean;
    data: Dispute[];
  }>(`/disputes/booking/${bookingId}`);

  return response.data.data;
};

/**
 * Get all open disputes (admin only)
 */
export const getAllOpenDisputes = async (): Promise<Dispute[]> => {
  const response = await apiClient.get<{
    success: boolean;
    data: Dispute[];
  }>("/disputes/admin/all");

  return response.data.data;
};

/**
 * Send a message in a dispute
 */
export const sendDisputeMessage = async (
  disputeId: string,
  data: SendMessageRequest
): Promise<void> => {
  await apiClient.post(`/disputes/${disputeId}/messages`, data);
};

/**
 * Upload evidence to a dispute
 */
export const uploadDisputeEvidence = async (
  disputeId: string,
  evidenceUrls: string[]
): Promise<void> => {
  await apiClient.post(`/disputes/${disputeId}/evidence`, {
    evidence: evidenceUrls,
  });
};

/**
 * Agree to a settlement amount
 */
export const agreeToSettlement = async (
  disputeId: string,
  data: ProposeSettlementRequest
): Promise<void> => {
  await apiClient.post(`/disputes/${disputeId}/agree`, data);
};

/**
 * Escalate dispute to admin
 */
export const escalateDispute = async (
  disputeId: string,
  reason: string
): Promise<void> => {
  await apiClient.post(`/disputes/${disputeId}/escalate`, { reason });
};

/**
 * Admin resolves a dispute
 */
export const resolveDispute = async (
  disputeId: string,
  resolution: AdminResolveRequest
): Promise<void> => {
  await apiClient.post(`/disputes/${disputeId}/resolve`, resolution);
};

export const disputeService = {
  openDispute,
  getDisputeById,
  getDisputesByBooking,
  getAllOpenDisputes,
  sendDisputeMessage,
  uploadDisputeEvidence,
  agreeToSettlement,
  escalateDispute,
  resolveDispute,
};

export default disputeService;
