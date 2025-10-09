// Common types used across services

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  isVisible: boolean;
  hostResponse?: ReviewResponse;
  createdAt: string;
  updatedAt: string;
  booking?: {
    id: string;
    property: {
      id: string;
      title: string;
    };
    guest: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  photos?: ReviewPhoto[];
}

export interface ReviewResponse {
  id: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewPhoto {
  id: string;
  url: string;
  altText?: string;
  createdAt: string;
}

export interface ReviewModerationFilters {
  status?: 'ACTIVE' | 'HIDDEN' | '';
  orderBy: 'createdAt' | 'rating' | 'updatedAt';
  order: 'asc' | 'desc';
  page: number;
  limit: number;
}

export interface ReviewModerationResult {
  data: Review[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    hasNext: boolean;
    hasPrev: boolean;
    limit: number;
    total: number;
  };
}

// Re-export admin types
export type { RealtorSuspensionData, RealtorApprovalData } from './admin';