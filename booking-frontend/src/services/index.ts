// Export all services
export { authService } from "./auth";
export { propertyService } from "./properties";
export { bookingService } from "./bookings";
export { paymentService } from "./payments";
export { reviewService } from "./reviews";
export { realtorService } from "./realtors";

// Export API client and types
export { apiClient, type ApiResponse, type PaginatedResponse } from "./api";
export type {
  PaystackInitializationRequest,
  PaystackInitializationResponse,
  PaystackVerificationRequest,
  PaystackVerificationResponse,
} from "./payments";

// Export utilities
export { serviceUtils } from "./utils";
