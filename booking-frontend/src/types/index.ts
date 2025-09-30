// ========================
// Core Enums & Types
// ========================

export type UserRole = "GUEST" | "REALTOR" | "ADMIN";
export type RealtorStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type PropertyType =
  | "APARTMENT"
  | "HOUSE"
  | "VILLA"
  | "COTTAGE"
  | "STUDIO"
  | "LOFT"
  | "TOWNHOUSE"
  | "OTHER";
export type PropertyAmenity =
  | "WIFI"
  | "PARKING"
  | "POOL"
  | "GYM"
  | "AC"
  | "KITCHEN"
  | "WASHING_MACHINE"
  | "TV"
  | "BALCONY"
  | "PET_FRIENDLY"
  | "SMOKING_ALLOWED"
  | "WHEELCHAIR_ACCESSIBLE"
  | "FIREPLACE"
  | "HOT_TUB"
  | "BBQ"
  | "GARDEN"
  | "SECURITY"
  | "CONCIERGE"
  | "ELEVATOR"
  | "HEATING"
  | "DISHWASHER"
  | "MICROWAVE"
  | "COFFEE_MAKER"
  | "IRON"
  | "HAIR_DRYER"
  | "TOWELS"
  | "LINENS"
  | "SHAMPOO"
  | "SOAP";
export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
export type PaymentStatus =
  | "PENDING"
  | "COMPLETED"
  | "FAILED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";
export type PaymentMethod = "PAYSTACK" | "FLUTTERWAVE" | "STRIPE";
export type ReviewType =
  | "GUEST_TO_PROPERTY"
  | "GUEST_TO_REALTOR"
  | "REALTOR_TO_GUEST";

// ========================
// Core Entity Interfaces
// ========================

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  role: UserRole;
  isEmailVerified: boolean;
  avatar?: string;
  country?: string;
  city?: string;
  address?: string;
  dateOfBirth?: Date;
  emailVerificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Realtor {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessAddress?: string;
  brandColorHex: string;
  status: RealtorStatus;
  isActive: boolean;
  stripeAccountId?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  user?: User;
  properties?: Property[];
}

export interface Property {
  id: string;
  realtorId: string;
  title: string;
  description: string;
  type: PropertyType;
  pricePerNight: number;
  currency: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  amenities: PropertyAmenity[];
  houseRules: string[];
  checkInTime: string;
  checkOutTime: string;
  isActive: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  realtor?: Realtor;
  images?: PropertyImage[];
  bookings?: Booking[];
  reviews?: Review[];

  // Computed fields
  averageRating?: number;
  reviewCount?: number;
}

export interface PropertyImage {
  id: string;
  propertyId: string;
  url: string;
  order: number;
  createdAt: Date;

  // Relations
  property?: Property;
}

export interface Booking {
  id: string;
  propertyId: string;
  guestId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  totalAmount: number;
  currency: string;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  specialRequests?: string;
  guestNotes?: string;
  realtorNotes?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  property?: Property;
  guest?: User;
  payment?: Payment;
  reviews?: Review[];

  // Computed fields
  nights?: number;
  isRefundable?: boolean;
  refundDeadline?: Date;
}

export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  providerId?: string;
  providerTransactionId?: string;
  status: PaymentStatus;
  paidAt?: Date;
  refundedAt?: Date;
  refundAmount?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  booking?: Booking;
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

export interface RefreshToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;

  // Relations
  user?: User;
}

export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  revieweeId: string;
  propertyId: string;
  rating: number;
  comment?: string;
  type: ReviewType;
  isPublic: boolean;
  response?: string;
  createdAt: Date;
  updatedAt: Date;

  // Relations
  booking?: Booking;
  reviewer?: User;
  reviewee?: User;
  property?: Property;

  // Computed fields
  isVisible?: boolean;
  isVerified?: boolean;
  likesCount?: number;
  helpfulCount?: number;
  userLiked?: boolean;
}

// API Response types
export interface ApiResponse<T = unknown> {
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

export interface RealtorRegistrationFormData {
  // Account Details
  fullName: string;
  businessEmail: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;

  // Business Details
  agencyName: string;
  tagline?: string;
  customSubdomain: string;
  corporateRegNumber?: string;
  businessAddress: string;

  // Branding
  primaryColor: string;
  secondaryColor: string;
  accentColor?: string;
  customPrimaryColor?: string;
  customSecondaryColor?: string;
  customAccentColor?: string;
  logo?: File | null;

  // Social & Media
  socials?: Record<string, string>;
  whatsappType: "personal" | "business";

  // Compliance
  termsAccepted: boolean;
  privacyAccepted: boolean;
  dataProcessingConsent: boolean;
  marketingOptIn?: boolean;

  // Metadata
  referralCode?: string;
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
  role?: Exclude<UserRole, "ADMIN">;
  country?: string;
  city?: string;
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
  type: PropertyType;
  pricePerNight: number;
  currency: string;
  maxGuests: number;
  bedrooms: number;
  bathrooms: number;
  amenities: PropertyAmenity[];
  houseRules: string[];
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  checkInTime: string;
  checkOutTime: string;
}

export interface BookingFormData {
  propertyId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  specialRequests?: string;
}

export interface ReviewFormData {
  bookingId: string;
  revieweeId: string;
  propertyId: string;
  rating: number;
  comment?: string;
  type: ReviewType;
}

// Filter and search types
export interface PropertyFilters {
  city?: string;
  state?: string;
  country?: string;
  type?: PropertyType;
  minPrice?: number;
  maxPrice?: number;
  maxGuests?: number;
  checkIn?: Date;
  checkOut?: Date;
  amenities?: PropertyAmenity[];
  isActive?: boolean;
  isApproved?: boolean;
}

export interface SearchParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  query?: string;
}

export interface BookingFilters {
  status?: BookingStatus;
  paymentStatus?: PaymentStatus;
  dateFrom?: Date;
  dateTo?: Date;
  propertyId?: string;
  guestId?: string;
}

// ========================
// Payment Integration Types
// ========================

export interface PaystackInitializeResponse {
  authorization_url: string;
  access_code: string;
  reference: string;
}

export interface FlutterwaveInitializeResponse {
  link: string;
  reference: string;
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

export interface PropertyState {
  properties: Property[];
  selectedProperty: Property | null;
  filters: PropertyFilters;
  isLoading: boolean;
  error: string | null;
}

// ========================
// Feature-Specific Types
// ========================

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  bookingUpdates: boolean;
  promotions: boolean;
  reviews: boolean;
}

export interface UserPreferences {
  currency: string;
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
}

export interface RealtorDashboardStats {
  totalProperties: number;
  activeProperties: number;
  totalBookings: number;
  pendingBookings: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageRating: number;
  totalReviews: number;
}

export interface RealtorAnalytics {
  bookingTrends: Array<{
    date: string;
    bookings: number;
    revenue: number;
  }>;
  topProperties: Array<{
    property: Property;
    bookings: number;
    revenue: number;
    rating: number;
  }>;
  guestDemographics: Array<{
    country: string;
    count: number;
    percentage: number;
  }>;
}

// ========================
// Utility Types
// ========================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
