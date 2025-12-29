"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { getEscrowStatus, EscrowStatusData } from "@/services/escrow";
import { bookingService } from "@/services/bookings";
import { formatDistanceToNow, format } from "date-fns";
import { Booking } from "@/types";

interface BookingWithEscrow {
  booking: Booking;
  escrowData: EscrowStatusData | null;
  loading: boolean;
  error: string | null;
}

export default function RealtorEscrowTracker() {
  const [bookingsWithEscrow, setBookingsWithEscrow] = useState<
    BookingWithEscrow[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update timer every second for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchAllBookingsWithEscrow();
  }, []);

  const fetchAllBookingsWithEscrow = async () => {
    try {
      setLoading(true);
      const bookings = await bookingService.getRealtorBookings();

      // Filter only bookings with payments
      const paidBookings = bookings.filter((b: Booking) =>
        ["CONFIRMED", "CHECKED_IN", "CHECKED_OUT", "COMPLETED"].includes(
          b.status
        )
      );

      // Initialize bookings with escrow data
      const bookingsWithEscrowInit: BookingWithEscrow[] = paidBookings.map(
        (booking) => ({
          booking,
          escrowData: null,
          loading: true,
          error: null,
        })
      );

      setBookingsWithEscrow(bookingsWithEscrowInit);

      // Fetch escrow data for each booking
      for (let i = 0; i < paidBookings.length; i++) {
        try {
          const escrowData = await getEscrowStatus(paidBookings[i].id);
          console.log(
            `Escrow data for booking ${paidBookings[i].id}:`,
            escrowData
          );
          setBookingsWithEscrow((prev) => {
            const updated = [...prev];
            updated[i] = {
              ...updated[i],
              escrowData,
              loading: false,
            };
            return updated;
          });
        } catch (error: any) {
          console.error(
            `Error loading escrow for booking ${paidBookings[i].id}:`,
            error
          );
          setBookingsWithEscrow((prev) => {
            const updated = [...prev];
            updated[i] = {
              ...updated[i],
              loading: false,
              error: error.message || "Failed to load escrow data",
            };
            return updated;
          });
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const formatTimer = (targetDate: string) => {
    const target = new Date(targetDate);
    const remainingMs = target.getTime() - currentTime.getTime();

    if (remainingMs <= 0) return "Expired";

    const hours = Math.floor(remainingMs / (1000 * 60 * 60));
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000);

    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h ${minutes}m`;
    }

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }

    return `${minutes}m ${seconds}s`;
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "HELD":
        return "bg-yellow-100 text-yellow-800";
      case "RELEASED":
      case "REFUNDED":
      case "COLLECTED":
        return "bg-green-100 text-green-800";
      case "DEDUCTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Escrow Tracker
        </h1>
        <p className="text-gray-600">
          Track payment releases and security deposits for your bookings
        </p>
      </div>

      {bookingsWithEscrow.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No bookings with payments yet
          </h3>
          <p className="mt-2 text-gray-500">
            Once you have confirmed bookings, their escrow details will appear
            here
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {bookingsWithEscrow.map(
            ({ booking, escrowData, loading: escrowLoading, error }) => (
              <div
                key={booking.id}
                className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
              >
                {/* Booking Header */}
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-gray-200">
                  <div className="flex items-start gap-4">
                    <img
                      src={
                        booking.property?.images?.[0]
                          ? typeof booking.property.images[0] === "string"
                            ? booking.property.images[0]
                            : booking.property.images[0]?.url ||
                              "/images/placeholder.jpg"
                          : "/images/placeholder.jpg"
                      }
                      alt={booking.property?.title || "Property"}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900">
                        {booking.property?.title || "Property"}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        Guest: {booking.guest?.firstName}{" "}
                        {booking.guest?.lastName}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                        <span>
                          {format(new Date(booking.checkInDate), "MMM d")} -{" "}
                          {format(
                            new Date(booking.checkOutDate),
                            "MMM d, yyyy"
                          )}
                        </span>
                        <span className="px-2 py-1 bg-white rounded text-xs font-medium">
                          {booking.status}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(booking.totalPrice)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Escrow Details */}
                {escrowLoading ? (
                  <div className="p-12 flex justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                  </div>
                ) : error ? (
                  <div className="p-6 text-center text-red-600">
                    <p>{error}</p>
                  </div>
                ) : escrowData ? (
                  <div className="p-6 space-y-6">
                    {/* Fund Breakdown */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Fund Breakdown
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Room Fee */}
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-medium text-gray-700">
                              Room Fee
                            </h4>
                            <span
                              className={`text-xs px-2 py-1 rounded ${getStatusBadgeColor(
                                escrowData.funds?.roomFee?.status || "UNKNOWN"
                              )}`}
                            >
                              {escrowData.funds?.roomFee?.status || "UNKNOWN"}
                            </span>
                          </div>
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(
                              escrowData.funds?.roomFee?.amount || 0
                            )}
                          </p>
                          {escrowData.funds?.roomFee?.realtorAmount !==
                            undefined && (
                            <div className="mt-2 text-xs text-gray-600 space-y-1">
                              <p>
                                Your share:{" "}
                                <span className="font-semibold">
                                  {formatCurrency(
                                    escrowData.funds?.roomFee?.realtorAmount ||
                                      0
                                  )}
                                </span>
                              </p>
                              <p>
                                Platform:{" "}
                                <span className="font-semibold">
                                  {formatCurrency(
                                    escrowData.funds?.roomFee?.platformAmount ||
                                      0
                                  )}
                                </span>
                              </p>
                            </div>
                          )}
                          {escrowData.funds?.roomFee?.releasedAt && (
                            <p className="text-xs text-gray-500 mt-2">
                              Released:{" "}
                              {formatDistanceToNow(
                                new Date(escrowData.funds.roomFee.releasedAt),
                                { addSuffix: true }
                              )}
                            </p>
                          )}
                        </div>

                        {/* Security Deposit */}
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-medium text-gray-700">
                              Security Deposit
                            </h4>
                            <span
                              className={`text-xs px-2 py-1 rounded ${getStatusBadgeColor(
                                escrowData.funds?.securityDeposit?.status ||
                                  "UNKNOWN"
                              )}`}
                            >
                              {escrowData.funds?.securityDeposit?.status ||
                                "UNKNOWN"}
                            </span>
                          </div>
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(
                              escrowData.funds?.securityDeposit?.amount || 0
                            )}
                          </p>
                          {escrowData.funds?.securityDeposit?.refundedAt && (
                            <p className="text-xs text-gray-500 mt-2">
                              Refunded:{" "}
                              {formatDistanceToNow(
                                new Date(
                                  escrowData.funds.securityDeposit.refundedAt
                                ),
                                { addSuffix: true }
                              )}
                            </p>
                          )}
                        </div>

                        {/* Cleaning Fee */}
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-medium text-gray-700">
                              Cleaning Fee
                            </h4>
                            <span
                              className={`text-xs px-2 py-1 rounded ${getStatusBadgeColor(
                                escrowData.funds?.cleaningFee?.status ||
                                  "UNKNOWN"
                              )}`}
                            >
                              {escrowData.funds?.cleaningFee?.status ||
                                "UNKNOWN"}
                            </span>
                          </div>
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(
                              escrowData.funds?.cleaningFee?.amount || 0
                            )}
                          </p>
                        </div>

                        {/* Service Fee */}
                        <div className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-sm font-medium text-gray-700">
                              Service Fee
                            </h4>
                            <span
                              className={`text-xs px-2 py-1 rounded ${getStatusBadgeColor(
                                escrowData.funds?.serviceFee?.status ||
                                  "UNKNOWN"
                              )}`}
                            >
                              {escrowData.funds?.serviceFee?.status ||
                                "UNKNOWN"}
                            </span>
                          </div>
                          <p className="text-xl font-bold text-gray-900">
                            {formatCurrency(
                              escrowData.funds?.serviceFee?.amount || 0
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            Platform collection
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Timers */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Release Schedule
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Room Fee Release Timer */}
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Room Fee Release
                          </h4>
                          <p className="text-xs text-gray-600 mb-2">
                            1 hour after check-in
                          </p>
                          <p className="text-lg font-bold text-blue-700">
                            {escrowData.timers?.roomFeeRelease?.isPast
                              ? "Released"
                              : escrowData.timers?.roomFeeRelease?.date
                              ? formatTimer(
                                  escrowData.timers.roomFeeRelease.date
                                )
                              : "Calculating..."}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {escrowData.timers?.roomFeeRelease?.date &&
                              format(
                                new Date(escrowData.timers.roomFeeRelease.date),
                                "MMM dd, HH:mm"
                              )}
                          </p>
                        </div>

                        {/* Deposit Refund Timer */}
                        <div className="bg-green-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Deposit Refund
                          </h4>
                          <p className="text-xs text-gray-600 mb-2">
                            48 hours after checkout
                          </p>
                          <p className="text-lg font-bold text-green-700">
                            {escrowData.timers?.depositRefund?.isPast
                              ? "Processed"
                              : escrowData.timers?.depositRefund?.date
                              ? formatTimer(
                                  escrowData.timers.depositRefund.date
                                )
                              : "Calculating..."}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {escrowData.timers?.depositRefund?.date &&
                              format(
                                new Date(escrowData.timers.depositRefund.date),
                                "MMM dd, HH:mm"
                              )}
                          </p>
                        </div>

                        {/* Dispute Window */}
                        <div className="bg-yellow-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Dispute Window
                          </h4>
                          <p className="text-xs text-gray-600 mb-2">
                            Until deposit refund
                          </p>
                          <p className="text-lg font-bold text-yellow-700">
                            {escrowData.timers?.disputeWindow?.isPast
                              ? "Closed"
                              : "Open"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Dispute Info */}
                    {escrowData.dispute?.hasDispute && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-red-900 mb-2">
                          ⚠️ Active Dispute
                        </h3>
                        <p className="text-sm text-red-700">
                          Status:{" "}
                          <span className="font-semibold">
                            {escrowData.dispute?.status || "UNKNOWN"}
                          </span>
                        </p>
                        {escrowData.dispute?.openedAt && (
                          <p className="text-xs text-red-600 mt-1">
                            Opened:{" "}
                            {formatDistanceToNow(
                              new Date(escrowData.dispute.openedAt),
                              {
                                addSuffix: true,
                              }
                            )}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Event Timeline */}
                    {escrowData.events && escrowData.events.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Event Timeline
                        </h3>
                        <div className="space-y-3">
                          {escrowData.events.slice(0, 5).map((event) => (
                            <div
                              key={event.id}
                              className="flex items-start gap-3 pb-3 border-b border-gray-200 last:border-0"
                            >
                              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {event.description}
                                </p>
                                {event.amount && (
                                  <p className="text-sm text-gray-600">
                                    Amount: {formatCurrency(event.amount)}
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">
                                  {formatDistanceToNow(
                                    new Date(event.createdAt),
                                    {
                                      addSuffix: true,
                                    }
                                  )}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
