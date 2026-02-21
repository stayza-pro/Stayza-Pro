import apiClient from "./api";
import {
  CreateDisputeDto,
  Dispute,
  DisputeStats,
  RespondToDisputeDto,
} from "@/types/dispute";

type DisputeResponseAction = "ACCEPT" | "REJECT_ESCALATE";

type LegacyOpenDisputeRequest = {
  bookingId: string;
  disputeType: "USER_DISPUTE" | "REALTOR_DISPUTE";
  initialMessage: string;
  evidence: string[];
};

type ApiDisputePayload =
  | Dispute
  | {
      dispute?: unknown;
      disputes?: unknown[];
      data?: unknown;
      message?: string;
    };

const toDisputeMessageArray = (value: unknown): Dispute["messages"] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map((item: any, index) => ({
    id: item?.id || `${index}`,
    disputeId: item?.disputeId || "",
    senderId: item?.senderId || "",
    senderType: item?.senderType === "REALTOR" ? "REALTOR" : "GUEST",
    message: typeof item?.message === "string" ? item.message : "",
    attachments: Array.isArray(item?.attachments) ? item.attachments : [],
    createdAt:
      typeof item?.createdAt === "string"
        ? item.createdAt
        : new Date().toISOString(),
  }));
};

const normalizeDispute = (input: any): Dispute => {
  const bookingPropertyTitle =
    input?.booking?.propertyTitle ||
    input?.booking?.property?.title ||
    "Property";

  const bookingProperty =
    input?.booking?.property && typeof input.booking.property === "object"
      ? input.booking.property
      : bookingPropertyTitle
        ? { title: bookingPropertyTitle }
        : undefined;

  return {
    id: input?.id || "",
    bookingId: input?.bookingId || input?.booking?.id || "",
    guestId: input?.guestId || input?.openedBy || "",
    realtorId: input?.realtorId || "",
    propertyId: input?.propertyId || input?.booking?.propertyId || "",
    issueType: input?.issueType || "OTHER",
    subject: input?.subject || "Dispute",
    description: input?.description || "",
    status: input?.status || "OPEN",
    guestArgumentCount: Number(input?.guestArgumentCount || 0),
    realtorArgumentCount: Number(input?.realtorArgumentCount || 0),
    messages: toDisputeMessageArray(input?.messages),
    resolution:
      typeof input?.resolution === "string" ? input.resolution : undefined,
    resolvedAt:
      typeof input?.resolvedAt === "string" ? input.resolvedAt : undefined,
    createdAt: input?.createdAt || new Date().toISOString(),
    updatedAt: input?.updatedAt || new Date().toISOString(),
    booking: input?.booking
      ? {
          id: input.booking.id || input.bookingId || "",
          propertyTitle: bookingPropertyTitle,
          property: bookingProperty,
          checkInDate: input.booking.checkInDate || "",
          checkOutDate: input.booking.checkOutDate || "",
        }
      : undefined,
    guest: input?.guest,
    realtor: input?.realtor,
  };
};

const extractDispute = (payload: ApiDisputePayload): Dispute => {
  const value =
    (payload as any)?.dispute ||
    (payload as any)?.data?.dispute ||
    (payload as any)?.data ||
    payload;
  return normalizeDispute(value);
};

const extractDisputes = (payload: ApiDisputePayload): Dispute[] => {
  const maybeArray =
    (payload as any)?.disputes ||
    (payload as any)?.data?.disputes ||
    (payload as any)?.data ||
    payload;

  const list = Array.isArray(maybeArray)
    ? maybeArray
    : maybeArray
      ? [maybeArray]
      : [];
  return list.map(normalizeDispute);
};

const extractStats = (payload: unknown): DisputeStats => {
  const value = (payload as any)?.data || payload || {};
  return {
    total: Number((value as any).total || 0),
    open: Number((value as any).open || 0),
    pendingResponse: Number((value as any).pendingResponse || 0),
    resolved: Number((value as any).resolved || 0),
  };
};

export const disputeService = {
  openDispute: async (data: LegacyOpenDisputeRequest): Promise<Dispute> => {
    const response = await apiClient.post<ApiDisputePayload>(
      "/disputes/open",
      data,
    );
    return extractDispute(response as any);
  },

  createDispute: async (data: CreateDisputeDto): Promise<Dispute> => {
    const response = await apiClient.post<ApiDisputePayload>("/disputes", data);
    return extractDispute(response as any);
  },

  getDisputeById: async (disputeId: string): Promise<Dispute> => {
    const response = await apiClient.get<ApiDisputePayload>(
      `/disputes/${disputeId}`,
    );
    return extractDispute(response as any);
  },

  getDisputesByBooking: async (bookingId: string): Promise<Dispute[]> => {
    const response = await apiClient.get<ApiDisputePayload>(
      `/disputes/booking/${bookingId}`,
    );
    return extractDisputes(response as any);
  },

  getDisputeByBooking: async (bookingId: string): Promise<Dispute | null> => {
    try {
      const disputes = await disputeService.getDisputesByBooking(bookingId);
      return disputes[0] || null;
    } catch (error: any) {
      if (error?.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  sendDisputeMessage: async (
    disputeId: string,
    message: string,
  ): Promise<Dispute> => {
    const response = await apiClient.post<ApiDisputePayload>(
      `/disputes/${disputeId}/message`,
      { message },
    );
    return extractDispute(response as any);
  },

  respondToDispute: async (
    disputeId: string,
    data: RespondToDisputeDto,
  ): Promise<Dispute> => {
    const response = await apiClient.post<ApiDisputePayload>(
      `/disputes/${disputeId}/respond`,
      data,
    );
    return extractDispute(response as any);
  },

  respondToDisputeAction: async (
    disputeId: string,
    responseAction: DisputeResponseAction,
    responseNotes?: string,
  ): Promise<Dispute> => {
    return disputeService.respondToDispute(disputeId, {
      responseAction,
      responseNotes,
    });
  },

  acceptDispute: async (
    disputeId: string,
    resolution: string,
  ): Promise<Dispute> => {
    return disputeService.respondToDisputeAction(
      disputeId,
      "ACCEPT",
      resolution,
    );
  },

  rejectAndEscalateDispute: async (
    disputeId: string,
    notes?: string,
  ): Promise<Dispute> => {
    return disputeService.respondToDisputeAction(
      disputeId,
      "REJECT_ESCALATE",
      notes,
    );
  },

  getRealtorDisputes: async (status?: string): Promise<Dispute[]> => {
    const suffix = status ? `?status=${encodeURIComponent(status)}` : "";
    const response = await apiClient.get<ApiDisputePayload>(
      `/disputes/realtor/disputes${suffix}`,
    );
    return extractDisputes(response as any);
  },

  getRealtorDisputeStats: async (): Promise<DisputeStats> => {
    const response = await apiClient.get<unknown>("/disputes/realtor/stats");
    return extractStats(response);
  },

  uploadDisputeAttachment: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiClient.post<{ url: string }>(
      "/disputes/upload-attachment",
      formData,
      {
        headers: {
          // Let the browser set Content-Type automatically so it includes
          // the multipart boundary — manually setting it breaks parsing.
          "Content-Type": undefined,
        },
      },
    );

    const payload = (response as any)?.data || response;
    return String(payload?.url || "");
  },
};

export default disputeService;
