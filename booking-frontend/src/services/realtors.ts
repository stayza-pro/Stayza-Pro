import { apiClient } from "./api";
import {
  StripeAccountStatus,
  StripeDashboardLink,
  StripeOnboardingLink,
} from "@/types";

const BASE_PATH = "/realtors";

export const realtorService = {
  async getStripeAccountStatus(): Promise<StripeAccountStatus> {
    const response = await apiClient.get<StripeAccountStatus>(
      `${BASE_PATH}/stripe/status`
    );
    return response.data;
  },

  async startStripeOnboarding(): Promise<StripeOnboardingLink> {
    const response = await apiClient.post<StripeOnboardingLink>(
      `${BASE_PATH}/stripe/onboarding`
    );
    return response.data;
  },

  async getStripeDashboardLink(): Promise<StripeDashboardLink> {
    const response = await apiClient.get<StripeDashboardLink>(
      `${BASE_PATH}/stripe/dashboard-link`
    );
    return response.data;
  },
};
