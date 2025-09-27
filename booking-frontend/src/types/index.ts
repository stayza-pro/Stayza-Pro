// User types
export type UserRole = "GUEST" | "HOST" | "REALTOR" | "ADMIN";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isEmailVerified: boolean;
  status?: "ACTIVE" | "SUSPENDED" | "BANNED";
  avatar?: string;
  phone?: string;
  country?: string;
  city?: string;
  address?: string;
  dateOfBirth?: string;
  createdAt: string;
  updatedAt: string;
}

// Property types
export interface Property {
  id: string;
  title: string;
  description: string;
  type:
    | "APARTMENT"
    | "HOUSE"
    | "VILLA"
    | "COTTAGE"
    | "STUDIO"
    | "LOFT"
    | "TOWNHOUSE"
    | "OTHER";
  pricePerNight: number;
  currency: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  images: string[];
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  createdAt: string;
  updatedAt: string;
  host: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  hostId?: string;
  averageRating?: number;
  reviewCount?: number;
}

// Booking types
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "CANCELLED"
  | "COMPLETED"
  | "REFUNDED"
  | "DISPUTED";

export type PayoutStatus = "PENDING" | "RELEASED" | "ON_HOLD" | "FAILED";

export interface Booking {
  id: string;
  checkInDate: string;
  checkOutDate: string;
  totalGuests: number;
  nights: number;
  totalPrice: number;
  currency: string;
  status: BookingStatus;
  specialRequests?: string;
  isRefundable: boolean;
  refundDeadline?: string;
  payoutStatus?: PayoutStatus;
  payoutReleaseDate?: string | null;
  payoutHoldReason?: string | null;
  payoutHoldUntil?: string | null;
  createdAt: string;
  updatedAt: string;
  property: Property;
  guest: User;
  payment?: Payment;
  review?: Review;
}

// Payment types
export interface Payment {
  id: string;
  amount: number;
  currency: string;
  status:
    | "PENDING"
    | "COMPLETED"
    | "FAILED"
    | "REFUNDED"
    | "PARTIALLY_REFUNDED";
  method: "STRIPE" | "PAYSTACK";
  stripePaymentIntentId?: string;
  paystackReference?: string;
  refundAmount?: number;
  refundReason?: string;
  isDisputed?: boolean;
  disputeId?: string | null;
  disputeStatus?: string | null;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  booking: Booking;
  user: User;
}

export interface StripeOnboardingLink {
  url: string;
  expiresAt: string | null;
}

export interface StripeAccountStatus {
  connected: boolean;
  requiresOnboarding: boolean;
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
  chargesEnabled: boolean;
  disabledReason?: string | null;
  outstandingRequirements: string[];
  releaseOffsetHours?: number;
  stripeAccountId?: string;
}

export interface StripeDashboardLink {
  url: string;
  expiresAt: string | null;
}

// Review types
export interface Review {
  id: string;
  rating: number;
  comment?: string;
  isVisible: boolean;
  isVerified?: boolean;
  likesCount?: number;
  dislikesCount?: number;
  helpfulCount?: number;
  userLiked?: boolean;
  userDisliked?: boolean;
  createdAt: string;
  updatedAt: string;
  booking: Booking;
  bookingId: string;
  author: User;
  guest: User;
  property: Property;
  target: User;
  hostResponse?: {
    id: string;
    comment: string;
    createdAt: string;
    updatedAt: string;
  };
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: Exclude<UserRole, "ADMIN">;
  country?: string;
  city?: string;
}

// Auth API types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

export interface PropertyFormData {
  title: string;
  description: string;
  type: Property["type"];
  pricePerNight: number;
  currency: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: string[];
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export interface BookingFormData {
  propertyId: string;
  checkInDate: Date;
  checkOutDate: Date;
  totalGuests: number;
  specialRequests?: string;
}

export interface ReviewFormData {
  bookingId: string;
  rating: number;
  comment?: string;
}

// Filter and search types
export interface PropertyFilters {
  city?: string;
  country?: string;
  type?: Property["type"];
  minPrice?: number;
  maxPrice?: number;
  maxGuests?: number;
  checkIn?: Date;
  checkOut?: Date;
  amenities?: string[];
}

export interface SearchParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// UI Component types
export interface SelectOption {
  label: string;
  value: string;
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasMore: boolean;
}

// Store types (for state management)
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface BookingState {
  selectedProperty: Property | null;
  bookingData: Partial<BookingFormData>;
  currentStep: number;
}
