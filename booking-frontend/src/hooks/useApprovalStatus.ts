import { useQuery } from "react-query";
import { apiClient } from "@/services/api";

interface ApprovalStatusResponse {
  approvalStage: string;
  isFullyApproved: boolean;
  message: string;
  nextSteps: string[];
  estimatedTimeframe: string;
  details: {
    businessName: string;
    businessStatus: string;
    cacStatus: string;
    cacRejectionReason?: string;
    canAppeal: boolean;
    accountCreated: string;
    cacVerifiedAt?: string;
  };
  supportInfo: {
    email: string;
    phone: string;
    businessHours: string;
  };
}

export function useApprovalStatus() {
  return useQuery({
    queryKey: ["realtor-approval-status"],
    queryFn: async (): Promise<ApprovalStatusResponse> => {
      const response = await apiClient.get<{ data: ApprovalStatusResponse }>(
        "/realtors/approval-status"
      );
      return response.data.data;
    },
    retry: (failureCount, error: any) => {
      // Don't retry on authentication errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 2;
    },
    staleTime: 60000, // 60 seconds
    refetchInterval: (data) => {
      // Only refetch if user is not fully approved
      return data?.isFullyApproved ? false : 60000;
    },
    refetchOnWindowFocus: false, // Prevent refetch when window regains focus
    refetchOnMount: false, // Prevent refetch on component mount if data exists
  });
}
