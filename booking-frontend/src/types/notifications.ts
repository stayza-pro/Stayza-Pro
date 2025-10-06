export type NotificationType =
  | "BOOKING_CONFIRMED"
  | "BOOKING_CANCELLED"
  | "BOOKING_COMPLETED"
  | "PAYMENT_SUCCESSFUL"
  | "PAYMENT_FAILED"
  | "PAYMENT_REFUNDED"
  | "REVIEW_RECEIVED"
  | "REVIEW_RESPONSE"
  | "CAC_APPROVED"
  | "CAC_REJECTED"
  | "SYSTEM_MAINTENANCE"
  | "MARKETING";

export type NotificationPriority = "normal" | "high" | "urgent";

export type DigestFrequency = "never" | "daily" | "weekly";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
  bookingId?: string;
  propertyId?: string;
  paymentId?: string;
  reviewId?: string;

  // Related data populated by backend
  booking?: {
    id: string;
    checkInDate: string;
    checkOutDate: string;
    property: {
      title: string;
      images?: Array<{ url: string; order: number }>;
    };
  };
  property?: {
    id: string;
    title: string;
    images?: Array<{ url: string; order: number }>;
  };
  payment?: {
    id: string;
    amount: number;
    currency: string;
    status: string;
  };
  review?: {
    id: string;
    rating: number;
    comment?: string;
    property: {
      title: string;
    };
  };
}

export interface NotificationPreferences {
  id: string;
  userId: string;

  // Email preferences
  emailEnabled: boolean;
  emailBookingUpdates: boolean;
  emailPaymentUpdates: boolean;
  emailReviews: boolean;
  emailMarketing: boolean;
  emailSystemAlerts: boolean;

  // Push notification preferences
  pushEnabled: boolean;
  pushBookingUpdates: boolean;
  pushPaymentUpdates: boolean;
  pushReviews: boolean;
  pushSystemAlerts: boolean;

  // SMS preferences
  smsEnabled: boolean;
  smsBookingUpdates: boolean;
  smsPaymentUpdates: boolean;
  smsSystemAlerts: boolean;

  // General preferences
  digestFrequency: DigestFrequency;
  quietHoursStart: string; // HH:MM format
  quietHoursEnd: string; // HH:MM format
  timezone: string;

  createdAt: string;
  updatedAt: string;
}

export interface NotificationStats {
  totalCount: number;
  unreadCount: number;
  recentCount: number;
  typeDistribution: Record<NotificationType, number>;
}

export interface PaginatedNotifications {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Socket.io event interfaces
export interface NotificationSocketData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  priority: NotificationPriority;
  createdAt: Date;
  bookingId?: string;
  propertyId?: string;
  paymentId?: string;
  reviewId?: string;
}

export interface SocketAuthData {
  token: string;
  userId: string;
  role: string;
}

// API response interfaces
export interface NotificationResponse {
  success: boolean;
  message: string;
  data: Notification;
}

export interface NotificationsListResponse {
  success: boolean;
  message: string;
  data: PaginatedNotifications;
}

export interface NotificationPreferencesResponse {
  success: boolean;
  message: string;
  data: NotificationPreferences;
}

export interface NotificationStatsResponse {
  success: boolean;
  message: string;
  data: NotificationStats;
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unreadCount: number;
  };
}
