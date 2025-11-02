/**
 * Realtor Dashboard Data Hooks
 *
 * This module exports all custom hooks for fetching and managing
 * realtor dashboard data. Each hook is fully typed and handles:
 * - Loading and error states
 * - Authenticated API calls
 * - Data transformation
 * - Pagination and filtering
 */

export { useRealtorStats } from "./useRealtorStats";
export type { RealtorStats } from "./useRealtorStats";

export { usePropertiesData } from "./usePropertiesData";

export { useBookingsData } from "./useBookingsData";

export { useRevenueData } from "./useRevenueData";
export type { RevenueDataPoint, RevenueStats } from "./useRevenueData";

export { useReviewsData } from "./useReviewsData";
export type { Review, ReviewsStats } from "./useReviewsData";

export { useRefundRequests } from "./useRefundRequests";
export type { RefundRequest } from "./useRefundRequests";

export { useBusinessInsights } from "./useBusinessInsights";
export type { BusinessInsights, TopProperty } from "./useBusinessInsights";
