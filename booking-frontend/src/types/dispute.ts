export type DisputeStatus =
  | "OPEN"
  | "PENDING_REALTOR_RESPONSE"
  | "PENDING_GUEST_RESPONSE"
  | "RESOLVED"
  | "CLOSED";

export type DisputeIssueType =
  | "PROPERTY_CONDITION"
  | "CLEANLINESS"
  | "AMENITIES_MISSING"
  | "SAFETY_CONCERNS"
  | "BOOKING_ISSUES"
  | "PAYMENT_DISPUTE"
  | "OTHER";

export interface DisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  senderType: "GUEST" | "REALTOR";
  message: string;
  attachments?: string[];
  createdAt: string;
}

export interface Dispute {
  id: string;
  bookingId: string;
  guestId: string;
  realtorId: string;
  propertyId: string;
  issueType: DisputeIssueType;
  subject: string;
  description: string;
  status: DisputeStatus;
  guestArgumentCount: number;
  realtorArgumentCount: number;
  messages: DisputeMessage[];
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  booking?: {
    id: string;
    propertyTitle: string;
    checkInDate: string;
    checkOutDate: string;
  };
  guest?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  realtor?: {
    id: string;
    businessName: string;
    email: string;
  };
}

export interface CreateDisputeDto {
  bookingId: string;
  issueType: DisputeIssueType;
  subject: string;
  description: string;
  attachments?: string[];
}

export interface RespondToDisputeDto {
  message: string;
  attachments?: string[];
}

export interface DisputeStats {
  totalDisputes: number;
  openDisputes: number;
  resolvedDisputes: number;
  pendingResponse: number;
}
