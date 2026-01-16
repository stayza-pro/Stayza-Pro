"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Calendar,
  MapPin,
  User,
  DollarSign,
  Clock,
  Phone,
  Mail,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import {
  AdminBookingDetails,
  BookingTimeline,
  DisputeInfo,
} from "@/services/adminBookingsService";

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

const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  isOpen,
  onClose,
  bookingId,
  onStatusUpdate,
  onCancelBooking,
}) => {
  const [booking, setBooking] = useState<AdminBookingDetails | null>(null);
  const [timeline, setTimeline] = useState<BookingTimeline[]>([]);
  const [disputes, setDisputes] = useState<DisputeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "details" | "timeline" | "disputes" | "refund"
  >("details");
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [showCancelBooking, setShowCancelBooking] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [updateReason, setUpdateReason] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [refundAmount, setRefundAmount] = useState(0);

  useEffect(() => {
    if (isOpen && bookingId) {
      loadBookingDetails();
    }
  }, [isOpen, bookingId]);

  const loadBookingDetails = async () => {
    setLoading(true);
    try {
      // These would be API calls in real implementation
      // For now, we'll use mock data
      const mockBooking: AdminBookingDetails = {
        id: bookingId,
        bookingReference:
          "BK" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        status: "confirmed",
        checkInDate: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        checkOutDate: new Date(
          Date.now() + 10 * 24 * 60 * 60 * 1000
        ).toISOString(),
        totalAmount: 150000,
        paidAmount: 150000,
        commissionAmount: 15000,
        guest: {
          id: "guest-1",
          name: "John Doe",
          email: "john.doe@example.com",
          phone: "+234 901 234 5678",
          verified: true,
          totalBookings: 12,
        },
        host: {
          id: "host-1",
          name: "Sarah Johnson",
          email: "sarah.johnson@example.com",
          phone: "+234 801 234 5678",
          verified: true,
          totalProperties: 3,
        },
        property: {
          id: "prop-1",
          title: "Luxury 2BR Apartment in Victoria Island",
          address: "123 Ahmadu Bello Way, Victoria Island, Lagos",
          type: "apartment",
          images: ["/images/property1.jpg"],
        },
        paymentStatus: "paid",
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        hasDisputes: false,
        disputeCount: 0,
        lastActivity: new Date().toISOString(),
        notes: [],
        tags: ["vip-guest", "repeat-customer"],
      };

      const mockTimeline: BookingTimeline[] = [
        {
          id: "1",
          timestamp: new Date(
            Date.now() - 5 * 24 * 60 * 60 * 1000
          ).toISOString(),
          event: "booking_created",
          description: "Booking created by guest",
          actor: "system",
          details: { amount: 150000, paymentMethod: "card" },
        },
        {
          id: "2",
          timestamp: new Date(
            Date.now() - 5 * 24 * 60 * 60 * 1000 + 300000
          ).toISOString(),
          event: "payment_processed",
          description: "Payment processed successfully",
          actor: "system",
          details: { transactionId: "tx_1234567890", amount: 150000 },
        },
        {
          id: "3",
          timestamp: new Date(
            Date.now() - 4 * 24 * 60 * 60 * 1000
          ).toISOString(),
          event: "booking_confirmed",
          description: "Booking confirmed by host",
          actor: "host",
          details: { hostId: "host-1", hostName: "Sarah Johnson" },
        },
      ];

      const mockDisputes: DisputeInfo[] = [];

      setBooking(mockBooking);
      setTimeline(mockTimeline);
      setDisputes(mockDisputes);
      setRefundAmount(mockBooking.totalAmount);
    } catch (error) {
      
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = () => {
    if (newStatus && updateReason) {
      onStatusUpdate(bookingId, newStatus, updateReason);
      setShowStatusUpdate(false);
      setNewStatus("");
      setUpdateReason("");
      loadBookingDetails();
    }
  };

  const handleCancelBooking = () => {
    if (cancelReason && refundAmount >= 0) {
      onCancelBooking(bookingId, cancelReason, refundAmount);
      setShowCancelBooking(false);
      setCancelReason("");
      setRefundAmount(0);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {booking?.bookingReference || `Booking ${bookingId}`}
            </h2>
            {booking && (
              <p className="text-gray-600 mt-1">
                {booking.guest.name} •{" "}
                {new Date(booking.checkInDate).toLocaleDateString()} -{" "}
                {new Date(booking.checkOutDate).toLocaleDateString()}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400">
            <X className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading booking details...</p>
          </div>
        ) : booking ? (
          <div className="flex flex-col h-[calc(90vh-120px)]">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab("details")}
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === "details"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500"
                }`}
              >
                Details
              </button>
              <button
                onClick={() => setActiveTab("timeline")}
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === "timeline"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500"
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setActiveTab("disputes")}
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === "disputes"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500"
                } ${disputes.length > 0 ? "text-red-600" : ""}`}
              >
                Disputes ({disputes.length})
              </button>
              <button
                onClick={() => setActiveTab("refund")}
                className={`px-6 py-3 font-medium text-sm ${
                  activeTab === "refund"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500"
                }`}
              >
                Refund Control
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "details" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Booking Info */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Booking Information
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Check-in:
                          </span>
                          <span className="text-sm font-medium">
                            {new Date(booking.checkInDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Check-out:
                          </span>
                          <span className="text-sm font-medium">
                            {new Date(
                              booking.checkOutDate
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Total Amount:
                          </span>
                          <span className="text-sm font-medium">
                            ₦{booking.totalAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Commission:
                          </span>
                          <span className="text-sm font-medium">
                            ₦{booking.commissionAmount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Guest Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Guest Information
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {booking.guest.name}
                          </span>
                          {booking.guest.verified && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {booking.guest.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {booking.guest.phone}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Total bookings: {booking.guest.totalBookings}
                        </div>
                      </div>
                    </div>

                    {/* Host Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Host Information
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-medium">
                            {booking.host.name}
                          </span>
                          {booking.host.verified && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {booking.host.email}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {booking.host.phone}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500">
                          Total properties: {booking.host.totalProperties}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Property Info */}
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Property Information
                      </h3>
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium">
                          {booking.property.title}
                        </h4>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <span className="text-sm text-gray-600">
                            {booking.property.address}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          Type: {booking.property.type}
                        </div>
                        {booking.property.images.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 mt-3">
                            {booking.property.images
                              .slice(0, 4)
                              .map((image: string, index: number) => (
                                <div
                                  key={index}
                                  className="aspect-video bg-gray-200 rounded-lg overflow-hidden"
                                >
                                  <img
                                    src={image}
                                    alt={`Property ${index + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src =
                                        "/images/placeholder-property.jpg";
                                    }}
                                  />
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tags */}
                    {booking.tags.length > 0 && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">
                          Tags
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {booking.tags.map((tag: string, index: number) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status & Actions */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Status & Actions
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">
                            Current Status:
                          </span>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              booking.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : booking.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : booking.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {booking.status}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowStatusUpdate(true)}
                            className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
                          >
                            Update Status
                          </button>
                          <button
                            onClick={() => setShowCancelBooking(true)}
                            className="flex-1 bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
                          >
                            Cancel Booking
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "timeline" && (
                <div className="space-y-4">
                  {timeline.map((event) => (
                    <div
                      key={event.id}
                      className="flex gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-shrink-0">
                        <Clock className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">
                            {event.description}
                          </h4>
                          <span className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Actor: {event.actor}
                        </p>
                        {event.details && (
                          <div className="text-xs text-gray-500 mt-2">
                            <pre className="whitespace-pre-wrap">
                              {JSON.stringify(event.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "disputes" && (
                <div className="space-y-4">
                  {disputes.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                      <h3 className="font-medium text-gray-900 mb-1">
                        No Disputes
                      </h3>
                      <p className="text-gray-500">
                        This booking has no active disputes.
                      </p>
                    </div>
                  ) : (
                    disputes.map((dispute) => (
                      <div
                        key={dispute.id}
                        className="p-4 bg-red-50 border border-red-200 rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-medium text-red-900">
                              {dispute.type}
                            </h4>
                            <p className="text-red-700 text-sm mt-1">
                              {dispute.description}
                            </p>
                            <p className="text-red-600 text-xs mt-2">
                              Created:{" "}
                              {new Date(dispute.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "refund" && (
                <div className="space-y-6">
                  {/* Current Refund Status */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Current Refund Status
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">
                          Booking Total:{" "}
                          <span className="font-medium">
                            ₦{booking?.totalAmount?.toLocaleString()}
                          </span>
                        </p>
                        <p className="text-sm text-gray-600">
                          Refund Status:{" "}
                          <span className="font-medium text-orange-600">
                            No refund processed
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Quick Refund Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => {
                        if (booking) {
                          onCancelBooking(
                            booking.id,
                            "Full refund approved by admin",
                            booking.totalAmount
                          );
                          onClose();
                        }
                      }}
                      className="p-4 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="text-center">
                        <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                        <h4 className="font-medium text-green-900">
                          Full Refund
                        </h4>
                        <p className="text-sm text-green-700">100% refund</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        if (booking) {
                          const halfAmount = Math.round(
                            booking.totalAmount * 0.5
                          );
                          onCancelBooking(
                            booking.id,
                            "Partial refund (50%) approved by admin",
                            halfAmount
                          );
                          onClose();
                        }
                      }}
                      className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <div className="text-center">
                        <DollarSign className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                        <h4 className="font-medium text-yellow-900">
                          Partial Refund
                        </h4>
                        <p className="text-sm text-yellow-700">50% refund</p>
                      </div>
                    </button>

                    <button
                      onClick={() => {
                        if (booking) {
                          onCancelBooking(
                            booking.id,
                            "No refund - admin decision",
                            0
                          );
                          onClose();
                        }
                      }}
                      className="p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <div className="text-center">
                        <X className="h-8 w-8 text-red-600 mx-auto mb-2" />
                        <h4 className="font-medium text-red-900">No Refund</h4>
                        <p className="text-sm text-red-700">0% refund</p>
                      </div>
                    </button>
                  </div>

                  {/* Custom Refund */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Custom Refund Amount
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Refund Amount (₦)
                        </label>
                        <input
                          type="number"
                          value={refundAmount}
                          onChange={(e) =>
                            setRefundAmount(Number(e.target.value))
                          }
                          min={0}
                          max={booking?.totalAmount || 0}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Refund Reason
                        </label>
                        <textarea
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          placeholder="Reason for this refund amount..."
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (booking && cancelReason) {
                            onCancelBooking(
                              booking.id,
                              cancelReason,
                              refundAmount
                            );
                            onClose();
                          }
                        }}
                        disabled={!cancelReason || refundAmount < 0}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Process Custom Refund
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-red-600">Failed to load booking details</p>
          </div>
        )}

        {/* Status Update Modal */}
        {showStatusUpdate && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Update Booking Status
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    New Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="checked-in">Checked In</option>
                    <option value="checked-out">Checked Out</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reason
                  </label>
                  <textarea
                    value={updateReason}
                    onChange={(e) => setUpdateReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Reason for status update..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowStatusUpdate(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={!newStatus || !updateReason}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Booking Modal */}
        {showCancelBooking && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Cancel Booking
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cancellation Reason
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Reason for cancellation..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Refund Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      ₦
                    </span>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) => setRefundAmount(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min={0}
                      max={booking?.totalAmount || 0}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum: ₦{booking?.totalAmount?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowCancelBooking(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCancelBooking}
                    disabled={!cancelReason}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Cancel Booking
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
