export type DisputeStatus =
  | "OPEN"
  | "AWAITING_RESPONSE"
  | "ESCALATED"
  | "RESOLVED";

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
    propertyTitle?: string;
    property?: {
      title?: string;
    };
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
  responseAction: "ACCEPT" | "REJECT_ESCALATE";
  responseNotes?: string;
}

export interface DisputeStats {
  total: number;
  open: number;
  pendingResponse: number;
  resolved: number;
}
