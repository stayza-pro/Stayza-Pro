import { apiClient } from "./api";

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface PlatformSetting {
  key: string;
  value: any; // Can be string, number, boolean, or object
  description: string | null;
  category: string;
  isActive: boolean;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  updatedByUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface GroupedSettings {
  [category: string]: PlatformSetting[];
}

export interface SettingsResponse {
  success: boolean;
  data: {
    settings: GroupedSettings;
    total: number;
  };
}

export interface SingleSettingResponse {
  success: boolean;
  data: PlatformSetting;
}

export interface CategorySettingsResponse {
  success: boolean;
  data: {
    category: string;
    settings: PlatformSetting[];
    count: number;
  };
}

export interface CreateSettingRequest {
  key: string;
  value: any;
  description?: string;
  category?: string;
}

export interface UpdateSettingRequest {
  value: any;
  description?: string;
}

// =====================================================
// SETTINGS SERVICE FUNCTIONS
// =====================================================

/**
 * Get all platform settings, optionally filtered by category
 */
export const getAllSettings = async (
  category?: string
): Promise<SettingsResponse> => {
  try {
    const params = category ? { category } : {};
    const response = await apiClient.get<SettingsResponse["data"]>(
      "/admin/settings",
      {
        params,
      }
    );
    return response;
  } catch (error: any) {
    console.error("Error fetching settings:", error);
    throw new Error(
      error.response?.data?.message || "Failed to fetch settings"
    );
  }
};

/**
 * Get a specific setting by key
 */
export const getSettingByKey = async (
  key: string
): Promise<SingleSettingResponse> => {
  try {
    const response = await apiClient.get<PlatformSetting>(
      `/admin/settings/${key}`
    );
    return response;
  } catch (error: any) {
    console.error(`Error fetching setting ${key}:`, error);
    throw new Error(
      error.response?.data?.message || `Failed to fetch setting ${key}`
    );
  }
};

/**
 * Get settings by category
 */
export const getSettingsByCategory = async (
  category: string
): Promise<CategorySettingsResponse> => {
  try {
    const response = await apiClient.get<{
      category: string;
      settings: PlatformSetting[];
      count: number;
    }>(`/admin/settings/category/${category}`);
    return response;
  } catch (error: any) {
    console.error(`Error fetching ${category} settings:`, error);
    throw new Error(
      error.response?.data?.message || `Failed to fetch ${category} settings`
    );
  }
};

/**
 * Update a platform setting
 */
export const updateSetting = async (
  key: string,
  data: UpdateSettingRequest
): Promise<SingleSettingResponse> => {
  try {
    const response = await apiClient.put<PlatformSetting>(
      `/admin/settings/${key}`,
      data
    );
    return response;
  } catch (error: any) {
    console.error(`Error updating setting ${key}:`, error);
    throw new Error(
      error.response?.data?.message || `Failed to update setting ${key}`
    );
  }
};

/**
 * Create a new platform setting
 */
export const createSetting = async (
  data: CreateSettingRequest
): Promise<SingleSettingResponse> => {
  try {
    const response = await apiClient.post<PlatformSetting>(
      "/admin/settings",
      data
    );
    return response;
  } catch (error: any) {
    console.error("Error creating setting:", error);
    throw new Error(
      error.response?.data?.message || "Failed to create setting"
    );
  }
};

// =====================================================
// CONVENIENCE FUNCTIONS FOR SPECIFIC SETTINGS
// =====================================================

/**
 * Get the current commission rate
 */
export const getCommissionRate = async (): Promise<number> => {
  try {
    const response = await getSettingByKey("commission_rate");
    return Number(response.data.value);
  } catch (error) {
    console.error("Error fetching commission rate:", error);
    // Return default fallback
    return 0.07; // 7%
  }
};

/**
 * Update the commission rate
 */
export const updateCommissionRate = async (
  rate: number
): Promise<SingleSettingResponse> => {
  return updateSetting("commission_rate", {
    value: rate,
    description: `Platform commission rate for successful bookings (${(
      rate * 100
    ).toFixed(1)}%)`,
  });
};

/**
 * Get the current payout threshold
 */
export const getPayoutThreshold = async (): Promise<number> => {
  try {
    const response = await getSettingByKey("payout_threshold");
    return Number(response.data.value);
  } catch (error) {
    console.error("Error fetching payout threshold:", error);
    // Return default fallback
    return 10000; // ₦10,000
  }
};

/**
 * Update the payout threshold
 */
export const updatePayoutThreshold = async (
  threshold: number
): Promise<SingleSettingResponse> => {
  return updateSetting("payout_threshold", {
    value: threshold,
    description: `Minimum amount required before payout processing (₦${threshold.toLocaleString()})`,
  });
};

/**
 * Get booking cancellation window in hours
 */
export const getCancellationWindow = async (): Promise<number> => {
  try {
    const response = await getSettingByKey("booking_cancellation_window");
    return Number(response.data.value);
  } catch (error) {
    console.error("Error fetching cancellation window:", error);
    return 24; // 24 hours default
  }
};

/**
 * Get auto payout enabled status
 */
export const getAutoPayoutEnabled = async (): Promise<boolean> => {
  try {
    const response = await getSettingByKey("auto_payout_enabled");
    return Boolean(response.data.value);
  } catch (error) {
    console.error("Error fetching auto payout status:", error);
    return true; // Default enabled
  }
};

/**
 * Toggle auto payout
 */
export const toggleAutoPayout = async (
  enabled: boolean
): Promise<SingleSettingResponse> => {
  return updateSetting("auto_payout_enabled", {
    value: enabled,
    description: enabled
      ? "Enable automatic payout processing"
      : "Disable automatic payout processing",
  });
};

/**
 * Get maximum property images allowed
 */
export const getMaxPropertyImages = async (): Promise<number> => {
  try {
    const response = await getSettingByKey("max_property_images");
    return Number(response.data.value);
  } catch (error) {
    console.error("Error fetching max property images:", error);
    return 10; // Default 10 images
  }
};

// =====================================================
// BATCH OPERATIONS
// =====================================================

/**
 * Get all commission-related settings
 */
export const getCommissionSettings = async (): Promise<PlatformSetting[]> => {
  try {
    const response = await getSettingsByCategory("commission");
    return response.data.settings;
  } catch (error) {
    console.error("Error fetching commission settings:", error);
    return [];
  }
};

/**
 * Get all payout-related settings
 */
export const getPayoutSettings = async (): Promise<PlatformSetting[]> => {
  try {
    const response = await getSettingsByCategory("payout");
    return response.data.settings;
  } catch (error) {
    console.error("Error fetching payout settings:", error);
    return [];
  }
};

/**
 * Get all booking-related settings
 */
export const getBookingSettings = async (): Promise<PlatformSetting[]> => {
  try {
    const response = await getSettingsByCategory("booking");
    return response.data.settings;
  } catch (error) {
    console.error("Error fetching booking settings:", error);
    return [];
  }
};
