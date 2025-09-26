import { Request } from "express";
import { User, UserRole } from "@prisma/client";

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PropertySearchQuery extends PaginationQuery {
  city?: string;
  country?: string;
  type?: string;
  minPrice?: string;
  maxPrice?: string;
  maxGuests?: string;
  checkIn?: string;
  checkOut?: string;
  amenities?: string;
}

export interface BookingSearchQuery extends PaginationQuery {
  status?: string;
  propertyId?: string;
  guestId?: string;
  startDate?: string;
  endDate?: string;
}

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

export interface StripeWebhookEvent {
  id: string;
  object: string;
  type: string;
  data: {
    object: any;
  };
}

export interface PaystackWebhookEvent {
  event: string;
  data: {
    reference: string;
    amount: number;
    currency: string;
    status: string;
    customer: {
      email: string;
    };
    metadata: any;
  };
}

export interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface CloudinaryUploadResult {
  public_id: string;
  version: number;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  tags: string[];
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
}
