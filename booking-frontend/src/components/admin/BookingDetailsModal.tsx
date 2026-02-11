"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
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
  onStatusUpdate: (bookingId: string, status: string, reason?: string) => void;
  onCancelBooking: (
    bookingId: string,
    reason: string,
    refundAmount: number
  ) => void;
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

const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);

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

const mapBooking = (rawBooking: Record<string, any>): BookingDetails => {
  const guestName =
    `${rawBooking.guest?.firstName ?? ""} ${rawBooking.guest?.lastName ?? ""}`.trim() ||
    "Guest";
  const hostName =
    `${rawBooking.property?.realtor?.user?.firstName ?? ""} ${
      rawBooking.property?.realtor?.user?.lastName ?? ""
    }`.trim() || "Host";

  return {
    id: rawBooking.id,
    reference: `BK-${rawBooking.id.slice(-8).toUpperCase()}`,
    status: rawBooking.status || "PENDING",
    paymentStatus: rawBooking.payment?.status || "INITIATED",
    checkInDate: rawBooking.checkInDate,
    checkOutDate: rawBooking.checkOutDate,
    totalAmount: Number(rawBooking.totalPrice || 0),
    commissionAmount:
      Number(rawBooking.payment?.platformFeeAmount || 0) ||
      Math.round(Number(rawBooking.totalPrice || 0) * 0.1),
    currency: rawBooking.currency || "NGN",
    guestName,
    guestEmail: rawBooking.guest?.email || "N/A",
    guestPhone: rawBooking.guest?.phone || "Not provided",
    hostName,
    hostEmail: rawBooking.property?.realtor?.user?.email || "N/A",
    hostPhone: rawBooking.property?.realtor?.businessPhone || "Not provided",
    propertyTitle: rawBooking.property?.title || "Property",
    propertyAddress: [
      rawBooking.property?.address,
      rawBooking.property?.city,
      rawBooking.property?.country,
    ]
      .filter(Boolean)
      .join(", "),
  };
};

const buildTimeline = (
  rawBooking: Record<string, any>,
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
      id: `payment-${rawBooking.payment.id}`,
      timestamp: rawBooking.payment.paidAt,
      title: "Payment completed",
      description: `Payment moved to ${rawBooking.payment.status}.`,
    });
  }

  toArray<Record<string, any>>(rawBooking.refundRequests).forEach((refund) => {
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
  onStatusUpdate,
  onCancelBooking,
}) => {
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [disputes, setDisputes] = useState<DisputeInfo[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "details" | "timeline" | "disputes" | "refund"
  >("details");
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [showCancelBooking, setShowCancelBooking] = useState(false);
  const [newStatus, setNewStatus] = useState("ACTIVE");
  const [updateReason, setUpdateReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [refundAmount, setRefundAmount] = useState(0);

  useEffect(() => {
    if (!isOpen || !bookingId) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [bookingResponse, disputesResponse] = await Promise.all([
          getBookingById(bookingId),
          apiClient.get<{ disputes?: Record<string, any>[] }>(
            `/disputes/booking/${bookingId}`
          ),
        ]);

        const rawBooking =
          (bookingResponse as any)?.data?.booking ||
          (bookingResponse as any)?.booking ||
          (bookingResponse as any)?.data?.data?.booking;

        if (!rawBooking) {
          throw new Error("Booking details are unavailable.");
        }

        const mappedDisputes = toArray<Record<string, any>>(
          (disputesResponse as any)?.disputes ||
            (disputesResponse as any)?.data?.disputes
        ).map((item) => ({
          id: item.id,
          type: item.disputeSubject || item.category || "DISPUTE",
          description: item.writeup || "No dispute details available.",
          status: item.status || "OPEN",
          createdAt: item.openedAt || item.createdAt,
        }));

        const mappedBooking = mapBooking(rawBooking);
        setBooking(mappedBooking);
        setDisputes(mappedDisputes);
        setTimeline(buildTimeline(rawBooking, mappedDisputes));
        setRefundAmount(mappedBooking.totalAmount);
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

  const canUpdateStatus = useMemo(
    () => Boolean(newStatus.trim()) && Boolean(updateReason.trim()),
    [newStatus, updateReason]
  );

  const canCancelBooking = useMemo(
    () => Boolean(cancelReason.trim()) && refundAmount >= 0,
    [cancelReason, refundAmount]
  );

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
                {booking.guestName} • {formatDate(booking.checkInDate)} -{" "}
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
              {["details", "timeline", "disputes", "refund"].map((tab) => (
                <button
                  key={tab}
                  onClick={() =>
                    setActiveTab(
                      tab as "details" | "timeline" | "disputes" | "refund"
                    )
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
                      <h3 className="font-semibold text-gray-900">
                        Booking Details
                      </h3>
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

                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowStatusUpdate(true)}
                        className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm"
                      >
                        Update Status
                      </button>
                      <button
                        onClick={() => setShowCancelBooking(true)}
                        className="flex-1 px-3 py-2 rounded-lg bg-red-600 text-white text-sm"
                      >
                        Cancel Booking
                      </button>
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
                      <p className="text-sm text-gray-600 mt-1">
                        {event.description}
                      </p>
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
                          {dispute.status} • {formatDateTime(dispute.createdAt)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "refund" && (
                <div className="max-w-lg space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Refund amount ({booking.currency})
                  </label>
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(event) => setRefundAmount(Number(event.target.value))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    min={0}
                    max={booking.totalAmount}
                  />
                  <label className="block text-sm font-medium text-gray-700">
                    Refund reason
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(event) => setCancelReason(event.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    rows={3}
                  />
                  <button
                    onClick={() =>
                      onCancelBooking(booking.id, cancelReason, refundAmount)
                    }
                    disabled={!canCancelBooking}
                    className="w-full rounded-lg bg-blue-600 text-white px-4 py-2 disabled:bg-gray-300"
                  >
                    Process Refund
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {showStatusUpdate && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Update booking status</h3>
              <div className="space-y-3">
                <select
                  value={newStatus}
                  onChange={(event) => setNewStatus(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DISPUTED">DISPUTED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
                <textarea
                  value={updateReason}
                  onChange={(event) => setUpdateReason(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  rows={3}
                  placeholder="Reason for status change..."
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowStatusUpdate(false)}
                    className="flex-1 rounded-lg bg-gray-100 px-4 py-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (!canUpdateStatus) return;
                      onStatusUpdate(bookingId, newStatus, updateReason);
                      setShowStatusUpdate(false);
                      setUpdateReason("");
                    }}
                    disabled={!canUpdateStatus}
                    className="flex-1 rounded-lg bg-blue-600 text-white px-4 py-2 disabled:bg-gray-300"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showCancelBooking && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Cancel booking</h3>
              <div className="space-y-3">
                <textarea
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  rows={3}
                  placeholder="Reason for cancellation..."
                />
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(event) => setRefundAmount(Number(event.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2"
                  min={0}
                  max={booking?.totalAmount || 0}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCancelBooking(false)}
                    className="flex-1 rounded-lg bg-gray-100 px-4 py-2"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => {
                      if (!canCancelBooking) return;
                      onCancelBooking(bookingId, cancelReason, refundAmount);
                      setShowCancelBooking(false);
                      setCancelReason("");
                    }}
                    disabled={!canCancelBooking}
                    className="flex-1 rounded-lg bg-red-600 text-white px-4 py-2 disabled:bg-gray-300"
                  >
                    Confirm
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDetailsModal;
