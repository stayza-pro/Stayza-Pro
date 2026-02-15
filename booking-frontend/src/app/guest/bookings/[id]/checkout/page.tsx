"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Users,
  CreditCard,
  Check,
  Shield,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button, Card, Input } from "@/components/ui";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Footer } from "@/components/guest/sections/Footer";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { bookingService, paymentService } from "@/services";

interface PaystackPopup {
  setup: (config: {
    key?: string;
    email: string;
    amount: number;
    currency: string;
    ref: string;
    metadata: Record<string, unknown>;
    callback: (response: { reference: string }) => void;
    onClose: () => void;
  }) => { openIframe: () => void };
}

interface CheckoutBooking {
  id: string;
  propertyId: string;
  guestId: string;
  totalGuests?: number;
  checkInDate: string | Date;
  checkOutDate: string | Date;
  status: string;
  roomFee: number;
  securityDeposit: number;
  cleaningFee: number;
  serviceFee: number;
  payment?: {
    status?: string;
    reference?: string;
    amount: number;
    currency?: string;
  };
  guest: { email: string };
  property: {
    name?: string;
    title?: string;
    city?: string;
    state?: string;
    images?: string[];
  };
}

export default function GuestBookingCheckoutPage() {
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

  const [booking, setBooking] = useState<CheckoutBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [guests, setGuests] = useState(1);
  const [authChecked, setAuthChecked] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useCurrentUser();

  const fetchBooking = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = (await bookingService.getBooking(
        bookingId,
      )) as unknown as CheckoutBooking;
      setBooking(data || null);
      if (data?.status !== "PENDING") {
        router.push(`/guest/booking/${bookingId}`);
      }
      if (typeof data?.totalGuests === "number") {
        setGuests(data.totalGuests);
      }
    } catch {
      toast.error("Failed to load checkout details");
      router.push("/guest/bookings");
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, router]);

  useEffect(() => {
    if (authChecked && isAuthenticated) {
      void fetchBooking();
    }
  }, [fetchBooking, authChecked, isAuthenticated]);

  useEffect(() => {
    if (!authLoading && (isAuthenticated || !authChecked)) {
      setAuthChecked(true);
    }
  }, [authLoading, isAuthenticated, authChecked]);

  useEffect(() => {
    if (authChecked && !authLoading && !isAuthenticated) {
      router.push(
        `/guest/login?returnTo=/guest/bookings/${bookingId}/checkout`,
      );
    }
  }, [authChecked, authLoading, isAuthenticated, router, bookingId]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const amount = booking?.payment?.amount || 0;
  const currency = booking?.payment?.currency || "NGN";

  const getPropertyImage = () => {
    const firstImage = booking?.property?.images?.[0];
    if (!firstImage) {
      return null;
    }
    if (typeof firstImage === "string") {
      return firstImage;
    }
    if (typeof firstImage === "object" && "url" in firstImage) {
      return (firstImage as { url?: string }).url || null;
    }
    return null;
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(value);

  const nights = useMemo(() => {
    if (!booking) {
      return 0;
    }
    const start = new Date(booking.checkInDate);
    const end = new Date(booking.checkOutDate);
    return Math.max(
      1,
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
    );
  }, [booking]);

  const handlePayment = async () => {
    if (!booking || !booking.payment) {
      toast.error("Payment information not available");
      return;
    }

    const paystack = (window as unknown as { PaystackPop?: PaystackPopup })
      .PaystackPop;
    if (!paystack) {
      toast.error("Payment system not loaded. Please refresh and try again.");
      return;
    }

    try {
      setIsProcessing(true);

      let reference = booking.payment.reference;
      if (!reference) {
        const initResponse = await paymentService.initializePaystackPayment({
          bookingId,
        });
        reference = initResponse.reference;
      }

      if (!reference) {
        throw new Error("Unable to initialize payment reference");
      }

      const handler = paystack.setup({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || "pk_test_xxxxx",
        email: booking.guest.email,
        amount: amount * 100,
        currency,
        ref: reference,
        metadata: {
          bookingId: booking.id,
          propertyId: booking.propertyId,
          guestId: booking.guestId,
        },
        callback: (response: { reference: string }) => {
          paymentService
            .verifyPaystackPayment({ reference: response.reference })
            .then((verifyResponse) => {
              if (verifyResponse.success) {
                toast.success("Booking payment successful!");
                router.push(`/guest/booking/${bookingId}`);
              } else {
                toast.error("Payment verification failed.");
                setIsProcessing(false);
              }
            })
            .catch(() => {
              toast.error("Payment verification failed.");
              setIsProcessing(false);
            });
        },
        onClose: () => {
          setIsProcessing(false);
          toast("Payment cancelled");
        },
      });

      handler.openIframe();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to process payment";
      toast.error(message);
      setIsProcessing(false);
    }
  };

  if (!authChecked || authLoading || isLoading) {
    return (
      <div
        className="min-h-screen bg-slate-50"
        style={{ colorScheme: "light" }}
      >
        <GuestHeader currentPage="bookings" />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-1/3" />
            <div className="h-60 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div
        className="min-h-screen bg-slate-50"
        style={{ colorScheme: "light" }}
      >
        <GuestHeader currentPage="bookings" />
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Booking not found
          </h2>
          <Link href="/guest/bookings">
            <Button>Back to bookings</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen pb-20 md:pb-8 bg-slate-50 flex flex-col"
      style={{ colorScheme: "light" }}
    >
      <GuestHeader currentPage="bookings" />

      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link href={`/guest/booking/${booking.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Booking
            </Button>
          </Link>
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Request to Book
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Your Trip
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-in
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      type="date"
                      className="pl-10"
                      value={
                        new Date(booking.checkInDate)
                          .toISOString()
                          .split("T")[0]
                      }
                      readOnly
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-out
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <Input
                      type="date"
                      className="pl-10"
                      value={
                        new Date(booking.checkOutDate)
                          .toISOString()
                          .split("T")[0]
                      }
                      readOnly
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Guests
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="number"
                    min={1}
                    className="pl-10"
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                  />
                </div>
              </div>
            </Card>

            <Card className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Payment Method
              </h2>
              <div className="space-y-3">
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <Input
                    type="text"
                    className="pl-10"
                    value="Paystack"
                    readOnly
                  />
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-gray-50 text-sm text-gray-700">
                  <Shield
                    className="w-4 h-4"
                    style={{ color: secondaryColor }}
                  />
                  Your payment information is secure and encrypted
                </div>
              </div>
            </Card>

            <Card className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-900">
                Cancellation Policy
              </h2>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex gap-2">
                  <Check
                    className="w-4 h-4 mt-0.5"
                    style={{ color: secondaryColor }}
                  />{" "}
                  Free cancellation eligibility is determined by booking policy.
                </li>
                <li className="flex gap-2">
                  <Check
                    className="w-4 h-4 mt-0.5"
                    style={{ color: secondaryColor }}
                  />{" "}
                  You can preview refund terms before cancelling from booking
                  details.
                </li>
                <li className="flex gap-2">
                  <Check
                    className="w-4 h-4 mt-0.5"
                    style={{ color: secondaryColor }}
                  />{" "}
                  Payment is only confirmed after successful verification.
                </li>
              </ul>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20 bg-white rounded-xl border border-gray-200 p-6 space-y-4">
              <h2 className="font-semibold text-lg text-gray-900">
                Booking Summary
              </h2>

              <div className="flex gap-3 pb-4 border-b border-gray-200">
                {getPropertyImage() ? (
                  <img
                    src={getPropertyImage() || ""}
                    alt={
                      booking.property.title ||
                      booking.property.name ||
                      "Property"
                    }
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                ) : null}
                <div className="flex-1">
                  <div className="font-semibold text-gray-900 line-clamp-1">
                    {booking.property.title ||
                      booking.property.name ||
                      "Property"}
                  </div>
                  <div className="text-sm text-gray-600">
                    {booking.property.city || ""}
                    {booking.property.state
                      ? `, ${booking.property.state}`
                      : ""}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Room fee</span>
                  <span>{formatCurrency(booking.roomFee || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cleaning fee</span>
                  <span>{formatCurrency(booking.cleaningFee || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Service fee</span>
                  <span>{formatCurrency(booking.serviceFee || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Security deposit</span>
                  <span>{formatCurrency(booking.securityDeposit || 0)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold text-gray-900">
                  <span>Total ({nights} nights)</span>
                  <span>{formatCurrency(amount)}</span>
                </div>
              </div>

              <Button
                className="w-full text-white"
                style={{ backgroundColor: primaryColor }}
                size="lg"
                onClick={handlePayment}
                loading={isProcessing}
              >
                Confirm Booking
              </Button>

              <p className="text-xs text-center text-gray-500">
                By confirming, you agree to the terms and conditions.
              </p>
            </Card>
          </div>
        </div>
      </main>

      <Footer
        realtorName={realtorName}
        tagline={tagline}
        logo={logoUrl}
        description={description}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        accentColor={accentColor}
      />
    </div>
  );
}
