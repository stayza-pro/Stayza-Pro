import { apiClient } from "./api";

// =====================================================
// TYPE DEFINITIONS
// =====================================================

export interface PlatformAnalytics {
  overview: {
    totalUsers: number;
    totalRealtors: number;
    activeRealtors: number;
    pendingRealtors: number;
    suspendedRealtors: number;
    totalProperties: number;
    activeProperties: number;
    inactiveProperties: number;
    totalBookings: number;
    completedBookings: number;
    pendingBookings: number;
    cancelledBookings: number;
    totalRevenue: string;
    revenueGrowth: number;
    averageRating: number;
    totalReviews: number;
    occupancyRate: number;
    conversionRate: number;
  };
  trends: {
    monthlyBookings: Array<{ month: string; bookings: number }>;
    monthlyRevenue: Array<{ month: string; revenue: number }>;
    completedBookings: Array<{ month: string; completed: number }>;
  };
  breakdowns: {
    propertyTypes: Array<{ type: string; count: number; percentage: number }>;
    topLocations: Array<{ city: string; count: number }>;
    bookingStatus: Array<{ status: string; count: number; percentage: number }>;
    topRealtors: Array<{
      id: string;
      businessName: string;
      totalRevenue: string;
      bookingCount: number;
      propertyCount: number;
    }>;
  };
}

export interface Realtor {
  id: string;
  businessName: string;
  corporateRegNumber: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  cacStatus: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  cacDocumentUrl: string | null;
  cacVerifiedAt: string | null;
  cacRejectedAt: string | null;
  cacRejectionReason: string | null;
  suspendedAt: string | null;
  suspensionExpiresAt: string | null;
  canAppeal: boolean;
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber: string | null;
  };
  _count?: {
    properties: number;
  };
}

export interface RealtorListResponse {
  realtors: Realtor[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CommissionReport {
  totalRevenue: string;
  totalCommissions: string;
  totalPayouts: string;
  pendingPayouts: string;
  commissionRate: number;
}

export interface RealtorCommissionReport {
  realtorId: string;
  businessName: string;
  totalEarnings: string;
  totalCommissionPaid: string;
  pendingPayouts: string;
  completedPayouts: string;
  bookingCount: number;
}

export interface PendingPayout {
  id: string;
  amount: string;
  currency: string;
  status: string;
  realtorEarnings: string;
  platformCommission: string;
  commissionRate: string;
  commissionPaidOut: boolean;
  payoutReference: string | null;
  createdAt: string;
  booking: {
    id: string;
    checkIn: string;
    checkOut: string;
    property: {
      title: string;
      realtor: {
        id: string;
        businessName: string;
        user: {
          email: string;
        };
      };
    };
  };
}

export interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  entityType: string;
  entityId: string;
  details: any;
  ipAddress: string | null;
  createdAt: string; // Mapped from backend's timestamp
  timestamp?: string; // Backend field
  admin?: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  metadata?: any;
}

// =====================================================
// ANALYTICS API
// =====================================================

export const getAnalytics = async (
  timeRange: "7d" | "30d" | "90d" | "1y" = "30d"
): Promise<PlatformAnalytics> => {
  const response = await apiClient.get(
    `/admin/analytics?timeRange=${timeRange}`
  );
  return response.data as PlatformAnalytics;
};

// =====================================================
// REALTOR MANAGEMENT API
// =====================================================

export const getAllRealtors = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<RealtorListResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.status) queryParams.append("status", params.status);
  if (params?.search) queryParams.append("search", params.search);

  const response = await apiClient.get(
    `/admin/realtors?${queryParams.toString()}`
  );
  return response.data as RealtorListResponse;
};

export const updateRealtorStatus = async (
  realtorId: string,
  action: "approve" | "reject" | "suspend" | "reinstate",
  data?: { reason?: string; notes?: string; durationDays?: number }
): Promise<void> => {
  await apiClient.patch(`/admin/realtors/${realtorId}/status`, {
    action,
    ...data,
  });
};

export const approveRealtor = async (realtorId: string): Promise<void> => {
  await apiClient.patch(`/admin/realtors/${realtorId}/status`, {
    action: "approve",
  });
};

export const rejectRealtor = async (
  realtorId: string,
  reason: string
): Promise<void> => {
  await apiClient.patch(`/admin/realtors/${realtorId}/status`, {
    action: "reject",
    reason,
  });
};

export const suspendRealtor = async (
  realtorId: string,
  reason: string,
  durationDays?: number
): Promise<void> => {
  await apiClient.patch(`/admin/realtors/${realtorId}/status`, {
    action: "suspend",
    reason,
    durationDays,
  });
};

export const reinstateRealtor = async (
  realtorId: string,
  notes?: string
): Promise<void> => {
  await apiClient.patch(`/admin/realtors/${realtorId}/status`, {
    action: "reinstate",
    notes,
  });
};

// =====================================================
// CAC VERIFICATION API
// =====================================================

export const approveCac = async (realtorId: string): Promise<void> => {
  await apiClient.post(`/realtors/${realtorId}/approve-cac`);
};

export const rejectCac = async (
  realtorId: string,
  reason: string
): Promise<void> => {
  await apiClient.post(`/realtors/${realtorId}/reject-cac`, { reason });
};

// =====================================================
// COMMISSION & PAYOUT API
// =====================================================

export const getPlatformCommissionReport = async (params?: {
  startDate?: string;
  endDate?: string;
}): Promise<CommissionReport> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);

  const response = await apiClient.get(
    `/admin/commission/platform-report?${queryParams.toString()}`
  );
  return response.data as CommissionReport;
};

export const getRealtorCommissionReport = async (
  realtorId: string,
  params?: {
    startDate?: string;
    endDate?: string;
  }
): Promise<RealtorCommissionReport> => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);

  const response = await apiClient.get(
    `/admin/commission/realtor/${realtorId}?${queryParams.toString()}`
  );
  return response.data as RealtorCommissionReport;
};

export const getPendingPayouts = async (params?: {
  page?: number;
  limit?: number;
  realtorId?: string;
}): Promise<{
  payouts: PendingPayout[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.realtorId) queryParams.append("realtorId", params.realtorId);

  const response = await apiClient.get(
    `/admin/commission/pending-payouts?${queryParams.toString()}`
  );
  return response.data as {
    payouts: PendingPayout[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

export const processRealtorPayout = async (
  paymentId: string,
  payoutReference: string
): Promise<void> => {
  await apiClient.post(`/admin/commission/payout/${paymentId}`, {
    payoutReference,
  });
};

// =====================================================
// AUDIT LOGS API
// =====================================================

export const getAuditLogs = async (params?: {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
  adminId?: string;
  startDate?: string;
  endDate?: string;
}): Promise<{
  logs: AuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.action) queryParams.append("action", params.action);
  if (params?.entityType) queryParams.append("entityType", params.entityType);
  if (params?.adminId) queryParams.append("adminId", params.adminId);
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);

  const response = await apiClient.get(
    `/admin/audit-logs?${queryParams.toString()}`
  );

  // Backend returns data wrapped in { success, data: { logs, pagination } }
  const responseData = response.data as any;

  // Map backend response to frontend format
  const logs = (responseData.logs || []).map((log: any) => ({
    ...log,
    createdAt: log.timestamp || log.createdAt, // Map timestamp to createdAt
  }));

  return {
    logs,
    pagination: {
      page: responseData.pagination?.page || 1,
      limit: responseData.pagination?.limit || 15,
      total: responseData.pagination?.total ?? 0,
      totalPages: responseData.pagination?.pages ?? 0,
    },
  };
};

// =====================================================
// BATCH OPERATIONS
// =====================================================

export const batchSuspendBookings = async (
  realtorId: string,
  reason: string
): Promise<void> => {
  await apiClient.put("/admin/bookings/batch-suspend", { realtorId, reason });
};

// =====================================================
// NOTIFICATIONS API
// =====================================================

export const getNotifications = async (params?: {
  limit?: number;
  unreadOnly?: boolean;
}): Promise<Notification[]> => {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.unreadOnly) queryParams.append("unreadOnly", "true");

  const response = await apiClient.get(
    `/admin/notifications?${queryParams.toString()}`
  );

  const responseData = response.data as any;
  return responseData.notifications || [];
};

export const markNotificationAsRead = async (
  notificationId: string
): Promise<void> => {
  await apiClient.patch("/admin/system/notifications/read", { notificationId });
};

export const markAllNotificationsAsRead = async (): Promise<void> => {
  await apiClient.patch("/admin/system/notifications/read", {});
};

// =====================================================
// PROPERTY MANAGEMENT API
// =====================================================

export interface Property {
  id: string;
  title: string;
  address: string;
  city: string;
  state: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  pricePerNight: number;
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  images: string[];
  amenities: string[];
  description: string;
  createdAt: string;
  updatedAt: string;
  realtor: {
    id: string;
    businessName: string;
    user: {
      email: string;
    };
  };
}

export interface PropertyListResponse {
  properties: Property[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const getAllProperties = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}): Promise<PropertyListResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.status) queryParams.append("status", params.status);
  if (params?.search) queryParams.append("search", params.search);

  const response = await apiClient.get(
    `/admin/properties?${queryParams.toString()}`
  );
  return response.data as PropertyListResponse;
};

export const approveProperty = async (propertyId: string): Promise<void> => {
  await apiClient.post(`/admin/properties/${propertyId}/approve`);
};

export const rejectProperty = async (
  propertyId: string,
  reason: string
): Promise<void> => {
  await apiClient.post(`/admin/properties/${propertyId}/reject`, { reason });
};

export const suspendProperty = async (
  propertyId: string,
  reason: string
): Promise<void> => {
  await apiClient.post(`/admin/properties/${propertyId}/suspend`, { reason });
};
