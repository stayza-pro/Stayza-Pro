"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  CheckCircle,
  XCircle,
  Loader2,
  CreditCard,
  Lock,
  MapPin,
  Calendar,
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
import { useAuthStore } from "@/store/authStore";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function PaymentPage() {
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

  const [paymentStatus, setPaymentStatus] = useState<
    "loading" | "ready" | "processing" | "success" | "failed"
  >("loading");
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [isPaystackLoaded, setIsPaystackLoaded] = useState(false);

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
          `/guest/login?redirect=/booking/${propertyId}/payment?bookingId=${bookingId}`
        );
        return;
      }

      try {
        const bookingData = await bookingService.getBooking(bookingId);
        
        setBooking(bookingData);

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
      } catch (err: any) {
        
        setError(err.message || "Failed to load booking details");
        setPaymentStatus("failed");
      }
    };

    fetchBooking();
  }, [bookingId, user, storeUser, userLoading, router, propertyId]);

  const initiatePayment = () => {
    const currentUser = user || storeUser;

    if (!currentUser) {
      setError("Please log in to continue with payment");
      router.push(
        `/guest/login?redirect=/booking/${propertyId}/payment?bookingId=${bookingId}&paymentMethod=${paymentMethod}`
      );
      return;
    }

    if (!booking) {
      setError("Booking details not loaded. Please refresh the page.");
      return;
    }

    initiatePaystackPayment(currentUser);
  };

  const initiatePaystackPayment = async (currentUser: any) => {
    setPaymentStatus("processing");
    setError("");

    try {
      

      // Call backend API to initialize payment
      const response = await paymentService.initializePaystackPayment({
        bookingId: booking.id,
      });

      

      if (!response.reference) {
        throw new Error("No payment reference received from server");
      }

      // Check if Paystack script is loaded
      if (!window.PaystackPop) {
        throw new Error(
          "Paystack payment system not loaded. Please refresh the page."
        );
      }

      // Initialize Paystack Popup (inline payment)
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY,
        email: currentUser.email,
        amount: Math.round(booking.totalPrice * 100), // Amount in kobo
        currency: booking.currency || "NGN",
        ref: response.reference,
        metadata: {
          bookingId: booking.id,
          propertyId: booking.propertyId,
          userId: currentUser.id,
          custom_fields: [
            {
              display_name: "Booking ID",
              variable_name: "booking_id",
              value: booking.id,
            },
            {
              display_name: "Property",
              variable_name: "property_name",
              value: booking.property?.name || "N/A",
            },
          ],
        },
        onClose: function () {
          
          setPaymentStatus("ready");
          setError("Payment was cancelled. Please try again when ready.");
        },
        callback: function (paystackResponse: any) {
          
          
          

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

              

              // Verify payment with backend
              const verifyResponse = await paymentService.verifyPaystackPayment(
                {
                  reference: reference,
                }
              );

              

              if (verifyResponse.success) {
                setPaymentStatus("success");

                // Store payment metadata for success page
                if (verifyResponse.payment && verifyResponse.booking) {
                  localStorage.setItem(
                    "paystackPaymentMeta",
                    JSON.stringify({
                      paymentId: verifyResponse.payment.id,
                      bookingId: verifyResponse.booking.id,
                      reference: reference,
                    })
                  );
                }

                // Redirect directly to booking confirmation page
                const bookingId = verifyResponse.booking?.id || booking.id;
                setTimeout(() => {
                  router.push(`/booking/confirmation/${bookingId}`);
                }, 1500);
              } else {
                throw new Error(
                  verifyResponse.message || "Payment verification failed"
                );
              }
            } catch (err: any) {
              
              
              setPaymentStatus("failed");
              setError(
                err.response?.data?.message ||
                  err.message ||
                  "Payment completed but verification failed. Please contact support."
              );
            }
          };

          verifyAndRedirect();
        },
      });

      handler.openIframe();
    } catch (err: any) {
      
      setPaymentStatus("failed");
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to initialize payment. Please try again."
      );
    }
  };

  const formatPrice = (price: number, currency: string = "NGN") => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
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
    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      
      return null;
    }

    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const pricePerNight = booking.property?.pricePerNight || 0;
    const subtotal = Number(pricePerNight) * nights;

    // Get optional fees from property (set by realtor)
    const serviceFee = booking.property?.serviceFee
      ? Number(booking.property.serviceFee)
      : 0;
    const cleaningFee = booking.property?.cleaningFee
      ? Number(booking.property.cleaningFee)
      : 0;
    const securityDeposit = booking.property?.securityDeposit
      ? Number(booking.property.securityDeposit)
      : 0;

    const total =
      booking.totalPrice ||
      subtotal + serviceFee + cleaningFee + securityDeposit;

    return {
      pricePerNight: Number(pricePerNight),
      nights,
      subtotal,
      serviceFee,
      cleaningFee,
      securityDeposit,
      taxes: 0, // MVP: No separate tax
      total,
      currency: booking.currency || "NGN",
    };
  };

  const priceBreakdown = calculatePriceBreakdown();

  // Loading state
  if (userLoading || paymentStatus === "loading") {
    return (
      <div className="min-h-screen bg-gray-50">
        <GuestHeader
          currentPage="profile"
          searchPlaceholder="Search location..."
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white"
                style={{ backgroundColor: brandColor }}
              >
                1
              </div>
              <span className="ml-2 font-medium text-gray-900">
                Guest Details
              </span>
            </div>
            <div
              className="w-16 h-1"
              style={{ backgroundColor: brandColor }}
            ></div>
            <div className="flex items-center">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-white"
                style={{ backgroundColor: brandColor }}
              >
                2
              </div>
              <span className="ml-2 font-medium text-gray-900">Payment</span>
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-semibold bg-gray-200 text-gray-600">
                3
              </div>
              <span className="ml-2 font-medium text-gray-500">
                Confirmation
              </span>
            </div>
          </div>
        </div>

        {/* Success State */}
        {paymentStatus === "success" && (
          <div className="max-w-2xl mx-auto">
            <Card
              className="p-8 border border-gray-200 !bg-white shadow-sm"
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
                    className="text-3xl font-bold mb-2"
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
              className="p-8 border border-gray-200 !bg-white shadow-sm"
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
                    className="text-3xl font-bold mb-2"
                    style={{ color: secondaryColor }}
                  >
                    Complete Your Payment
                  </h1>
                  <p className="text-gray-600">
                    Secure payment for your booking
                  </p>
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
                    {booking.property?.images?.[0] && (
                      <div className="relative h-48 rounded-lg overflow-hidden">
                        <img
                          src={
                            typeof booking.property.images[0] === "string"
                              ? booking.property.images[0]
                              : booking.property.images[0].url
                          }
                          alt={booking.property.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.property?.title || "Property"}
                      </h3>
                      {booking.property?.address && (
                        <p className="text-gray-600 text-sm mt-1 flex items-start">
                          <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                          {booking.property.address}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div className="flex items-start">
                        <Calendar className="h-5 w-5 mr-2 mt-0.5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Check-in</p>
                          <p className="font-semibold text-gray-900">
                            {formatDate(booking.checkInDate)}
                          </p>
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
                          {formatPrice(booking.totalPrice, booking.currency)}
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
                                priceBreakdown.currency
                              )}{" "}
                              × {priceBreakdown.nights} nights
                            </span>
                            <span className="font-medium">
                              {formatPrice(
                                priceBreakdown.subtotal,
                                priceBreakdown.currency
                              )}
                            </span>
                          </div>

                          {priceBreakdown.cleaningFee > 0 && (
                            <div className="flex justify-between text-gray-700">
                              <span className="text-sm">Cleaning fee</span>
                              <span className="font-medium">
                                {formatPrice(
                                  priceBreakdown.cleaningFee,
                                  priceBreakdown.currency
                                )}
                              </span>
                            </div>
                          )}

                          {priceBreakdown.serviceFee > 0 && (
                            <div className="flex justify-between text-gray-700">
                              <span className="text-sm">Service fee (2%)</span>
                              <span className="font-medium">
                                {formatPrice(
                                  priceBreakdown.serviceFee,
                                  priceBreakdown.currency
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
                                  priceBreakdown.currency
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
                                  priceBreakdown.currency
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
                              priceBreakdown.currency
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
