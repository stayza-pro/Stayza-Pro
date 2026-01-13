import apiClient from "./api";
import axios from "axios";
import {
  Dispute,
  CreateDisputeDto,
  RespondToDisputeDto,
  DisputeStats,
} from "@/types/dispute";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050/api";

const getAuthHeaders = () => {
  const token = localStorage.getItem("accessToken");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
};

// Legacy interfaces (keeping for backwards compatibility)
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

// Rename existing functions to avoid conflicts
const getDisputeByIdLegacy = getDisputeById;

export const disputeService = {
  // Legacy methods
  openDispute,
  getDisputeById: getDisputeByIdLegacy,
  uploadDisputeEvidence,
  agreeToSettlement,
  escalateDispute,
  resolveDispute,

  // New methods
  createDispute: async (data: CreateDisputeDto): Promise<Dispute> => {
    const response = await axios.post(`${API_URL}/disputes`, data, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getMyDisputesNew: async (): Promise<Dispute[]> => {
    const response = await axios.get(`${API_URL}/disputes/my-disputes`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  getDisputeByBooking: async (bookingId: string): Promise<Dispute | null> => {
    try {
      const response = await axios.get(
        `${API_URL}/disputes/booking/${bookingId}`,
        {
          headers: getAuthHeaders(),
        }
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  respondToDispute: async (
    disputeId: string,
    data: RespondToDisputeDto
  ): Promise<Dispute> => {
    const response = await axios.post(
      `${API_URL}/disputes/${disputeId}/respond`,
      data,
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  getRealtorDisputes: async (status?: string): Promise<Dispute[]> => {
    const params = status ? { status } : {};
    const response = await axios.get(`${API_URL}/disputes/realtor/disputes`, {
      headers: getAuthHeaders(),
      params,
    });
    return response.data;
  },

  getRealtorDisputeStats: async (): Promise<DisputeStats> => {
    const response = await axios.get(`${API_URL}/disputes/realtor/stats`, {
      headers: getAuthHeaders(),
    });
    return response.data;
  },

  acceptDispute: async (
    disputeId: string,
    resolution: string
  ): Promise<Dispute> => {
    const response = await axios.post(
      `${API_URL}/disputes/${disputeId}/accept`,
      { resolution },
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  closeDispute: async (disputeId: string): Promise<Dispute> => {
    const response = await axios.post(
      `${API_URL}/disputes/${disputeId}/close`,
      {},
      { headers: getAuthHeaders() }
    );
    return response.data;
  },

  uploadDisputeAttachment: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await axios.post(
      `${API_URL}/disputes/upload-attachment`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data.url;
  },
};

export default disputeService;
