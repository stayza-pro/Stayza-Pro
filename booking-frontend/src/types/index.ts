// ========================
// Core Enums & Types
// ========================

export type UserRole = "GUEST" | "REALTOR" | "ADMIN";
export type RealtorStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type CacStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type PropertyStatus = "DRAFT" | "ACTIVE" | "INACTIVE";
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
// Booking lifecycle states (matches backend Prisma schema)
export type BookingStatus =
  | "PENDING" // Initial state, waiting for payment
  | "ACTIVE" // Payment confirmed, funds in escrow (backend uses this)
  | "PAID" // Deprecated - use ACTIVE instead
  | "CONFIRMED" // Deprecated - use ACTIVE instead
  | "DISPUTED" // Either user or realtor opened a dispute (backend name)
  | "DISPUTE_OPENED" // Deprecated - use DISPUTED
  | "CHECKED_IN" // User has checked in
  | "CHECKED_OUT" // User has checked out
  | "COMPLETED" // All funds released, booking finished
  | "CANCELLED"; // Booking cancelled before check-in

// Payment money flow states (matches backend Prisma schema EXACTLY)
export type PaymentStatus =
  | "INITIATED" // Payment process started
  | "HELD" // Escrow holding funds (room fee + deposit)
  | "PARTIALLY_RELEASED" // Room fee released (90/10 split), deposit still in escrow
  | "SETTLED" // All money distributed (booking completed)
  | "REFUNDED" // Cancellation refunds processed
  | "FAILED"; // Payment failed

// Payment gateway providers
export type PaymentMethod = "PAYSTACK";

// Payout processing states (matches backend Prisma schema)
export type PayoutStatus =
  | "PENDING" // Payment received, waiting for check-in
  | "READY" // Check-in time reached, ready to transfer
  | "PROCESSING" // Transfer initiated
  | "COMPLETED" // Successfully paid out
  | "FAILED"; // Payout failed

// Refund tier based on cancellation timing (matches backend Prisma schema)
export type RefundTier =
  | "EARLY" // 24+ hours before check-in (90% customer / 7% realtor / 3% platform)
  | "MEDIUM" // 12-24 hours before check-in (70% customer / 20% realtor / 10% platform)
  | "LATE" // 0-12 hours before check-in (0% customer / 80% realtor / 20% platform)
  | "NONE"; // After check-in - no room fee refund

// Cancellation refund breakdown
export interface RefundFeeBreakdown {
  roomFee: {
    total: number;
    customerRefund: number;
    realtorPortion: number;
    platformPortion: number;
    percentages: {
      customer: number;
      realtor: number;
      platform: number;
    };
  };
  securityDeposit: {
    total: number;
    customerRefund: number;
    note: string;
  };
  serviceFee: {
    total: number;
    platformPortion: number;
    note: string;
  };
  cleaningFee: {
    total: number;
    realtorPortion: number;
    note: string;
  };
  totals: {
    customerRefund: number;
    realtorPortion: number;
    platformPortion: number;
  };
}

export interface CancellationPreview {
  canCancel: boolean;
  refundInfo?: {
    tier: RefundTier;
    hoursUntilCheckIn: number;
    roomFee: RefundFeeBreakdown["roomFee"];
    securityDeposit: RefundFeeBreakdown["securityDeposit"];
    serviceFee: RefundFeeBreakdown["serviceFee"];
    cleaningFee: RefundFeeBreakdown["cleaningFee"];
    totals: RefundFeeBreakdown["totals"];
    currency: string;
    reason: string;
    warning?: string | null;
  };
  reason?: string;
  bookingDetails?: {
    id: string;
    propertyTitle: string;
    checkInDate: string;
    checkOutDate: string;
    status: string;
    paymentStatus?: string;
  };
}
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

  // Guest-Realtor relationship
  referredByRealtorId?: string;
  referralSource?: string;

  createdAt: Date;
  updatedAt: Date;

  // Relations
  realtor?: Realtor;
  referredByRealtor?: Realtor; // The realtor who referred this guest
}

export interface Realtor {
  id: string;
  userId: string;
  businessName: string;
  tagline?: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  businessEmail?: string;
  businessAddress?: string;

  // Branding colors
  primaryColor: string;
  secondaryColor?: string;
  accentColor?: string;
  brandColorHex: string; // Legacy field

  status: RealtorStatus;
  corporateRegNumber?: string;
  cacDocumentUrl?: string; // CAC certificate document URL
  cacStatus: CacStatus;
  cacVerifiedAt?: Date;
  cacRejectedAt?: Date;
  cacRejectionReason?: string;
  suspendedAt?: Date;
  suspensionExpiresAt?: Date;
  canAppeal: boolean;
  isActive: boolean;
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
  customAmenities?: string[];
  houseRules: string[];
  checkInTime: string;
  checkOutTime: string;
  isActive: boolean;
  isApproved: boolean;
  status: PropertyStatus;
  createdAt: Date;
  updatedAt: Date;

  // Optional fees set by realtor
  serviceFee?: number;
  cleaningFee?: number;
  securityDeposit?: number;

  // Relations
  realtor?: Realtor;
  images?: PropertyImage[];
  bookings?: Booking[];
  reviews?: Review[];

  // Computed/Analytics fields
  averageRating?: number;
  reviewCount?: number;
  views?: number; // Total property views
  bookingCount?: number; // Total bookings for this property
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
  checkInDate: Date | string;
  checkOutDate: Date | string;
  checkInTime?: Date | string; // Actual check-in timestamp
  checkOutTime?: Date | string; // Actual check-out timestamp
  totalGuests: number;
  totalPrice: number;
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
  userId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  reference?: string;
  providerId?: string; // "PAYSTACK"
  status: PaymentStatus;

  // Payment breakdown (matches backend Prisma schema)
  roomFeeAmount: number;
  cleaningFeeAmount: number;
  securityDepositAmount: number;
  serviceFeeAmount: number;
  platformFeeAmount: number;

  // Escrow tracking
  roomFeeInEscrow: boolean;
  depositInEscrow: boolean;
  roomFeeReleasedAt?: Date;
  depositReleasedAt?: Date;

  // Payout tracking
  cleaningFeePaidOut: boolean;
  serviceFeeCollected: boolean;
  roomFeeSplitDone: boolean;
  depositRefunded: boolean;

  // Legacy fields
  metadata?: Record<string, any>;
  paidAt?: Date;
  refundAmount?: number;
  providerTransactionId?: string;
  refundedAt?: Date;
  commissionPaidOut?: boolean;
  commissionRate?: number;
  payoutDate?: Date;
  payoutReference?: string;
  platformCommission?: number;
  realtorEarnings?: number;

  createdAt: Date;
  updatedAt: Date;

  // Relations
  booking?: Booking;
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
  propertyId: string;
  authorId: string;
  rating: number;
  comment?: string;

  // Detailed rating breakdowns
  cleanlinessRating?: number;
  communicationRating?: number;
  checkInRating?: number;
  accuracyRating?: number;
  locationRating?: number;
  valueRating?: number;

  // Photo uploads
  photos?: ReviewPhoto[];

  // Review management
  isVisible: boolean;
  isVerified: boolean;

  // Engagement metrics
  helpfulCount: number;
  likesCount: number;
  dislikesCount: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Host response
  hostResponse?: ReviewResponse;

  // Relations
  booking?: Booking;
  author?: User;
  property?: Property;

  // Computed fields
  userLiked?: boolean;
  userDisliked?: boolean;
}

export interface ReviewPhoto {
  id: string;
  reviewId: string;
  url: string;
  caption?: string;
  order: number;
}

export interface ReviewResponse {
  id: string;
  reviewId: string;
  authorId: string;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  author?: User;
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
  customAmenities?: string[];
  houseRules: string[];
  address: string;
  city: string;
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
  checkInTime: string;
  checkOutTime: string;
  // Optional fees
  serviceFee?: number;
  cleaningFee?: number;
  securityDeposit?: number;
}

export type CreatePropertyData = PropertyFormData;

export interface BookingFormData {
  propertyId: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  specialRequests?: string;
}

export interface ReviewFormData {
  bookingId: string;
  rating: number;
  comment?: string;
  cleanlinessRating?: number;
  communicationRating?: number;
  checkInRating?: number;
  accuracyRating?: number;
  locationRating?: number;
  valueRating?: number;
  photos?: Array<{
    url: string;
    caption?: string;
  }>;
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

// Support System Types
export interface SupportTicket {
  id: string;
  realtorId: string;
  category: "TECHNICAL" | "BILLING" | "DISPUTE" | "GENERAL";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  status:
    | "OPEN"
    | "IN_PROGRESS"
    | "WAITING_FOR_RESPONSE"
    | "RESOLVED"
    | "CLOSED";
  subject: string;
  description: string;
  messages?: SupportMessage[];
  attachments?: SupportAttachment[];
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isFromSupport: boolean;
  attachments?: SupportAttachment[];
  createdAt: Date;
}

export interface SupportAttachment {
  id: string;
  filename: string;
  url: string;
  size: number;
  mimetype: string;
}

export interface Dispute {
  id: string;
  bookingId: string;
  disputeType: "USER_DISPUTE" | "REALTOR_DISPUTE";
  status:
    | "OPEN"
    | "AWAITING_RESPONSE"
    | "NEGOTIATION"
    | "AGREED"
    | "ADMIN_REVIEW"
    | "RESOLVED"
    | "REJECTED";
  openedBy: string;
  openedAt: Date;
  closedAt?: Date;
  outcome?: string;
  agreedAmount?: number;
  evidence?: any; // JSON array of photo/video URLs
  messages?: any; // JSON array of dispute messages
  escalatedToAdmin: boolean;
  adminId?: string;
  adminNotes?: string;
  adminResolvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
