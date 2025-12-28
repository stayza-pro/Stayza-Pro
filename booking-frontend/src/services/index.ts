// Export all services
export { authService } from "./auth";
export { propertyService } from "./properties";
export { bookingService } from "./bookings";
export { paymentService } from "./payments";
export { reviewService } from "./reviews";
export { realtorService } from "./realtors";
export { refundService } from "./refunds";
export { disputeService } from "./disputes";
export { adminService } from "./admin";
export { analyticsService } from "./analytics";
export { escrowService } from "./escrow";
export { messageService } from "./messages";
export { favoritesService } from "./favorites";

// Export API client and types
export { apiClient, type ApiResponse, type PaginatedResponse } from "./api";
export type {
  PaystackInitializationRequest,
  PaystackInitializationResponse,
  PaystackVerificationRequest,
  PaystackVerificationResponse,
} from "./payments";

// Export refund types
export type {
  RefundRequest,
  RefundReason,
  RefundStatus,
  RefundRequestInput,
  RealtorDecisionInput,
  AdminProcessInput,
} from "./refunds";

// Export admin types
export type {
  AdminRealtorResponse,
  PlatformAnalytics,
  CommissionReport,
  PendingPayout,
  AuditLog,
  RealtorSuspensionData,
  RealtorApprovalData,
} from "./admin";

// Export common types
export type {
  Review,
  ReviewModerationResult,
  ReviewModerationFilters,
  ReviewResponse,
} from "./types";

// Export message types
export type {
  Message,
  Conversation,
  SendPropertyInquiryRequest,
  SendBookingMessageRequest,
} from "./messages";

// Export favorite types
export type { FavoriteProperty, AddFavoriteRequest } from "./favorites";

// Export utilities
export { serviceUtils } from "./utils";
