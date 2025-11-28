"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Footer } from "@/components/guest/sections";
import { Card, Button } from "@/components/ui";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { bookingService } from "@/services/bookings";

declare global {
  interface Window {
    FlutterwaveCheckout: any;
  }
}

export default function PaymentPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useCurrentUser();

  // Get realtor branding
  const { brandColor, realtorName, logoUrl, tagline, description } =
    useRealtorBranding();

  const propertyId = params.propertyId as string;
  const bookingId = searchParams.get("bookingId") || "";

  const [paymentStatus, setPaymentStatus] = useState<
    "loading" | "processing" | "success" | "failed"
  >("loading");
  const [booking, setBooking] = useState<any>(null);
  const [error, setError] = useState<string>("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push(
        `/guest/login?redirect=/booking/${propertyId}/payment?bookingId=${bookingId}`
      );
    }
  }, [user, router, propertyId, bookingId]);

  // Load Flutterwave script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Fetch booking and initiate payment
  useEffect(() => {
    const fetchBookingAndPay = async () => {
      if (!bookingId || !user) return;

      try {
        const bookingData = await bookingService.getBooking(bookingId);
        setBooking(bookingData);

        // Check if already paid
        if (bookingData.paymentStatus === "COMPLETED") {
          setPaymentStatus("success");
          setTimeout(() => {
            router.push(`/booking/confirmation/${bookingId}`);
          }, 2000);
          return;
        }

        // Initiate payment
        initiatePayment(bookingData);
      } catch (err: any) {
        console.error("Error fetching booking:", err);
        setError(err.message || "Failed to load booking details");
        setPaymentStatus("failed");
      }
    };

    fetchBookingAndPay();
  }, [bookingId, user]);

  const initiatePayment = (bookingData: any) => {
    setPaymentStatus("processing");

    const modal = window.FlutterwaveCheckout({
      public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY || "",
      tx_ref:
        bookingData.payment?.reference ||
        `booking-${bookingData.id}-${Date.now()}`,
      amount: bookingData.totalPrice,
      currency: bookingData.currency || "NGN",
      payment_options: "card,banktransfer,ussd",
      customer: {
        email: user?.email || "",
        phone_number: user?.phone || "",
        name: `${user?.firstName || ""} ${user?.lastName || ""}`,
      },
      meta: {
        bookingId: bookingData.id,
        propertyId: bookingData.propertyId,
        guestId: bookingData.guestId,
      },
      customizations: {
        title: "Stayza Booking Payment",
        description: `Payment for ${
          bookingData.property?.title || "property booking"
        }`,
        logo: "https://your-logo-url.com/logo.png",
      },
      callback: (data: any) => {
        console.log("Payment callback:", data);

        if (data.status === "successful") {
          // Payment successful
          handlePaymentSuccess(bookingData.id);
        } else {
          // Payment failed or cancelled
          setPaymentStatus("failed");
          setError("Payment was not completed. Please try again.");
        }

        modal.close();
      },
      onclose: () => {
        console.log("Payment modal closed");
        // Check if payment was successful
        if (paymentStatus !== "success") {
          setPaymentStatus("failed");
          setError("Payment was cancelled. Please try again.");
        }
      },
    });
  };

  const handlePaymentSuccess = async (bookingId: string) => {
    try {
      setPaymentStatus("success");

      // Wait a moment before redirecting
      setTimeout(() => {
        router.push(`/booking/confirmation/${bookingId}`);
      }, 2000);
    } catch (err: any) {
      console.error("Error handling payment success:", err);
      setError(
        "Payment successful but failed to update booking. Please contact support."
      );
      setPaymentStatus("failed");
    }
  };

  const handleRetryPayment = () => {
    if (booking) {
      setError("");
      initiatePayment(booking);
    }
  };

  const handleCancel = () => {
    router.push(`/guest/bookings`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <GuestHeader
        currentPage="profile"
        searchPlaceholder="Search location..."
      />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Card className="p-8">
          <div className="text-center">
            {paymentStatus === "loading" && (
              <>
                <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Loading Payment...
                </h2>
                <p className="text-gray-600">
                  Please wait while we prepare your payment
                </p>
              </>
            )}

            {paymentStatus === "processing" && (
              <>
                <Loader2 className="h-16 w-16 text-blue-600 animate-spin mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Processing Payment
                </h2>
                <p className="text-gray-600 mb-6">
                  Please complete the payment in the Flutterwave window
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 inline-flex items-start text-left max-w-md">
                  <AlertCircle className="h-5 w-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-blue-900">
                    <p className="font-semibold mb-1">
                      Don't close this window
                    </p>
                    <p>
                      Complete your payment in the popup window. If you don't
                      see the popup, please check if it was blocked by your
                      browser.
                    </p>
                  </div>
                </div>
              </>
            )}

            {paymentStatus === "success" && (
              <>
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Payment Successful!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your booking has been confirmed. Redirecting to confirmation
                  page...
                </p>
                <div className="inline-flex items-center space-x-2 text-blue-600">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Redirecting...</span>
                </div>
              </>
            )}

            {paymentStatus === "failed" && (
              <>
                <XCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Payment Failed
                </h2>
                <p className="text-gray-600 mb-6">
                  {error ||
                    "We couldn't process your payment. Please try again."}
                </p>

                {booking && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg text-left">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Booking Details
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">Property:</span>{" "}
                        {booking.property?.title}
                      </p>
                      <p>
                        <span className="font-medium">Check-in:</span>{" "}
                        {new Date(booking.checkIn).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium">Check-out:</span>{" "}
                        {new Date(booking.checkOut).toLocaleDateString()}
                      </p>
                      <p>
                        <span className="font-medium">Total:</span>{" "}
                        {new Intl.NumberFormat("en-NG", {
                          style: "currency",
                          currency: booking.currency || "NGN",
                        }).format(booking.totalPrice)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button onClick={handleRetryPayment} variant="primary">
                    Retry Payment
                  </Button>
                  <Button onClick={handleCancel} variant="outline">
                    Cancel Booking
                  </Button>
                </div>

                <div className="mt-6 text-sm text-gray-500">
                  <p>Need help? Contact our support team at</p>
                  <a
                    href="mailto:support@stayza.com"
                    className="text-blue-600 hover:underline"
                  >
                    support@stayza.com
                  </a>
                </div>
              </>
            )}
          </div>
        </Card>

        {/* Payment Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            🔒 Secured by Flutterwave. Your payment information is encrypted and
            secure.
          </p>
        </div>
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
