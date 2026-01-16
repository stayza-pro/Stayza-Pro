"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CreditCard,
  Shield,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Card, Button } from "@/components/ui";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Footer } from "@/components/guest/sections/Footer";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { bookingService, paymentService } from "@/services";
import toast from "react-hot-toast";

declare global {
  interface Window {
    PaystackPop: any;
  }
}

export default function CheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const {
    brandColor: primaryColor,
    secondaryColor,
    accentColor,
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding();

  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchBookingDetails();
  }, [bookingId]);

  useEffect(() => {
    // Load Paystack script
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const fetchBookingDetails = async () => {
    try {
      setIsLoading(true);
      const response = await bookingService.getBooking(bookingId);

      if (response) {
        setBooking(response);

        // If payment is already completed, redirect to booking details
        if (
          response.payment?.status === "SETTLED" ||
          response.status !== "PENDING"
        ) {
          toast.success("Payment already completed!");
          router.push(`/guest/bookings/${bookingId}`);
        }
      }
    } catch (error: any) {
      
      toast.error("Failed to load booking details");
      router.push("/guest/bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!booking || !booking.payment) {
      toast.error("Payment information not found");
      return;
    }

    if (!window.PaystackPop) {
      toast.error("Payment system not loaded. Please refresh the page.");
      return;
    }

    try {
      setIsProcessing(true);

      let paymentReference = booking.payment.reference;

      // Only initialize payment if reference doesn't exist
      if (!paymentReference) {
        const response = await paymentService.initializePaystackPayment({
          bookingId: bookingId,
        });

        if (!response || !response.reference) {
          throw new Error("Failed to initialize payment");
        }

        paymentReference = response.reference;
      }

      // Open Paystack payment modal with existing or new reference
      const handler = window.PaystackPop.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_xxxxx",
        email: booking.guest.email,
        amount: booking.payment.amount * 100, // Convert to kobo
        currency: booking.payment.currency || "NGN",
        ref: paymentReference,
        metadata: {
          bookingId: booking.id,
          propertyId: booking.propertyId,
          guestId: booking.guestId,
        },
        callback: function (response: any) {
          
          toast.success("Payment successful! Verifying...");

          // Verify payment (handle async operation)
          paymentService
            .verifyPaystackPayment({
              reference: response.reference,
            })
            .then((verifyResponse) => {
              if (verifyResponse.success) {
                toast.success("Booking confirmed!");
                router.push(`/guest/bookings/${bookingId}`);
              } else {
                toast.error(
                  "Payment verification failed. Please contact support."
                );
              }
            })
            .catch((error) => {
              
              toast.error(
                "Payment verification failed. Please contact support."
              );
            });
        },
        onClose: function () {
          
          setIsProcessing(false);
          toast("Payment cancelled");
        },
      });

      handler.openIframe();
    } catch (error: any) {
      
      toast.error(error.message || "Failed to process payment");
      setIsProcessing(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = "NGN") => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GuestHeader currentPage="bookings" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Loading checkout...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50">
        <GuestHeader currentPage="bookings" />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Booking not found</p>
            <Button onClick={() => router.push("/guest/bookings")}>
              Back to Bookings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <GuestHeader currentPage="bookings" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Booking Summary */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Complete Your Payment
              </h2>

              {/* Property Info */}
              <div className="flex space-x-4 mb-6 pb-6 border-b border-gray-200">
                {booking.property.images?.[0] && (
                  <img
                    src={booking.property.images[0]}
                    alt={booking.property.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {booking.property.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {booking.property.city}, {booking.property.state}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    {formatDate(booking.checkInDate)} -{" "}
                    {formatDate(booking.checkOutDate)}
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">
                  Price Breakdown
                </h3>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Room Fee</span>
                  <span className="text-gray-900">
                    {formatCurrency(booking.roomFee, booking.payment?.currency)}
                  </span>
                </div>

                {booking.securityDeposit > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Security Deposit</span>
                    <span className="text-gray-900">
                      {formatCurrency(
                        booking.securityDeposit,
                        booking.payment?.currency
                      )}
                    </span>
                  </div>
                )}

                {booking.cleaningFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Cleaning Fee</span>
                    <span className="text-gray-900">
                      {formatCurrency(
                        booking.cleaningFee,
                        booking.payment?.currency
                      )}
                    </span>
                  </div>
                )}

                {booking.serviceFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Service Fee</span>
                    <span className="text-gray-900">
                      {formatCurrency(
                        booking.serviceFee,
                        booking.payment?.currency
                      )}
                    </span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">
                      Total Amount
                    </span>
                    <span
                      className="font-bold text-xl"
                      style={{ color: primaryColor }}
                    >
                      {formatCurrency(
                        booking.payment?.amount || booking.totalAmount,
                        booking.payment?.currency
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Reference */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Payment Reference</span>
                  <span className="font-mono text-gray-900">
                    {booking.payment?.reference || "N/A"}
                  </span>
                </div>
              </div>

              {/* Security Note */}
              <div className="flex items-start space-x-3 bg-blue-50 rounded-lg p-4">
                <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 mb-1">
                    Secure Payment
                  </p>
                  <p className="text-sm text-blue-700">
                    Your payment is processed securely through Paystack. We
                    never store your card details.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Payment Action */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <div className="text-center mb-6">
                <div
                  className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <CreditCard
                    className="h-8 w-8"
                    style={{ color: primaryColor }}
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ready to Complete?
                </h3>
                <p className="text-sm text-gray-600">
                  Click below to proceed with secure payment
                </p>
              </div>

              <Button
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full text-white font-semibold py-3"
                style={{ backgroundColor: primaryColor }}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Pay{" "}
                    {formatCurrency(
                      booking.payment?.amount || booking.totalAmount,
                      booking.payment?.currency
                    )}
                  </>
                )}
              </Button>

              <div className="mt-4 space-y-2">
                <div className="flex items-center text-xs text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Instant booking confirmation
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Free cancellation within 24 hours
                </div>
                <div className="flex items-center text-xs text-gray-600">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  24/7 customer support
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer
        realtorName={realtorName}
        logo={logoUrl}
        tagline={tagline || "Premium short-let properties"}
        description={description || "Experience luxury accommodations"}
        primaryColor={primaryColor}
      />
    </div>
  );
}
