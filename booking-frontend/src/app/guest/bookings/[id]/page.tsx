"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Calendar,
  MapPin,
  Users,
  Mail,
  Home,
  Download,
  X,
  ArrowLeft,
  Star,
  MessageCircle,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  FileWarning,
  Send,
} from "lucide-react";
import Image from "next/image";
import { Footer } from "@/components/guest/sections";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Card, Button } from "@/components/ui";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { bookingService } from "@/services/bookings";
import { disputeService } from "@/services/disputes";
import { paymentService } from "@/services/payments";
import { BookingStatus } from "@/types";
import { canDownloadReceipt, formatPaymentStatus } from "@/utils/bookingEnums";
import { DisputeIssueType, DisputeMessage } from "@/types/dispute";
import { EscrowStatusSection } from "@/components/booking/EscrowStatusSection";
import { toast } from "react-hot-toast";

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const {
    brandColor: primaryColor, // Lighter touch - primary for CTAs and key elements
    secondaryColor, // Lighter touch - secondary for confirmed status
    accentColor, // Lighter touch - accent for pending status
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding();
  const queryClient = useQueryClient();
  const bookingId = params.id as string;
  const [authChecked, setAuthChecked] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  // Dispute states
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [showViewDisputeModal, setShowViewDisputeModal] = useState(false);
  const [disputeSubject, setDisputeSubject] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const [disputeIssueType, setDisputeIssueType] =
    useState<DisputeIssueType>("OTHER");
  const [disputeResponse, setDisputeResponse] = useState("");

  const getApiErrorMessage = (error: unknown, fallback: string): string => {
    if (!error || typeof error !== "object") {
      return fallback;
    }

    const maybeResponse = error as {
      message?: string;
      response?: { data?: { message?: string } };
    };

    return (
      maybeResponse.response?.data?.message || maybeResponse.message || fallback
    );
  };

  // Mark auth as checked once we've gotten a result
  React.useEffect(() => {
    if (!isLoading && (isAuthenticated || !authChecked)) {
      setAuthChecked(true);
    }
  }, [isLoading, isAuthenticated, authChecked]);

  // Redirect if not authenticated
  React.useEffect(() => {
    if (authChecked && !isLoading && !isAuthenticated) {
      router.push(`/guest/login?returnTo=/guest/bookings/${bookingId}`);
    }
  }, [isLoading, isAuthenticated, authChecked, router, bookingId]);

  // Fetch booking details
  const { data: booking, isLoading: bookingLoading } = useQuery({
    queryKey: ["booking", bookingId],
    queryFn: () => bookingService.getBooking(bookingId),
    enabled: !!user && !!bookingId,
  });

  // Fetch dispute for this booking
  const { data: existingDispute } = useQuery({
    queryKey: ["booking-dispute", bookingId],
    queryFn: () => disputeService.getDisputeByBooking(bookingId),
    enabled: !!user && !!bookingId && !!booking,
    retry: false,
  });

  // Redirect unpaid bookings to checkout page
  React.useEffect(() => {
    if (
      booking &&
      booking.status === "PENDING" &&
      booking.payment?.status === "INITIATED"
    ) {
      router.push(`/guest/bookings/${bookingId}/checkout`);
    }
  }, [booking, bookingId, router]);

  // Fetch cancellation preview when modal opens
  const {
    data: cancellationPreview,
    isLoading: previewLoading,
    error: previewError,
    refetch: refetchPreview,
  } = useQuery({
    queryKey: ["cancellation-preview", bookingId],
    queryFn: async () => {
      const result = await bookingService.previewCancellation(bookingId);
      if (!result) {
        throw new Error("No preview data received");
      }
      return result;
    },
    enabled: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 0,
    cacheTime: 0,
    retry: false,
  });

  // Fetch preview when modal opens
  React.useEffect(() => {
    if (showCancelModal && bookingId) {
      refetchPreview();
    }
  }, [showCancelModal, bookingId, refetchPreview]);

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: (reason: string) =>
      bookingService.cancelBooking(bookingId, reason),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["guest-bookings"] });
      setShowCancelModal(false);
      setCancelReason("");

      // Show success message with refund details
      const { refund } = response.data;
      let message = "Booking cancelled successfully.";

      if (refund) {
        if (refund.totals.customerRefund > 0) {
          message += ` Your refund of ${formatPrice(
            refund.totals.customerRefund,
            booking?.currency || "NGN",
          )} has been automatically processed.`;
        } else {
          message +=
            " Late cancellation - no refund applicable (security deposit policy).";
        }
      }

      toast.success(message, {
        duration: 5000,
      });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to cancel booking"), {
        duration: 4000,
      });
    },
  });

  // Request refund mutation
  const refundMutation = useMutation({
    mutationFn: ({ amount, reason }: { amount: number; reason: string }) =>
      bookingService.requestRefund(bookingId, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking", bookingId] });
      queryClient.invalidateQueries({ queryKey: ["guest-bookings"] });
      setShowRefundModal(false);
      setRefundAmount("");
      setRefundReason("");
    },
  });

  // Create dispute mutation
  const createDisputeMutation = useMutation({
    mutationFn: () =>
      disputeService.createDispute({
        bookingId,
        subject: disputeSubject,
        description: disputeDescription,
        issueType: disputeIssueType,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["booking-dispute", bookingId],
      });
      setShowDisputeModal(false);
      setDisputeSubject("");
      setDisputeDescription("");
      setDisputeIssueType("OTHER");
      toast.success(
        "Dispute created successfully. The host will be notified.",
        {
          duration: 4000,
        },
      );
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to create dispute"), {
        duration: 4000,
      });
    },
  });

  // Respond to dispute mutation
  const respondDisputeMutation = useMutation({
    mutationFn: () =>
      disputeService.respondToDispute(existingDispute!.id, {
        message: disputeResponse,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["booking-dispute", bookingId],
      });
      setDisputeResponse("");
      toast.success("Response sent successfully", { duration: 3000 });
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, "Failed to send response"), {
        duration: 4000,
      });
    },
  });

  const handleCancelBooking = () => {
    if (!cancelReason.trim()) {
      alert("Please provide a cancellation reason");
      return;
    }
    cancelMutation.mutate(cancelReason);
  };

  const handleRequestRefund = () => {
    if (!refundAmount || parseFloat(refundAmount) <= 0) {
      alert("Please enter a valid refund amount");
      return;
    }
    if (!refundReason.trim()) {
      alert("Please provide a refund reason");
      return;
    }
    if (parseFloat(refundAmount) > booking!.totalPrice) {
      alert("Refund amount cannot exceed the total booking amount");
      return;
    }
    refundMutation.mutate({
      amount: parseFloat(refundAmount),
      reason: refundReason,
    });
  };

  // Refund calculation now handled by backend

  const handleDownloadReceipt = () => {
    const paymentId = booking?.payment?.id;

    if (!paymentId) {
      toast.error("No receipt available yet.");
      return;
    }

    if (!canDownloadReceipt(booking?.paymentStatus)) {
      const paymentStatusLabel = booking?.paymentStatus
        ? formatPaymentStatus(booking.paymentStatus)
        : "Unknown";
      toast.error(
        `Receipt available once payment is released. Current status: ${paymentStatusLabel}.`,
      );
      return;
    }

    paymentService
      .downloadReceipt(paymentId)
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `receipt-${paymentId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch(() => {
        toast.error("Unable to download receipt.");
      });
  };

  const handleWriteReview = () => {
    router.push(`/guest/bookings/${bookingId}/review`);
  };

  const handleContactHost = () => {
    router.push(`/guest/messages?bookingId=${bookingId}`);
  };

  const handleCreateDispute = () => {
    if (!disputeSubject.trim() || disputeSubject.length < 5) {
      toast.error("Please provide a subject (at least 5 characters)", {
        duration: 3000,
      });
      return;
    }
    if (!disputeDescription.trim() || disputeDescription.length < 20) {
      toast.error(
        "Please provide a detailed description (at least 20 characters)",
        { duration: 3000 },
      );
      return;
    }
    createDisputeMutation.mutate();
  };

  const handleRespondToDispute = () => {
    if (!disputeResponse.trim() || disputeResponse.length < 10) {
      toast.error("Please provide a response (at least 10 characters)", {
        duration: 3000,
      });
      return;
    }
    if (existingDispute && existingDispute.guestArgumentCount >= 2) {
      toast.error("You have reached the maximum number of responses (2)", {
        duration: 4000,
      });
      return;
    }
    respondDisputeMutation.mutate();
  };

  const canOpenDispute = () => {
    if (!booking || !existingDispute) return true;
    // Can't open new dispute if one already exists
    return false;
  };

  const canRespondToDispute = () => {
    if (!existingDispute) return false;
    // Check if guest has reached argument limit
    if (existingDispute.guestArgumentCount >= 2) return false;
    // Check if waiting for realtor response
    if (existingDispute.status === "PENDING_REALTOR_RESPONSE") return false;
    return true;
  };

  const getStatusConfig = (status: BookingStatus) => {
    switch (status) {
      case "ACTIVE":
        return {
          icon: CheckCircle,
          text: "ACTIVE",
          backgroundColor: secondaryColor,
          color: "#ffffff",
          borderColor: secondaryColor,
        };
      case "PENDING":
        return {
          icon: Clock,
          text: "Pending",
          backgroundColor: accentColor,
          color: "#ffffff",
          borderColor: accentColor,
        };
      case "CANCELLED":
        return {
          icon: XCircle,
          text: "Cancelled",
          backgroundColor: "#FEE2E2",
          color: "#991B1B",
          borderColor: "#FECACA",
        };
      case "COMPLETED":
        return {
          icon: CheckCircle,
          text: "Completed",
          backgroundColor: primaryColor, // Lighter touch - primary for completed status
          color: "#ffffff",
          borderColor: primaryColor,
        };
      default:
        return {
          icon: Clock,
          text: status,
          backgroundColor: "#F3F4F6",
          color: "#1F2937",
          borderColor: "#E5E7EB",
        };
    }
  };

  const isOngoing = () => {
    if (!booking) return false;
    const now = new Date();
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    return checkIn <= now && checkOut >= now && booking.status === "ACTIVE";
  };

  const canCancel = () => {
    if (!booking) return false;
    const checkIn = new Date(booking.checkInDate);
    const now = new Date();
    const hoursDiff = (checkIn.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Allow cancellation for pending or active bookings before check-in.
    // Can cancel anytime BEFORE check-in (even with 0% refund in LATE tier)
    // Cannot cancel after check-in time has passed
    return (
      (booking.status === "PENDING" || booking.status === "ACTIVE") &&
      hoursDiff > 0 && // Before check-in time
      booking.paymentStatus !== "REFUNDED"
    );
  };

  const canReview = () => {
    if (!booking) return false;
    const checkOut = new Date(booking.checkOutDate);
    const now = new Date();
    return (
      booking.status === "COMPLETED" &&
      checkOut < now &&
      !booking.reviews?.length
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (price: number, currency: string = "NGN") => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const calculateNights = () => {
    if (!booking) return 0;
    const start = new Date(booking.checkInDate);
    const end = new Date(booking.checkOutDate);
    return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (!authChecked || isLoading || bookingLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GuestHeader
          currentPage="bookings"
          searchPlaceholder="Search your bookings..."
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-200 rounded w-1/3"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
        <Footer
          realtorName={realtorName}
          tagline={tagline}
          logo={logoUrl}
          description={description}
          primaryColor={primaryColor}
        />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GuestHeader
          currentPage="bookings"
          searchPlaceholder="Search your bookings..."
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Card className="p-4 sm:p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Booking Not Found
            </h2>
            <p className="text-gray-600 mb-6">
              The booking you&apos;re looking for doesn&apos;t exist or you
              don&apos;t have access to it.
            </p>
            <Button onClick={() => router.push("/guest/bookings")}>
              Back to Bookings
            </Button>
          </Card>
        </div>
        <Footer
          realtorName={realtorName}
          tagline={tagline}
          logo={logoUrl}
          description={description}
          primaryColor={primaryColor}
        />
      </div>
    );
  }

  const status = getStatusConfig(booking.status);
  const StatusIcon = status.icon;
  const nights = calculateNights();
  const ongoing = isOngoing();
  const secondaryBrand = secondaryColor || primaryColor;
  const sensitiveDetailsUnlocked =
    booking.sensitiveDetailsUnlocked ??
    ["HELD", "PARTIALLY_RELEASED", "SETTLED"].includes(
      String(booking.paymentStatus || ""),
    );
  const bookingVerificationCode =
    booking.bookingVerificationCode || `STZ-${booking.id}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <GuestHeader
        currentPage="bookings"
        searchPlaceholder="Search your bookings..."
      />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <button
            onClick={() => router.push("/guest/bookings")}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to bookings
          </button>
          <div
            className="flex items-center space-x-2 px-4 py-2 rounded-full border-2 font-medium"
            style={{
              backgroundColor: status.backgroundColor,
              color: status.color,
              borderColor: status.borderColor,
            }}
          >
            <StatusIcon className="h-5 w-5" />
            <span>{status.text}</span>
          </div>
        </div>

        <Card className="overflow-hidden border border-gray-200 shadow-sm bg-transparent">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-5 relative min-h-[240px] bg-gray-100">
              {booking.property?.images?.[0]?.url ? (
                <Image
                  src={booking.property.images[0].url}
                  alt={booking.property.title || "Property"}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Home className="h-16 w-16 text-gray-300" />
                </div>
              )}
            </div>
            <div className="lg:col-span-7 p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500">
                    Booking Reference
                  </p>
                  <p className="font-mono text-sm text-gray-900">
                    #{booking.id.slice(-8).toUpperCase()}
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  Booked on {formatDate(booking.createdAt)}
                </div>
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                  {booking.property?.title || "Booking Details"}
                </h1>
                <div className="flex items-center text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  <span>
                    {booking.property?.city || "-"},{" "}
                    {booking.property?.state || "-"}
                  </span>
                </div>
                {sensitiveDetailsUnlocked && booking.property?.address && (
                  <p className="text-sm text-gray-500 mt-1">
                    {booking.property.address}
                  </p>
                )}
                {!sensitiveDetailsUnlocked && (
                  <p className="text-sm text-amber-700 mt-1">
                    Exact address unlocks after payment confirmation.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg border border-gray-200 p-3 bg-transparent">
                  <p className="text-xs text-gray-500">Check-in</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(booking.checkInDate)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 bg-transparent">
                  <p className="text-xs text-gray-500">Check-out</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(booking.checkOutDate)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 bg-transparent">
                  <p className="text-xs text-gray-500">Guests</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {booking.totalGuests}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3 bg-transparent">
                  <p className="text-xs text-gray-500">Nights</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {nights}
                  </p>
                </div>
              </div>

              {ongoing && (
                <div
                  className="border rounded-lg p-3 flex items-center"
                  style={{
                    backgroundColor: accentColor + "10",
                    borderColor: accentColor + "30",
                  }}
                >
                  <AlertCircle
                    className="h-5 w-5 mr-3"
                    style={{ color: accentColor }}
                  />
                  <p className="font-medium" style={{ color: accentColor }}>
                    Your stay is currently ongoing. Enjoy your time!
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
          <div className="lg:col-span-8 space-y-6">
            <Card className="p-6 border border-gray-200 shadow-sm bg-transparent">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-xl font-semibold text-gray-900 flex items-center"
                  style={{ color: secondaryBrand }}
                >
                  <Home className="h-5 w-5 mr-2" />
                  Property & Host
                </h2>
                <span className="text-xs text-gray-400">
                  Powered by Stayza Pro
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span>
                      {sensitiveDetailsUnlocked
                        ? booking.property?.address || "Address not available"
                        : "Address hidden until payment is confirmed"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                    <span>
                      {booking.property?.city || "-"},{" "}
                      {booking.property?.state || "-"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Home className="h-4 w-4 mr-2 text-gray-400" />
                    <span className="capitalize">
                      {booking.property?.type
                        ? booking.property.type.toLowerCase().replace(/_/g, " ")
                        : "Property"}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                    <span>
                      {booking.property?.bedrooms || 0} bedrooms /{" "}
                      {booking.property?.bathrooms || 0} baths / up to{" "}
                      {booking.property?.maxGuests || booking.totalGuests}{" "}
                      guests
                    </span>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs text-gray-500 mb-1">Hosted by</p>
                  <p className="font-semibold text-gray-900">
                    {booking.property?.realtor?.businessName || "Host"}
                  </p>
                  {sensitiveDetailsUnlocked &&
                    booking.property?.realtor?.businessEmail && (
                      <div className="flex items-center text-sm text-gray-600 mt-2">
                        <Mail className="h-4 w-4 mr-2" />
                        <span>{booking.property.realtor.businessEmail}</span>
                      </div>
                    )}
                  {!sensitiveDetailsUnlocked && (
                    <p className="text-xs text-amber-700 mt-2">
                      Host direct contact unlocks after payment confirmation.
                    </p>
                  )}
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-gray-200 shadow-sm bg-transparent">
              <h2
                className="text-xl font-semibold text-gray-900 mb-4 flex items-center"
                style={{ color: secondaryBrand }}
              >
                <Calendar className="h-5 w-5 mr-2" />
                Stay Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Check-in</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(booking.checkInDate)}
                  </p>
                  <p className="text-sm text-gray-600">
                    After {booking.property?.checkInTime || "2:00 PM"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Check-out</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(booking.checkOutDate)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Before {booking.property?.checkOutTime || "11:00 AM"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Guests</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {booking.totalGuests}{" "}
                    {booking.totalGuests === 1 ? "guest" : "guests"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Duration</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {nights} {nights === 1 ? "night" : "nights"}
                  </p>
                </div>
              </div>

              {booking.specialRequests && (
                <div className="border-t border-gray-200 mt-6 pt-6">
                  <p className="text-sm text-gray-600 mb-2">Special Requests</p>
                  <p className="text-gray-900">{booking.specialRequests}</p>
                </div>
              )}
            </Card>

            <Card className="p-6 border border-gray-200 shadow-sm bg-transparent">
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-xl font-semibold text-gray-900"
                  style={{ color: secondaryBrand }}
                >
                  Payment Summary
                </h2>
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: primaryColor + "15",
                    color: primaryColor,
                  }}
                >
                  {formatPaymentStatus(booking.paymentStatus)}
                </span>
              </div>

              <div className="space-y-3 text-gray-700">
                <div className="flex justify-between">
                  <span>Average per night</span>
                  <span>
                    {formatPrice(booking.totalPrice / nights, booking.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total nights</span>
                  <span>{nights}</span>
                </div>
                {booking.payment?.method && (
                  <div className="flex justify-between">
                    <span>Payment Method</span>
                    <span className="capitalize">
                      {booking.payment.method.toLowerCase()}
                    </span>
                  </div>
                )}
                {booking.payment?.reference && (
                  <div>
                    <p className="text-sm text-gray-500">Payment Reference</p>
                    <p className="font-mono text-sm text-gray-900 break-all">
                      {booking.payment.reference}
                    </p>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold text-gray-900 text-lg">
                  <span>Total Paid</span>
                  <span>
                    {formatPrice(booking.totalPrice, booking.currency)}
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6 border border-gray-200 shadow-sm bg-transparent">
              <h2
                className="text-xl font-semibold text-gray-900 mb-4"
                style={{ color: secondaryBrand }}
              >
                Verified Booking Artifact
              </h2>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-600">
                    Official Stayza Pro confirmation code
                  </p>
                  <p className="font-mono text-lg text-gray-900 mt-1">
                    {bookingVerificationCode}
                  </p>
                </div>
                <span
                  className="text-xs font-semibold px-3 py-1 rounded-full"
                  style={{
                    backgroundColor: sensitiveDetailsUnlocked
                      ? "#DCFCE7"
                      : "#FEF3C7",
                    color: sensitiveDetailsUnlocked ? "#166534" : "#92400E",
                  }}
                >
                  {sensitiveDetailsUnlocked
                    ? "Secure Payment Verified"
                    : "Pending Payment Verification"}
                </span>
              </div>
            </Card>

            {(booking.status === "ACTIVE" ||
              booking.status === "DISPUTED" ||
              booking.status === "COMPLETED") && (
              <EscrowStatusSection booking={booking} viewType="guest" />
            )}
          </div>

          <div className="lg:col-span-4">
            <div className="space-y-4 lg:sticky lg:top-24">
              <Card
                className="p-5 border shadow-sm bg-transparent"
                style={{ borderColor: primaryColor + "30" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3
                    className="font-semibold text-gray-900"
                    style={{ color: secondaryBrand }}
                  >
                    Action Center
                  </h3>
                  <span className="text-xs text-gray-400">Guest</span>
                </div>
                <div className="space-y-2">
                  <Button
                    onClick={handleContactHost}
                    className="w-full text-white"
                    disabled={!sensitiveDetailsUnlocked}
                    style={{ backgroundColor: primaryColor }}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Contact Host
                  </Button>

                  <Button
                    onClick={handleDownloadReceipt}
                    className="w-full"
                    variant="outline"
                    disabled={!canDownloadReceipt(booking.paymentStatus)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Receipt
                  </Button>

                  {canReview() && (
                    <Button
                      onClick={handleWriteReview}
                      className="w-full"
                      variant="outline"
                    >
                      <Star className="h-4 w-4 mr-2" />
                      Write a Review
                    </Button>
                  )}

                  {canCancel() && (
                    <Button
                      onClick={() => setShowCancelModal(true)}
                      className="w-full"
                      variant="outline"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel Booking
                    </Button>
                  )}

                  {!existingDispute && canOpenDispute() && (
                    <Button
                      onClick={() => setShowDisputeModal(true)}
                      className="w-full"
                      variant="outline"
                    >
                      <FileWarning className="h-4 w-4 mr-2" />
                      Report Issue
                    </Button>
                  )}

                  {existingDispute && (
                    <Button
                      onClick={() => setShowViewDisputeModal(true)}
                      className="w-full relative"
                      variant="outline"
                    >
                      <FileWarning className="h-4 w-4 mr-2" />
                      View Dispute
                      {existingDispute.status === "PENDING_GUEST_RESPONSE" && (
                        <span
                          className="absolute top-1 right-1 h-3 w-3 rounded-full animate-pulse"
                          style={{ backgroundColor: primaryColor }}
                        />
                      )}
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-4">
                  {!sensitiveDetailsUnlocked
                    ? "Contact and full property details unlock after payment confirmation."
                    : "Receipts are available after payment release."}
                </p>
              </Card>

              <Card
                className="p-5 border shadow-sm bg-transparent"
                style={{ borderColor: accentColor + "35" }}
              >
                <h3
                  className="font-semibold text-gray-900 mb-2"
                  style={{ color: secondaryBrand }}
                >
                  Need Help?
                </h3>
                <p className="text-sm text-gray-700 mb-3">
                  If you have any questions or concerns about your booking,
                  please contact our support team.
                </p>
                <Button
                  onClick={() => router.push("/contact")}
                  variant="outline"
                  className="w-full"
                >
                  Contact Support
                </Button>
              </Card>
            </div>
          </div>
        </div>
      </main>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90dvh] overflow-y-auto p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Cancel Booking
            </h3>

            {previewLoading ? (
              <div className="flex items-center justify-center py-8">
                <div
                  className="animate-spin rounded-full h-8 w-8 border-b-2"
                  style={{ borderBottomColor: primaryColor }}
                ></div>
                <span className="ml-3 text-gray-600">
                  Calculating refund...
                </span>
              </div>
            ) : previewError ? (
              <div
                className="border rounded-lg p-4 mb-4"
                style={{
                  backgroundColor: `${primaryColor}10`,
                  borderColor: `${primaryColor}30`,
                }}
              >
                <p className="font-medium" style={{ color: primaryColor }}>
                  Error loading cancellation details
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: `${primaryColor}dd` }}
                >
                  {getApiErrorMessage(previewError, "Please try again later")}
                </p>
                <Button
                  onClick={() => setShowCancelModal(false)}
                  className="mt-4 w-full"
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            ) : cancellationPreview && !cancellationPreview.canCancel ? (
              <div
                className="border rounded-lg p-4 mb-4"
                style={{
                  backgroundColor: `${primaryColor}10`,
                  borderColor: `${primaryColor}30`,
                }}
              >
                <p className="font-medium" style={{ color: primaryColor }}>
                  Cannot cancel this booking
                </p>
                <p
                  className="text-sm mt-1"
                  style={{ color: `${primaryColor}dd` }}
                >
                  {cancellationPreview.reason}
                </p>
                <Button
                  onClick={() => setShowCancelModal(false)}
                  className="mt-4 w-full"
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            ) : cancellationPreview?.canCancel &&
              cancellationPreview.refundInfo ? (
              <>
                {/* Warning for LATE tier */}
                {cancellationPreview.refundInfo.tier === "LATE" && (
                  <div
                    className="border-2 rounded-lg p-4 mb-4"
                    style={{
                      backgroundColor: `${primaryColor}10`,
                      borderColor: primaryColor,
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <AlertCircle
                        className="w-6 h-6 flex-shrink-0 mt-0.5"
                        style={{ color: primaryColor }}
                      />
                      <div>
                        <p
                          className="font-bold text-lg mb-1"
                          style={{ color: primaryColor }}
                        >
                          Late Cancellation
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: `${primaryColor}dd` }}
                        >
                          You are cancelling within 12 hours of check-in. Your
                          security deposit will be returned, but there is{" "}
                          <strong>no room fee refund</strong>. Service and
                          cleaning fees are never refundable.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Refund Breakdown */}
                <div
                  className="border rounded-lg p-4 mb-4"
                  style={{
                    backgroundColor: `${primaryColor}10`,
                    borderColor: `${primaryColor}30`,
                  }}
                >
                  <h4
                    className="font-semibold mb-3"
                    style={{ color: primaryColor }}
                  >
                    Refund Breakdown
                  </h4>

                  <div className="space-y-3">
                    {/* Time Until Check-in */}
                    <div
                      className="flex justify-between items-center py-2 border-b"
                      style={{ borderColor: `${primaryColor}30` }}
                    >
                      <span
                        className="text-sm"
                        style={{ color: `${primaryColor}dd` }}
                      >
                        Time until check-in:
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: primaryColor }}
                      >
                        {cancellationPreview.refundInfo.hoursUntilCheckIn.toFixed(
                          1,
                        )}{" "}
                        hours
                      </span>
                    </div>

                    {/* Refund Tier */}
                    <div
                      className="flex justify-between items-center py-2 border-b"
                      style={{ borderColor: `${primaryColor}30` }}
                    >
                      <span
                        className="text-sm"
                        style={{ color: `${primaryColor}dd` }}
                      >
                        Cancellation Tier:
                      </span>
                      <span
                        className="font-medium"
                        style={{ color: primaryColor }}
                      >
                        {cancellationPreview.refundInfo.tier === "EARLY" &&
                          "Early (24+ hours) - 90% room fee"}
                        {cancellationPreview.refundInfo.tier === "MEDIUM" &&
                          "Medium (12-24 hours) - 70% room fee"}
                        {cancellationPreview.refundInfo.tier === "LATE" &&
                          "Late (0-12 hours) - 0% room fee"}
                        {cancellationPreview.refundInfo.tier === "NONE" &&
                          "No Refund"}
                      </span>
                    </div>

                    {/* Fee Breakdown */}
                    <div className="space-y-2 pt-2">
                      {/* Total Refund */}
                      <div className="flex justify-between items-center text-sm">
                        <span style={{ color: `${primaryColor}dd` }}>
                          Your Refund (
                          {Math.round(
                            cancellationPreview.refundInfo.breakdown
                              .customerPercent * 100,
                          )}
                          % of booking):
                        </span>
                        <span
                          className="font-medium text-lg"
                          style={{ color: primaryColor }}
                        >
                          {formatPrice(
                            cancellationPreview.refundInfo.customerRefund,
                            booking?.currency || "NGN",
                          )}
                        </span>
                      </div>

                      {/* Breakdown note */}
                      <div className="text-xs text-gray-600 mt-2">
                        <p>
                          Note: Cleaning and service fees are non-refundable.
                        </p>
                        <p>Security deposit is always 100% refunded.</p>
                      </div>
                    </div>

                    {/* Total Refund */}
                    <div
                      className="flex justify-between items-center py-3 -mx-4 px-4 rounded"
                      style={{ backgroundColor: `${primaryColor}18` }}
                    >
                      <span
                        className="text-base font-semibold"
                        style={{ color: primaryColor }}
                      >
                        Total You Will Receive:
                      </span>
                      <span
                        className="text-lg font-bold"
                        style={{ color: primaryColor }}
                      >
                        {formatPrice(
                          cancellationPreview.refundInfo.customerRefund,
                          booking?.currency || "NGN",
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 mb-4">
                  Please provide a reason for cancellation:
                </p>

                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent mb-4"
                  style={{ outlineColor: primaryColor }}
                  placeholder="Reason for cancellation..."
                />

                <div className="flex space-x-3">
                  <Button
                    onClick={handleCancelBooking}
                    variant="primary"
                    className="flex-1"
                    disabled={cancelMutation.isLoading || !cancelReason.trim()}
                  >
                    {cancelMutation.isLoading
                      ? "Processing..."
                      : "Confirm Cancellation"}
                  </Button>
                  <Button
                    onClick={() => setShowCancelModal(false)}
                    variant="outline"
                    className="flex-1"
                    disabled={cancelMutation.isLoading}
                  >
                    Close
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading cancellation details...</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Refund Request Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Request Refund
            </h3>
            <p className="text-gray-600 mb-4">
              Please specify the refund amount and provide a reason for your
              refund request. An admin will review your request.
            </p>

            {/* Refund calculation is now handled by backend */}

            <div className="mb-4">
              <label
                htmlFor="refundAmount"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Refund Amount (Maximum:{" "}
                {formatPrice(booking?.totalPrice || 0, booking?.currency)})
              </label>
              <input
                id="refundAmount"
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                max={booking?.totalPrice}
                min={0}
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ outlineColor: primaryColor }}
                placeholder="Enter amount..."
              />
            </div>

            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent mb-4"
              style={{ outlineColor: primaryColor }}
              placeholder="Reason for refund request..."
            />

            <div className="flex space-x-3">
              <Button
                onClick={handleRequestRefund}
                variant="primary"
                className="flex-1"
                disabled={refundMutation.isLoading}
              >
                {refundMutation.isLoading ? "Submitting..." : "Submit Request"}
              </Button>
              <Button
                onClick={() => setShowRefundModal(false)}
                variant="outline"
                className="flex-1"
                disabled={refundMutation.isLoading}
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Create Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FileWarning className="h-5 w-5 mr-2 text-orange-500" />
                  Report an Issue
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Describe the issue you&apos;re experiencing with this booking
                </p>
              </div>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Issue Type Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Issue Type <span style={{ color: primaryColor }}>*</span>
              </label>
              <select
                value={disputeIssueType}
                onChange={(e) =>
                  setDisputeIssueType(e.target.value as DisputeIssueType)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ outlineColor: primaryColor }}
              >
                <option value="PROPERTY_CONDITION">
                  Property Condition Issues
                </option>
                <option value="CLEANLINESS">Cleanliness Concerns</option>
                <option value="AMENITIES_MISSING">Missing Amenities</option>
                <option value="SAFETY_CONCERNS">Safety Concerns</option>
                <option value="BOOKING_ISSUES">Booking/Check-in Issues</option>
                <option value="PAYMENT_DISPUTE">Payment Dispute</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Subject */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject <span style={{ color: primaryColor }}>*</span>
              </label>
              <input
                type="text"
                value={disputeSubject}
                onChange={(e) => setDisputeSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ outlineColor: primaryColor }}
                placeholder="Brief summary of the issue..."
                maxLength={100}
              />
              <p className="text-xs text-gray-500 mt-1">
                {disputeSubject.length}/100 characters (minimum 5)
              </p>
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Description <span style={{ color: primaryColor }}>*</span>
              </label>
              <textarea
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
                rows={6}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                style={{ outlineColor: primaryColor }}
                placeholder="Provide a detailed explanation of the issue, including any relevant dates, times, and circumstances..."
                maxLength={2000}
              />
              <p className="text-xs text-gray-500 mt-1">
                {disputeDescription.length}/2000 characters (minimum 20)
              </p>
            </div>

            <div
              className="border rounded-lg p-4 mb-6"
              style={{
                backgroundColor: `${primaryColor}10`,
                borderColor: `${primaryColor}30`,
              }}
            >
              <div className="flex items-start">
                <AlertCircle
                  className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0"
                  style={{ color: primaryColor }}
                />
                <div className="text-sm" style={{ color: primaryColor }}>
                  <p className="font-medium mb-1">Dispute Process:</p>
                  <ul className="list-disc list-inside space-y-1" style={{ color: `${primaryColor}dd` }}>
                    <li>
                      The host will be notified and given 48 hours to respond
                    </li>
                    <li>
                      You can exchange up to 2 messages each to resolve the
                      issue
                    </li>
                    <li>
                      Our team will review if resolution isn&apos;t reached
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex space-x-3">
              <Button
                onClick={handleCreateDispute}
                variant="primary"
                className="flex-1"
                disabled={createDisputeMutation.isLoading}
              >
                {createDisputeMutation.isLoading
                  ? "Submitting..."
                  : "Submit Dispute"}
              </Button>
              <Button
                onClick={() => setShowDisputeModal(false)}
                variant="outline"
                className="flex-1"
                disabled={createDisputeMutation.isLoading}
              >
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* View/Respond to Dispute Modal */}
      {showViewDisputeModal && existingDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <FileWarning className="h-5 w-5 mr-2 text-orange-500" />
                  Dispute Details
                </h3>
                <div className="flex items-center gap-3 mt-2">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      existingDispute.status === "OPEN"
                        ? ""
                        : existingDispute.status === "PENDING_REALTOR_RESPONSE"
                          ? "bg-yellow-100 text-yellow-800"
                          : existingDispute.status === "PENDING_GUEST_RESPONSE"
                            ? "bg-purple-100 text-purple-800"
                            : existingDispute.status === "RESOLVED"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                    }`}
                    style={
                      existingDispute.status === "OPEN"
                        ? {
                            backgroundColor: `${primaryColor}15`,
                            color: primaryColor,
                          }
                        : undefined
                    }
                  >
                    {existingDispute.status.replace(/_/g, " ")}
                  </span>
                  <span className="text-sm text-gray-600">
                    Your responses: {existingDispute.guestArgumentCount}/2
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowViewDisputeModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Dispute Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Issue Type
                  </p>
                  <p className="text-sm text-gray-900 capitalize mt-1">
                    {existingDispute.issueType.replace(/_/g, " ").toLowerCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Created</p>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(existingDispute.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-600">Subject</p>
                <p className="text-sm text-gray-900 mt-1">
                  {existingDispute.subject}
                </p>
              </div>
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-600">Description</p>
                <p className="text-sm text-gray-900 mt-1">
                  {existingDispute.description}
                </p>
              </div>
            </div>

            {/* Conversation Thread */}
            {existingDispute.messages &&
              existingDispute.messages.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Conversation
                  </h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {existingDispute.messages.map(
                      (message: DisputeMessage, index: number) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg ${
                            message.senderType === "GUEST"
                              ? "border"
                              : "bg-gray-100 border border-gray-200"
                          }`}
                          style={
                            message.senderType === "GUEST"
                              ? {
                                  backgroundColor: `${primaryColor}10`,
                                  borderColor: `${primaryColor}30`,
                                }
                              : undefined
                          }
                        >
                          <div className="flex items-start justify-between mb-2">
                            <span
                              className={`text-xs font-medium ${
                                message.senderType === "GUEST"
                                  ? ""
                                  : "text-gray-700"
                              }`}
                              style={
                                message.senderType === "GUEST"
                                  ? { color: primaryColor }
                                  : undefined
                              }
                            >
                              {message.senderType === "GUEST" ? "You" : "Host"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {new Date(message.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-900">
                            {message.message}
                          </p>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

            {/* Response Form */}
            {canRespondToDispute() ? (
              <div className="border-t border-gray-200 pt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Response
                </label>
                <textarea
                  value={disputeResponse}
                  onChange={(e) => setDisputeResponse(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent mb-2"
                  style={{ outlineColor: primaryColor }}
                  placeholder="Type your response here..."
                  maxLength={1000}
                />
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs text-gray-500">
                    {disputeResponse.length}/1000 characters (minimum 10)
                  </p>
                  {existingDispute.guestArgumentCount >= 1 && (
                    <p className="text-xs text-orange-600 font-medium">
                      {2 - existingDispute.guestArgumentCount} response(s)
                      remaining
                    </p>
                  )}
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleRespondToDispute}
                    variant="primary"
                    className="flex-1"
                    disabled={respondDisputeMutation.isLoading}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {respondDisputeMutation.isLoading
                      ? "Sending..."
                      : "Send Response"}
                  </Button>
                  <Button
                    onClick={() => setShowViewDisputeModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-200 pt-6">
                {existingDispute.guestArgumentCount >= 2 ? (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-900 mb-1">
                          Maximum responses reached
                        </p>
                        <p className="text-sm text-amber-800">
                          You&apos;ve sent the maximum number of responses (2).
                          Our support team will review this dispute and contact
                          you if additional information is needed.
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="border rounded-lg p-4"
                    style={{
                      backgroundColor: `${primaryColor}10`,
                      borderColor: `${primaryColor}30`,
                    }}
                  >
                    <div className="flex items-start">
                      <Clock
                        className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0"
                        style={{ color: primaryColor }}
                      />
                      <div>
                        <p className="text-sm font-medium mb-1" style={{ color: primaryColor }}>
                          Waiting for host response
                        </p>
                        <p className="text-sm" style={{ color: `${primaryColor}dd` }}>
                          The host has been notified and will respond soon.
                          You&apos;ll receive a notification when they reply.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <Button
                  onClick={() => setShowViewDisputeModal(false)}
                  variant="outline"
                  className="w-full mt-4"
                >
                  Close
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      <Footer
        realtorName={realtorName}
        tagline={tagline}
        logo={logoUrl}
        description={description}
        primaryColor={primaryColor}
      />
    </div>
  );
}
