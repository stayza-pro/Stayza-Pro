import { apiClient, type ApiResponse, type PaginatedResponse } from "./api";
import { serviceUtils } from "./utils";
import { Realtor, CacStatus, RealtorStatus } from "@/types";

const BASE_PATH = "/realtors";

interface GetRealtorsFilters {
  cacStatus?: CacStatus;
  status?: RealtorStatus;
  page?: number;
  limit?: number;
  [key: string]: string | number | boolean | Date | null | undefined;
}

export const realtorService = {
  // CAC verification functions
  async getAllRealtorsForAdmin(
    filters: GetRealtorsFilters = {}
  ): Promise<PaginatedResponse<Realtor>> {
    const queryString = serviceUtils.buildQueryString(filters);
    const url = queryString
      ? `${BASE_PATH}/admin/all?${queryString}`
      : `${BASE_PATH}/admin/all`;

    const response = await apiClient.get<PaginatedResponse<Realtor>>(url);
    return response.data;
  },

  async approveCac(realtorId: string): Promise<ApiResponse<Realtor>> {
    const response = await apiClient.patch<ApiResponse<Realtor>>(
      `${BASE_PATH}/${realtorId}/cac/approve`
    );
    return response.data;
  },

  async rejectCac(
    realtorId: string,
    reason: string
  ): Promise<ApiResponse<Realtor>> {
    const response = await apiClient.patch<ApiResponse<Realtor>>(
      `${BASE_PATH}/${realtorId}/cac/reject`,
      { reason }
    );
    return response.data;
  },

  async appealCacRejection(message: string): Promise<ApiResponse<Realtor>> {
    const response = await apiClient.post<ApiResponse<Realtor>>(
      `${BASE_PATH}/cac/appeal`,
      { message }
    );
    return response.data;
  },

  // Utility functions for error handling
  extractErrorMessage: serviceUtils.extractErrorMessage,
  isAuthError: serviceUtils.isAuthError,
  isPermissionError: serviceUtils.isPermissionError,
  isValidationError: serviceUtils.isValidationError,
  isNetworkError: serviceUtils.isNetworkError,
};
