"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Loader2,
  CreditCard,
  Lock,
  MapPin,
  Calendar,
  Clock,
  Users,
  AlertCircle,
  Check,
} from "lucide-react";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Footer } from "@/components/guest/sections";
import { Card } from "@/components/ui";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { bookingService } from "@/services/bookings";
import { paymentService } from "@/services/payments";
import { serviceUtils } from "@/services";
import { useAuthStore } from "@/store/authStore";
import type { SavedPaymentMethod } from "@/services/payments";
import type { Booking, User } from "@/types";

interface PaystackCallbackResponse {
  reference?: string;
  trxref?: string;
}

interface PaystackHandler {
  openIframe: () => void;
}

interface PaystackPop {
  setup: (config: {
    key?: string;
    email: string;
    amount: number;
    currency: string;
    ref: string;
    metadata: {
      bookingId: string;
      propertyId: string;
      userId: string;
      custom_fields: Array<{
        display_name: string;
        variable_name: string;
        value: string;
      }>;
    };
    onClose: () => void;
    callback: (paystackResponse: PaystackCallbackResponse) => void;
  }) => PaystackHandler;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  return serviceUtils.extractErrorMessage(error) || fallback;
};

const getBookingImageUrl = (booking: Booking | null): string | null => {
  if (!booking?.property?.images?.length) {
    return null;
  }

  const firstImage = booking.property.images[0] as
    | string
    | { url?: string }
    | undefined;

  if (typeof firstImage === "string") {
    return firstImage;
  }

  if (
    firstImage &&
    typeof firstImage === "object" &&
    typeof firstImage.url === "string"
  ) {
    return firstImage.url;
  }

  return null;
};

export default function PaymentPageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isLoading: userLoading } = useCurrentUser();
  const { user: storeUser } = useAuthStore();

  // Get realtor branding
  const {
    brandColor,
    secondaryColor,
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding();

  const propertyId = params.propertyId as string;
  const bookingId = searchParams.get("bookingId") || "";
  const paymentMethod = "paystack"; // Only Paystack supported
  const shouldAutoPay = searchParams.get("autopay") === "1";
  const rebookFromBookingId = searchParams.get("rebookFrom") || "";

  const [paymentStatus, setPaymentStatus] = useState<
    "loading" | "ready" | "processing" | "success" | "failed"
  >("loading");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string>("");
  const [isPaystackLoaded, setIsPaystackLoaded] = useState(false);
  const [savedMethods, setSavedMethods] = useState<SavedPaymentMethod[]>([]);
  const [selectedSavedMethodId, setSelectedSavedMethodId] = useState("");
  const [loadingSavedMethods, setLoadingSavedMethods] = useState(false);
  const hasAutoPayTriggeredRef = useRef(false);
  const hasTrackedPaymentViewRef = useRef(false);
  const paymentCallbackFired = useRef(false);

  // Load Paystack script
  useEffect(() => {
    const paystackScript = document.createElement("script");
    paystackScript.src = "https://js.paystack.co/v1/inline.js";
    paystackScript.async = true;
    paystackScript.id = "paystack-script";

    paystackScript.onload = () => {
      setIsPaystackLoaded(true);
    };

    paystackScript.onerror = () => {
      setError("Failed to load payment system. Please refresh the page.");
      setPaymentStatus("failed");
    };

    document.body.appendChild(paystackScript);

    return () => {
      if (document.body.contains(paystackScript)) {
        document.body.removeChild(paystackScript);
      }
    };
  }, []);

  // Fetch booking details
  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) return;

      // Use either hook user or store user (for persistence)
      const currentUser = user || storeUser;

      if (!currentUser && !userLoading) {
        router.push(
          `/guest/login?redirect=/booking/${propertyId}/payment?bookingId=${bookingId}`,
        );
        return;
      }

      try {
        const bookingData = await bookingService.getBooking(bookingId);

        setBooking(bookingData);

        if (!hasTrackedPaymentViewRef.current) {
          hasTrackedPaymentViewRef.current = true;
          void paymentService.trackCheckoutEvent({
            event: "PAYMENT_PAGE_VIEWED",
            bookingId: bookingData.id,
            propertyId,
            context: {
              rebookFrom: rebookFromBookingId || null,
              autoPay: shouldAutoPay,
            },
          });
        }

        // Check if already paid (HELD or later status means payment processed)
        if (
          bookingData.paymentStatus === "HELD" ||
          bookingData.paymentStatus === "PARTIALLY_RELEASED" ||
          bookingData.paymentStatus === "SETTLED"
        ) {
          setPaymentStatus("success");
          setTimeout(() => {
            router.push(`/booking/confirmation/${bookingId}`);
          }, 2000);
          return;
        }

        setPaymentStatus("ready");
      } catch (error: unknown) {
        setError(getErrorMessage(error, "Failed to load booking details"));
        setPaymentStatus("failed");
      }
    };

    fetchBooking();
  }, [
    bookingId,
    user,
    storeUser,
    userLoading,
    router,
    propertyId,
    rebookFromBookingId,
    shouldAutoPay,
  ]);

  useEffect(() => {
    const currentUser = user || storeUser;
    if (!booking || !currentUser) return;

    setLoadingSavedMethods(true);
    paymentService
      .getSavedMethods()
      .then((methods) => {
        setSavedMethods(methods);
        if (methods.length > 0) {
          setSelectedSavedMethodId(methods[0].methodId);
        } else {
          setSelectedSavedMethodId("");
        }
      })
      .catch(() => {
        setSavedMethods([]);
        setSelectedSavedMethodId("");
      })
      .finally(() => {
        setLoadingSavedMethods(false);
      });
  }, [booking, user, storeUser]);

  const initiatePayment = () => {
    const currentUser = user || storeUser;

    if (!currentUser) {
      setError("Please log in to continue with payment");
      router.push(
        `/guest/login?redirect=/booking/${propertyId}/payment?bookingId=${bookingId}&paymentMethod=${paymentMethod}`,
      );
      return;
    }

    if (!booking) {
      setError("Booking details not loaded. Please refresh the page.");
      return;
    }

    void initiatePaystackPayment(currentUser, booking);
  };

  const initiatePaystackPayment = async (
    currentUser: User,
    currentBooking: Booking,
  ) => {
    setPaymentStatus("processing");
    setError("");

    try {
      // Call backend API to initialize payment
      const response = await paymentService.initializePaystackPayment({
        bookingId: currentBooking.id,
        originUrl: typeof window !== "undefined" ? window.location.origin : "",
      });

      if (!response.reference) {
        throw new Error("No payment reference received from server");
      }

      // Check if Paystack script is loaded
      const paystackPop = (window as unknown as { PaystackPop?: PaystackPop })
        .PaystackPop;
      if (!paystackPop) {
        throw new Error(
          "Paystack payment system not loaded. Please refresh the page.",
        );
      }

      // Initialize Paystack Popup (inline payment)
      const handler = paystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: currentUser.email,
        amount: Math.round(Number(currentBooking.totalPrice) * 100), // Amount in kobo
        currency: currentBooking.currency || "NGN",
        ref: response.reference,
        metadata: {
          bookingId: currentBooking.id,
          propertyId: currentBooking.propertyId,
          userId: currentUser.id,
          custom_fields: [
            {
              display_name: "Booking ID",
              variable_name: "booking_id",
              value: currentBooking.id,
            },
            {
              display_name: "Property",
              variable_name: "property_name",
              value: currentBooking.property?.title || "N/A",
            },
          ],
        },
        onClose: function () {
          if (paymentCallbackFired.current) return;
          setPaymentStatus("ready");
          setError("Payment was cancelled. Please try again when ready.");
        },
        callback: function (paystackResponse: PaystackCallbackResponse) {
          paymentCallbackFired.current = true;
          // Handle verification in a separate async call
          const verifyAndRedirect = async () => {
            setPaymentStatus("processing");

            try {
              // Paystack popup callback returns { reference, trxref, trans, transaction }
              const reference =
                paystackResponse.reference || paystackResponse.trxref;

              if (!reference) {
                throw new Error("No reference found in Paystack response");
              }

              void paymentService.trackCheckoutEvent({
                event: "PAYSTACK_CALLBACK_SUCCESS",
                bookingId: currentBooking.id,
                propertyId: currentBooking.propertyId,
                context: {
                  reference,
                },
              });

              // Verify payment with backend
              const verifyResponse = await paymentService.verifyPaystackPayment(
                {
                  reference: reference,
                },
              );

              if (verifyResponse.success) {
                void paymentService.trackCheckoutEvent({
                  event: "PAYMENT_VERIFIED",
                  bookingId: verifyResponse.booking?.id || currentBooking.id,
                  propertyId: currentBooking.propertyId,
                  context: {
                    reference,
                  },
                });
                setPaymentStatus("success");

                // Store payment metadata for success page
                if (verifyResponse.payment && verifyResponse.booking) {
                  localStorage.setItem(
                    "paystackPaymentMeta",
                    JSON.stringify({
                      paymentId: verifyResponse.payment.id,
                      bookingId: verifyResponse.booking.id,
                      reference: reference,
                    }),
                  );
                }

                // Redirect directly to booking confirmation page
                const resolvedBookingId =
                  verifyResponse.booking?.id || currentBooking.id;
                setTimeout(() => {
                  router.push(`/booking/confirmation/${resolvedBookingId}`);
                }, 1500);
              } else {
                throw new Error(
                  verifyResponse.message || "Payment verification failed",
                );
              }
            } catch (error: unknown) {
              void paymentService.trackCheckoutEvent({
                event: "PAYMENT_VERIFY_FAILED",
                bookingId: currentBooking.id,
                propertyId: currentBooking.propertyId,
                context: {
                  message: getErrorMessage(error, "verify_paystack_failed"),
                },
              });
              setPaymentStatus("failed");
              setError(
                getErrorMessage(
                  error,
                  "Payment completed but verification failed. Please contact support.",
                ),
              );
            }
          };

          verifyAndRedirect();
        },
      });

      void paymentService.trackCheckoutEvent({
        event: "PAYSTACK_POPUP_OPENED",
        bookingId: currentBooking.id,
        propertyId: currentBooking.propertyId,
      });
      paymentCallbackFired.current = false;
      handler.openIframe();
    } catch (error: unknown) {
      setPaymentStatus("failed");
      setError(
        getErrorMessage(
          error,
          "Failed to initialize payment. Please try again.",
        ),
      );
    }
  };

  const handleSavedMethodPayment = useCallback(async () => {
    const currentBooking = booking;
    if (!currentBooking || !selectedSavedMethodId) {
      setError("No saved payment method selected.");
      return;
    }

    setPaymentStatus("processing");
    setError("");
    void paymentService.trackCheckoutEvent({
      event: "SAVED_METHOD_PAYMENT_ATTEMPT",
      bookingId: currentBooking.id,
      propertyId: currentBooking.propertyId,
    });

    try {
      const result = await paymentService.payWithSavedMethod({
        bookingId: currentBooking.id,
        methodId: selectedSavedMethodId,
      });

      if (!result.success) {
        throw new Error(result.message || "Saved method payment failed");
      }

      void paymentService.trackCheckoutEvent({
        event: "SAVED_METHOD_PAYMENT_SUCCESS",
        bookingId: result.booking?.id || currentBooking.id,
        propertyId: currentBooking.propertyId,
      });

      setPaymentStatus("success");

      if (result.payment && result.booking) {
        localStorage.setItem(
          "paystackPaymentMeta",
          JSON.stringify({
            paymentId: result.payment.id,
            bookingId: result.booking.id,
            reference: result.payment.reference,
          }),
        );
      }

      const paidBookingId = result.booking?.id || currentBooking.id;
      setTimeout(() => {
        router.push(`/booking/confirmation/${paidBookingId}`);
      }, 1200);
    } catch (error: unknown) {
      void paymentService.trackCheckoutEvent({
        event: "SAVED_METHOD_PAYMENT_FAILED",
        bookingId: currentBooking.id,
        propertyId: currentBooking.propertyId,
        context: {
          message: getErrorMessage(error, "saved_method_payment_failed"),
        },
      });
      setPaymentStatus("ready");
      setError(
        getErrorMessage(
          error,
          "Saved method payment failed. Please try Paystack checkout.",
        ),
      );
    }
  }, [booking, selectedSavedMethodId, router]);

  useEffect(() => {
    if (!shouldAutoPay || hasAutoPayTriggeredRef.current) {
      return;
    }
    if (paymentStatus !== "ready" || loadingSavedMethods) {
      return;
    }
    if (!booking) {
      return;
    }
    if (!selectedSavedMethodId) {
      setError(
        "No saved card found for one-click rebooking. Choose a payment option below.",
      );
      return;
    }

    hasAutoPayTriggeredRef.current = true;
    void handleSavedMethodPayment();
  }, [
    shouldAutoPay,
    paymentStatus,
    loadingSavedMethods,
    booking,
    selectedSavedMethodId,
    handleSavedMethodPayment,
  ]);

  const getSavedMethodLabel = (method: SavedPaymentMethod) => {
    const brand = method.brand || "Card";
    const last4 = method.last4 || "****";
    const expiry =
      method.expMonth && method.expYear
        ? ` (exp ${method.expMonth}/${method.expYear})`
        : "";
    return `${brand} **** ${last4}${expiry}`;
  };

  const formatPrice = (price: number, currency: string = "NGN") => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "Invalid Date";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date";
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate price breakdown from booking data
  const calculatePriceBreakdown = () => {
    if (!booking) return null;

    const checkInDate = new Date(booking.checkInDate);
    const checkOutDate = new Date(booking.checkOutDate);

    // Validate dates
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return null;
    }

    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const roomFee = Number(booking.roomFee ?? 0);
    const cleaningFee = Number(booking.cleaningFee ?? 0);
    const serviceFee = Number(booking.serviceFee ?? 0);
    const securityDeposit = Number(booking.securityDeposit ?? 0);

    const fallbackPricePerNight = booking.property?.pricePerNight
      ? Number(booking.property.pricePerNight)
      : 0;
    const pricePerNight =
      roomFee > 0 && nights > 0 ? roomFee / nights : fallbackPricePerNight;

    const subtotal = roomFee > 0 ? roomFee : Number(pricePerNight) * nights;

    const totalPrice = Number(booking.totalPrice || 0);
    const total = Number(
      (
        totalPrice || subtotal + serviceFee + cleaningFee + securityDeposit
      ).toFixed(2),
    );

    return {
      pricePerNight: Number(pricePerNight),
      nights,
      subtotal,
      serviceFee,
      cleaningFee,
      securityDeposit,
      serviceFeeBreakdown: {
        stayza: Number(booking.serviceFeeStayza || 0),
        processing: Number(booking.serviceFeeProcessing || 0),
      },
      taxes: 0, // MVP: No separate tax
      total,
      currency: booking.currency || "NGN",
    };
  };

  const priceBreakdown = calculatePriceBreakdown();
  const primaryImageUrl = getBookingImageUrl(booking);
  const sensitiveDetailsUnlocked = Boolean(booking?.sensitiveDetailsUnlocked);

  // Loading state
  if (userLoading || paymentStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-50">
        <GuestHeader
          currentPage="profile"
          searchPlaceholder="Search location..."
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
        <Footer
          realtorName={realtorName}
          tagline={tagline}
          logo={logoUrl}
          description={description}
          primaryColor={brandColor}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <GuestHeader
        currentPage="profile"
        searchPlaceholder="Search location..."
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <div className="flex items-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white"
                style={{ backgroundColor: brandColor }}
              >
                1
              </div>
              <span className="ml-1.5 sm:ml-2 text-sm sm:text-base font-medium text-gray-900">
                Guest Details
              </span>
            </div>
            <div
              className="hidden sm:block w-16 h-1"
              style={{ backgroundColor: brandColor }}
            ></div>
            <div className="flex items-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white"
                style={{ backgroundColor: brandColor }}
              >
                2
              </div>
              <span className="ml-1.5 sm:ml-2 text-sm sm:text-base font-medium text-gray-900">
                Payment
              </span>
            </div>
            <div className="hidden sm:block w-16 h-1 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold bg-gray-200 text-gray-600">
                3
              </div>
              <span className="ml-1.5 sm:ml-2 text-sm sm:text-base font-medium text-gray-500">
                Confirmation
              </span>
            </div>
          </div>
        </div>

        {/* Success State */}
        {paymentStatus === "success" && (
          <div className="max-w-2xl mx-auto">
            <Card
              className="p-4 sm:p-8 border border-gray-200 !bg-white shadow-sm"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
            >
              <div className="text-center">
                <div className="mb-6">
                  <div
                    className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{
                      backgroundColor: `${brandColor}15`,
                      border: `2px solid ${brandColor}`,
                    }}
                  >
                    <CheckCircle
                      className="h-12 w-12"
                      style={{ color: brandColor }}
                    />
                  </div>
                  <h2
                    className="text-2xl sm:text-3xl font-bold mb-2"
                    style={{ color: secondaryColor }}
                  >
                    Payment Successful!
                  </h2>
                  <p className="text-gray-600 text-lg">
                    Your booking has been confirmed
                  </p>
                </div>
                <div className="inline-flex items-center space-x-2 text-gray-600 bg-gray-50 px-4 py-2 rounded-full">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Redirecting to confirmation page...</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Failed State */}
        {paymentStatus === "failed" && (
          <div className="max-w-2xl mx-auto">
            <Card
              className="p-4 sm:p-8 border border-gray-200 !bg-white shadow-sm"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
            >
              <div className="text-center">
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 bg-red-50"
                  style={{ border: "2px solid #dc2626" }}
                >
                  <XCircle className="h-12 w-12 text-red-600" />
                </div>
                <h2
                  className="text-2xl font-bold mb-2"
                  style={{ color: secondaryColor }}
                >
                  Payment Failed
                </h2>
                <p className="text-gray-600 mb-6">
                  {error ||
                    "We couldn't process your payment. Please try again."}
                </p>
                <button
                  onClick={() => router.push(`/guest/bookings`)}
                  className="px-6 py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 shadow-md"
                  style={{ backgroundColor: brandColor }}
                >
                  Go to My Bookings
                </button>
              </div>
            </Card>
          </div>
        )}

        {/* Ready State - Main Payment UI */}
        {(paymentStatus === "ready" || paymentStatus === "processing") &&
          booking && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Payment Section */}
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <h1
                    className="text-2xl sm:text-3xl font-bold mb-2"
                    style={{ color: secondaryColor }}
                  >
                    Complete Your Payment
                  </h1>
                  <p className="text-gray-600">
                    Secure payment for your booking
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 text-emerald-800">
                      Verified Business
                    </span>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      Secure Payment
                    </span>
                  </div>
                </div>

                {/* Booking Summary Card */}
                <Card
                  className="p-6 border border-gray-200 !bg-white shadow-sm"
                  style={{ backgroundColor: "#ffffff", color: "#111827" }}
                >
                  <h2
                    className="text-xl font-semibold mb-4"
                    style={{ color: secondaryColor }}
                  >
                    Booking Summary
                  </h2>
                  <div className="space-y-4">
                    {primaryImageUrl && (
                      <div className="relative h-48 rounded-lg overflow-hidden">
                        <Image
                          src={primaryImageUrl}
                          alt={booking.property?.title || "Property image"}
                          fill
                          unoptimized
                          sizes="(max-width: 1024px) 100vw, 66vw"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.property?.title || "Property"}
                      </h3>
                      {sensitiveDetailsUnlocked &&
                        booking.property?.address && (
                          <p className="text-gray-600 text-sm mt-1 flex items-start">
                            <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                            {booking.property.address}
                          </p>
                        )}
                      {!sensitiveDetailsUnlocked && (
                        <p className="text-amber-700 text-sm mt-1 flex items-start">
                          <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                          Exact address unlocks after payment confirmation.
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div className="flex items-start">
                        <Calendar className="h-5 w-5 mr-2 mt-0.5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Check-in</p>
                          <p className="font-semibold text-gray-900">
                            {formatDate(booking.checkInDate)}
                          </p>
                          {booking.property?.checkInTime && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              From {booking.property.checkInTime}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start">
                        <Calendar className="h-5 w-5 mr-2 mt-0.5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Check-out
                          </p>
                          <p className="font-semibold text-gray-900">
                            {formatDate(booking.checkOutDate)}
                          </p>
                          {booking.property?.checkOutTime && (
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              By {booking.property.checkOutTime}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <div className="flex items-start">
                        <Users className="h-5 w-5 mr-2 mt-0.5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Guests</p>
                          <p className="font-semibold text-gray-900">
                            {booking.totalGuests}{" "}
                            {booking.totalGuests === 1 ? "Guest" : "Guests"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Payment Method Card */}
                <Card
                  className="p-6 border border-gray-200 !bg-white shadow-sm"
                  style={{ backgroundColor: "#ffffff", color: "#111827" }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2
                      className="text-xl font-semibold"
                      style={{ color: secondaryColor }}
                    >
                      Payment Method
                    </h2>
                    <div className="flex items-center text-green-600">
                      <Lock className="h-4 w-4 mr-1" />
                      <span className="text-sm font-medium">
                        Secure Payment
                      </span>
                    </div>
                  </div>

                  <div
                    className="border-2 rounded-xl p-6"
                    style={{
                      borderColor: `${brandColor}30`,
                      backgroundColor: `${brandColor}05`,
                    }}
                  >
                    {loadingSavedMethods ? (
                      <div className="mb-4 text-sm text-gray-600">
                        Loading saved payment methods...
                      </div>
                    ) : savedMethods.length > 0 ? (
                      <div
                        className="mb-5 p-4 rounded-lg border"
                        style={{
                          borderColor: `${brandColor}30`,
                          backgroundColor: "#ffffff",
                        }}
                      >
                        <p
                          className="text-sm font-semibold mb-2"
                          style={{ color: secondaryColor }}
                        >
                          Express Checkout
                        </p>
                        <p className="text-xs text-gray-600 mb-3">
                          Pay instantly with your saved card token.
                        </p>
                        <select
                          value={selectedSavedMethodId}
                          onChange={(e) =>
                            setSelectedSavedMethodId(e.target.value)
                          }
                          className="w-full mb-3 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700"
                        >
                          {savedMethods.map((method) => (
                            <option
                              key={method.methodId}
                              value={method.methodId}
                            >
                              {getSavedMethodLabel(method)}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleSavedMethodPayment}
                          disabled={
                            paymentStatus === "processing" ||
                            !selectedSavedMethodId
                          }
                          className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-md hover:shadow-lg"
                          style={{ backgroundColor: secondaryColor }}
                        >
                          {paymentStatus === "processing" ? (
                            <>
                              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Lock className="h-5 w-5 mr-2" />
                              Pay with Saved Card
                            </>
                          )}
                        </button>
                      </div>
                    ) : null}

                    <div className="flex items-center mb-4">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center mr-4"
                        style={{ backgroundColor: "white" }}
                      >
                        <CreditCard
                          className="h-6 w-6"
                          style={{ color: brandColor }}
                        />
                      </div>
                      <div>
                        <h3
                          className="font-semibold text-lg"
                          style={{ color: secondaryColor }}
                        >
                          Paystack
                        </h3>
                        <p className="text-sm text-gray-600">
                          Secure payment gateway
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm text-gray-700 mb-4">
                      <div className="flex items-center">
                        <Check
                          className="h-4 w-4 mr-2"
                          style={{ color: brandColor }}
                        />
                        Pay with card, bank transfer, or USSD
                      </div>
                      <div className="flex items-center">
                        <Check
                          className="h-4 w-4 mr-2"
                          style={{ color: brandColor }}
                        />
                        256-bit SSL encryption
                      </div>
                      <div className="flex items-center">
                        <Check
                          className="h-4 w-4 mr-2"
                          style={{ color: brandColor }}
                        />
                        PCI DSS compliant
                      </div>
                    </div>

                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                        <div className="flex items-start">
                          <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-red-800">{error}</p>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={initiatePayment}
                      disabled={
                        paymentStatus === "processing" || !isPaystackLoaded
                      }
                      className="w-full py-4 rounded-xl font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shadow-lg hover:shadow-xl"
                      style={{
                        backgroundColor: brandColor,
                      }}
                    >
                      {paymentStatus === "processing" ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="h-5 w-5 mr-2" />
                          Pay{" "}
                          {formatPrice(
                            Number(booking.totalPrice),
                            booking.currency,
                          )}
                        </>
                      )}
                    </button>

                    <p className="text-xs text-center text-gray-500 mt-3">
                      By proceeding, you agree to our terms and conditions
                    </p>
                  </div>
                </Card>
              </div>

              {/* Price Summary Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-24">
                  <Card
                    className="p-6 border border-gray-200 !bg-white shadow-sm"
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#111827",
                      borderTop: `4px solid ${brandColor}`,
                    }}
                  >
                    <h2
                      className="text-lg font-semibold mb-4"
                      style={{ color: secondaryColor }}
                    >
                      Price Details
                    </h2>

                    {priceBreakdown && (
                      <>
                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between text-gray-700">
                            <span className="text-sm">
                              {formatPrice(
                                priceBreakdown.pricePerNight,
                                priceBreakdown.currency,
                              )}{" "}
                              x {priceBreakdown.nights} nights
                            </span>
                            <span className="font-medium">
                              {formatPrice(
                                priceBreakdown.subtotal,
                                priceBreakdown.currency,
                              )}
                            </span>
                          </div>

                          {priceBreakdown.cleaningFee > 0 && (
                            <div className="flex justify-between text-gray-700">
                              <span className="text-sm">Cleaning fee</span>
                              <span className="font-medium">
                                {formatPrice(
                                  priceBreakdown.cleaningFee,
                                  priceBreakdown.currency,
                                )}
                              </span>
                            </div>
                          )}

                          {priceBreakdown.serviceFee > 0 && (
                            <div className="flex justify-between text-gray-700">
                              <div>
                                <span className="text-sm">Service fee</span>
                                {(priceBreakdown.serviceFeeBreakdown.stayza >
                                  0 ||
                                  priceBreakdown.serviceFeeBreakdown
                                    .processing > 0) && (
                                  <p className="text-xs text-gray-500">
                                    Includes Stayza + processing fee
                                  </p>
                                )}
                              </div>
                              <span className="font-medium">
                                {formatPrice(
                                  priceBreakdown.serviceFee,
                                  priceBreakdown.currency,
                                )}
                              </span>
                            </div>
                          )}

                          {priceBreakdown.securityDeposit > 0 && (
                            <div className="flex justify-between text-gray-700">
                              <span className="text-sm">
                                Security deposit (refundable)
                              </span>
                              <span className="font-medium">
                                {formatPrice(
                                  priceBreakdown.securityDeposit,
                                  priceBreakdown.currency,
                                )}
                              </span>
                            </div>
                          )}

                          {priceBreakdown.taxes > 0 && (
                            <div className="flex justify-between text-gray-700">
                              <span className="text-sm">Taxes</span>
                              <span className="font-medium">
                                {formatPrice(
                                  priceBreakdown.taxes,
                                  priceBreakdown.currency,
                                )}
                              </span>
                            </div>
                          )}
                        </div>

                        <div
                          className="pt-4 border-t-2 flex justify-between items-center"
                          style={{ borderColor: `${brandColor}30` }}
                        >
                          <span
                            className="text-lg font-bold"
                            style={{ color: secondaryColor }}
                          >
                            Total
                          </span>
                          <span
                            className="text-xl font-bold"
                            style={{ color: brandColor }}
                          >
                            {formatPrice(
                              priceBreakdown.total,
                              priceBreakdown.currency,
                            )}
                          </span>
                        </div>
                      </>
                    )}

                    <div
                      className="mt-6 p-4 rounded-lg"
                      style={{ backgroundColor: `${brandColor}10` }}
                    >
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">
                          Cancellation policy:
                        </span>{" "}
                        Free cancellation up to 24 hours before check-in.
                      </p>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          )}
      </main>

      <Footer
        realtorName={realtorName}
        tagline={tagline}
        logo={logoUrl}
        description={description}
        primaryColor={brandColor}
      />
    </div>
  );
}
