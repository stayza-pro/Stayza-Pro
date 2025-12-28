import { apiClient, ApiResponse, PaginatedResponse } from "./api";

export interface Message {
  id: string;
  propertyId?: string;
  bookingId?: string;
  senderId: string;
  recipientId: string;
  content: string;
  type: "INQUIRY" | "BOOKING" | "SYSTEM";
  wasFiltered: boolean;
  violations?: string[];
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  sender?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  recipient?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  property?: {
    id: string;
    name: string;
    images: string[];
  };
  booking?: {
    id: string;
    bookingReference: string;
    status: string;
  };
}

export interface Conversation {
  propertyId?: string;
  bookingId?: string;
  otherUser: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  property?: {
    id: string;
    name: string;
    images: string[];
  };
  booking?: {
    id: string;
    bookingReference: string;
    status: string;
  };
  lastMessage: Message;
  unreadCount: number;
  messages: Message[];
}

export interface SendPropertyInquiryRequest {
  content: string;
}

export interface SendBookingMessageRequest {
  content: string;
}

class MessageService {
  /**
   * Send a property inquiry message (pre-booking)
   */
  async sendPropertyInquiry(
    propertyId: string,
    data: SendPropertyInquiryRequest
  ): Promise<ApiResponse<Message>> {
    return apiClient.post<Message>(
      `/messages/property/${propertyId}/inquiry`,
      data
    );
  }

  /**
   * Send a message related to an active booking
   */
  async sendBookingMessage(
    bookingId: string,
    data: SendBookingMessageRequest
  ): Promise<ApiResponse<Message>> {
    return apiClient.post<Message>(`/messages/booking/${bookingId}`, data);
  }

  /**
   * Get all conversations for the current user
   */
  async getConversations(): Promise<ApiResponse<Conversation[]>> {
    return apiClient.get<Conversation[]>("/messages/conversations");
  }

  /**
   * Get messages for a specific property inquiry
   */
  async getPropertyMessages(
    propertyId: string
  ): Promise<ApiResponse<Message[]>> {
    return apiClient.get<Message[]>(`/messages/property/${propertyId}`);
  }

  /**
   * Get messages for a specific booking
   */
  async getBookingMessages(bookingId: string): Promise<ApiResponse<Message[]>> {
    return apiClient.get<Message[]>(`/messages/booking/${bookingId}`);
  }

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: string): Promise<ApiResponse<Message>> {
    return apiClient.patch<Message>(`/messages/${messageId}/read`);
  }

  /**
   * Mark all messages in a conversation as read
   */
  async markConversationAsRead(
    propertyId?: string,
    bookingId?: string
  ): Promise<ApiResponse<{ success: boolean; count: number }>> {
    const params = new URLSearchParams();
    if (propertyId) params.append("propertyId", propertyId);
    if (bookingId) params.append("bookingId", bookingId);

    return apiClient.post<{ success: boolean; count: number }>(
      `/messages/mark-read?${params.toString()}`
    );
  }
}

export const messageService = new MessageService();
