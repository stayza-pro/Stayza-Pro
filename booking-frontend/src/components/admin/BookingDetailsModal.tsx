"use client";

import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  DollarSign,
  Mail,
  MapPin,
  Phone,
  User,
  X,
} from "lucide-react";
import { getBookingById } from "@/services/adminBookingsService";
import { apiClient } from "@/services/api";
import { logError } from "@/utils/errorLogger";

interface BookingDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: string;
}

interface DisputeInfo {
  id: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
}

interface TimelineEvent {
  id: string;
  timestamp: string;
  title: string;
  description: string;
}

interface BookingDetails {
  id: string;
  reference: string;
  status: string;
  paymentStatus: string;
  checkInDate: string;
  checkOutDate: string;
  totalAmount: number;
  commissionAmount: number;
  currency: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  hostName: string;
  hostEmail: string;
  hostPhone: string;
  propertyTitle: string;
  propertyAddress: string;
}

interface RawBookingPayment {
  id?: string;
  status?: string;
  paidAt?: string;
  platformFeeAmount?: number;
}

interface RawBookingGuest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface RawBookingProperty {
  title?: string;
  address?: string;
  city?: string;
  country?: string;
  realtor?: {
    businessPhone?: string;
    user?: {
      firstName?: string;
      lastName?: string;
      email?: string;
    };
  };
}

interface RawRefundRequest {
  id: string;
  status?: string;
  reason?: string;
  createdAt: string;
}

interface RawBooking {
  id: string;
  bookingReference?: string;
  status?: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice?: number;
  platformFee?: number;
  currency?: string;
  createdAt: string;
  guest?: RawBookingGuest;
  property?: RawBookingProperty;
  payment?: RawBookingPayment;
  refundRequests?: RawRefundRequest[];
}

interface RawDispute {
  id: string;
  disputeSubject?: string;
  category?: string;
  writeup?: string;
  status?: string;
  openedAt?: string;
  createdAt: string;
}

interface BookingByIdResponse {
  booking?: RawBooking;
  data?: {
    booking?: RawBooking;
    data?: {
      booking?: RawBooking;
    };
  };
}

interface BookingDisputesResponse {
  disputes?: RawDispute[];
  data?: {
    disputes?: RawDispute[];
    data?: {
      disputes?: RawDispute[];
    };
  };
}

const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);

const isRawDispute = (value: unknown): value is RawDispute =>
  typeof value === "object" &&
  value !== null &&
  "id" in value &&
  typeof (value as { id?: unknown }).id === "string";

const extractRawDisputes = (payload: unknown): RawDispute[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return toArray<RawDispute>(payload);
  if (isRawDispute(payload)) return [payload];

  const response = payload as BookingDisputesResponse;
  return toArray<RawDispute>(
    response.disputes ||
      response.data?.disputes ||
      response.data?.data?.disputes ||
      []
  );
};

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (value: string) => new Date(value).toLocaleDateString();
const formatDateTime = (value: string) => new Date(value).toLocaleString();

const getStatusColor = (status: string) => {
  const normalized = status.toUpperCase();
  if (normalized === "ACTIVE" || normalized === "COMPLETED") {
    return "bg-green-100 text-green-800";
  }
  if (normalized === "PENDING" || normalized === "DISPUTED") {
    return "bg-yellow-100 text-yellow-800";
  }
  if (normalized === "CANCELLED") {
    return "bg-red-100 text-red-800";
  }
  return "bg-gray-100 text-gray-800";
};

const mapBooking = (rawBooking: RawBooking): BookingDetails => {
  const guestName =
    `${rawBooking.guest?.firstName ?? ""} ${rawBooking.guest?.lastName ?? ""}`.trim() ||
    "Guest";
  const hostName =
    `${rawBooking.property?.realtor?.user?.firstName ?? ""} ${
      rawBooking.property?.realtor?.user?.lastName ?? ""
    }`.trim() || "Host";

  return {
    id: rawBooking.id,
    reference:
      rawBooking.bookingReference || `BK-${rawBooking.id.slice(-8).toUpperCase()}`,
    status: rawBooking.status || "PENDING",
    paymentStatus: rawBooking.payment?.status || "INITIATED",
    checkInDate: rawBooking.checkInDate,
    checkOutDate: rawBooking.checkOutDate,
    totalAmount: Number(rawBooking.totalPrice || 0),
    commissionAmount: Number(
      rawBooking.payment?.platformFeeAmount ?? rawBooking.platformFee ?? 0
    ),
    currency: rawBooking.currency || "NGN",
    guestName,
    guestEmail: rawBooking.guest?.email || "N/A",
    guestPhone: rawBooking.guest?.phone || "Not provided",
    hostName,
    hostEmail: rawBooking.property?.realtor?.user?.email || "N/A",
    hostPhone: rawBooking.property?.realtor?.businessPhone || "Not provided",
    propertyTitle: rawBooking.property?.title || "Property",
    propertyAddress:
      [rawBooking.property?.address, rawBooking.property?.city, rawBooking.property?.country]
        .filter(Boolean)
        .join(", ") || "Address unavailable",
  };
};

const buildTimeline = (
  rawBooking: RawBooking,
  disputes: DisputeInfo[]
): TimelineEvent[] => {
  const timeline: TimelineEvent[] = [
    {
      id: `created-${rawBooking.id}`,
      timestamp: rawBooking.createdAt,
      title: "Booking created",
      description: "Booking was created in the system.",
    },
  ];

  if (rawBooking.payment?.paidAt) {
    timeline.push({
      id: `payment-${rawBooking.payment.id || rawBooking.id}`,
      timestamp: rawBooking.payment.paidAt,
      title: "Payment completed",
      description: `Payment moved to ${rawBooking.payment.status}.`,
    });
  }

  toArray<RawRefundRequest>(rawBooking.refundRequests).forEach((refund) => {
    timeline.push({
      id: refund.id,
      timestamp: refund.createdAt,
      title: `Refund request (${refund.status || "UNKNOWN"})`,
      description: refund.reason || "Refund request created.",
    });
  });

  disputes.forEach((dispute) => {
    timeline.push({
      id: dispute.id,
      timestamp: dispute.createdAt,
      title: `Dispute opened (${dispute.status})`,
      description: dispute.description,
    });
  });

  timeline.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return timeline;
};

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  isOpen,
  onClose,
  bookingId,
}) => {
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [disputes, setDisputes] = useState<DisputeInfo[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "timeline" | "disputes">(
    "details"
  );

  useEffect(() => {
    if (!isOpen || !bookingId) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [bookingResult, disputesResult] = await Promise.allSettled([
          getBookingById(bookingId) as Promise<BookingByIdResponse>,
          apiClient.get<BookingDisputesResponse>(`/disputes/booking/${bookingId}`),
        ]);

        if (bookingResult.status !== "fulfilled") {
          throw bookingResult.reason;
        }

        const bookingResponse = bookingResult.value;
        const rawBooking =
          bookingResponse.data?.booking ||
          bookingResponse.booking ||
          bookingResponse.data?.data?.booking;

        if (!rawBooking) {
          throw new Error("Booking details are unavailable.");
        }

        let mappedDisputes: DisputeInfo[] = [];
        if (disputesResult.status === "fulfilled") {
          mappedDisputes = extractRawDisputes(disputesResult.value).map((item) => ({
            id: item.id,
            type: item.disputeSubject || item.category || "DISPUTE",
            description: item.writeup || "No dispute details available.",
            status: item.status || "OPEN",
            createdAt: item.openedAt || item.createdAt,
          }));
        } else {
          logError(disputesResult.reason, {
            component: "BookingDetailsModal",
            action: "load_booking_disputes",
            metadata: { bookingId },
          });
        }

        const mappedBooking = mapBooking(rawBooking);
        setBooking(mappedBooking);
        setDisputes(mappedDisputes);
        setTimeline(buildTimeline(rawBooking, mappedDisputes));
      } catch (loadError) {
        logError(loadError, {
          component: "BookingDetailsModal",
          action: "load_booking_details",
          metadata: { bookingId },
        });
        setError("Failed to load booking details.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, bookingId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden relative">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {booking?.reference || `Booking ${bookingId}`}
            </h2>
            {booking && (
              <p className="text-gray-600 mt-1">
                {booking.guestName} - {formatDate(booking.checkInDate)} to{" "}
                {formatDate(booking.checkOutDate)}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="text-gray-600 mt-2">Loading booking details...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-600">{error}</p>
          </div>
        ) : booking ? (
          <div className="h-[calc(90vh-120px)] flex flex-col">
            <div className="border-b border-gray-200 px-6 py-3 flex gap-3 overflow-x-auto">
              {["details", "timeline", "disputes"].map((tab) => (
                <button
                  key={tab}
                  onClick={() =>
                    setActiveTab(tab as "details" | "timeline" | "disputes")
                  }
                  className={`text-sm font-medium px-3 py-1.5 rounded ${
                    activeTab === tab
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {tab === "disputes" ? `disputes (${disputes.length})` : tab}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "details" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <h3 className="font-semibold text-gray-900">Booking Details</h3>
                      <div className="text-sm flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>
                          {formatDate(booking.checkInDate)} -{" "}
                          {formatDate(booking.checkOutDate)}
                        </span>
                      </div>
                      <div className="text-sm flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <span>{formatMoney(booking.totalAmount, booking.currency)}</span>
                      </div>
                      <div className="text-sm flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-gray-400" />
                        <span>
                          Commission:{" "}
                          {formatMoney(booking.commissionAmount, booking.currency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-sm text-gray-600">Status</span>
                        <span
                          className={`text-xs font-medium rounded-full px-2 py-1 ${getStatusColor(
                            booking.status
                          )}`}
                        >
                          {booking.status}
                        </span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <h3 className="font-semibold text-gray-900">Guest</h3>
                      <div className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{booking.guestName}</span>
                      </div>
                      <div className="text-sm flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{booking.guestEmail}</span>
                      </div>
                      <div className="text-sm flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{booking.guestPhone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <h3 className="font-semibold text-gray-900">Host</h3>
                      <div className="text-sm flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span>{booking.hostName}</span>
                      </div>
                      <div className="text-sm flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{booking.hostEmail}</span>
                      </div>
                      <div className="text-sm flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{booking.hostPhone}</span>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <h3 className="font-semibold text-gray-900">Property</h3>
                      <p className="text-sm font-medium">{booking.propertyTitle}</p>
                      <div className="text-sm flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                        <span>{booking.propertyAddress}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "timeline" && (
                <div className="space-y-3">
                  {timeline.map((event) => (
                    <div key={event.id} className="rounded-lg bg-gray-50 p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(event.timestamp)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "disputes" && (
                <div className="space-y-3">
                  {disputes.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No disputes for this booking.
                    </div>
                  ) : (
                    disputes.map((dispute) => (
                      <div
                        key={dispute.id}
                        className="rounded-lg border border-red-200 bg-red-50 p-4"
                      >
                        <p className="font-medium text-red-900">{dispute.type}</p>
                        <p className="text-sm text-red-700 mt-1">
                          {dispute.description}
                        </p>
                        <p className="text-xs text-red-600 mt-2">
                          {dispute.status} - {formatDateTime(dispute.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default BookingDetailsModal;
