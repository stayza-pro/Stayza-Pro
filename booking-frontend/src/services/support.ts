import { apiClient, PaginatedResponse } from "./api";

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category:
    | "GUEST_ISSUE"
    | "PROPERTY_DAMAGE"
    | "NO_SHOW"
    | "PAYMENT_ISSUE"
    | "OTHER";
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  bookingId?: string;
  booking?: {
    id: string;
    property?: {
      title: string;
    };
    guest?: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  messages: SupportMessage[];
  attachments: SupportAttachment[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface SupportMessage {
  id: string;
  content: string;
  isFromUser: boolean;
  attachments: SupportAttachment[];
  createdAt: string;
}

export interface SupportAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

export interface CreateTicketRequest {
  subject: string;
  description: string;
  category: SupportTicket["category"];
  priority: SupportTicket["priority"];
  bookingId?: string;
}

export interface ReplyToTicketRequest {
  message: string;
}

export const supportService = {
  // Get support tickets for current user
  getTickets: async (
    params: {
      page?: number;
      limit?: number;
      status?: string;
    } = {}
  ): Promise<PaginatedResponse<SupportTicket>> => {
    const response = await apiClient.get<PaginatedResponse<SupportTicket>>(
      "/support/tickets",
      {
        params,
      }
    );
    return response.data;
  },

  // Get single ticket with full details
  getTicket: async (id: string): Promise<SupportTicket> => {
    const response = await apiClient.get<SupportTicket>(
      `/support/tickets/${id}`
    );
    return response.data;
  },

  // Create new support ticket
  createTicket: async (formData: FormData): Promise<SupportTicket> => {
    const response = await apiClient.post<SupportTicket>(
      "/support/tickets",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return response.data;
  },

  // Reply to ticket
  replyToTicket: async (
    id: string,
    data: ReplyToTicketRequest
  ): Promise<void> => {
    await apiClient.post(`/support/tickets/${id}/reply`, data);
  },

  // Close ticket
  closeTicket: async (id: string): Promise<void> => {
    await apiClient.patch(`/support/tickets/${id}/close`);
  },

  // Reopen ticket
  reopenTicket: async (id: string): Promise<void> => {
    await apiClient.patch(`/support/tickets/${id}/reopen`);
  },
};
