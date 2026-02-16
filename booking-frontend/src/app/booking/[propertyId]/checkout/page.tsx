"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Users,
  Lock,
  CheckCircle2,
  Info,
} from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { toast } from "react-hot-toast";
import { Button, Card, Input, Select } from "@/components/ui";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { useProperty } from "@/hooks/useProperties";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { bookingService, paymentService } from "@/services";

interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialRequests: string;
}

interface PaystackPopup {
  setup: (config: {
    key?: string;
    email: string;
    amount: number;
    currency: string;
    ref: string;
    metadata: Record<string, unknown>;
    callback: (response: { reference?: string; trxref?: string }) => void;
    onClose: () => void;
  }) => { openIframe: () => void };
}

export default function BookingCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = params.propertyId as string;

  const { user, isLoading: userLoading } = useCurrentUser();
  const { data: property, isLoading: propertyLoading } =
    useProperty(propertyId);
  const {
    brandColor: primaryColor,
    secondaryColor,
    accentColor,
  } = useRealtorBranding();

  const colors = {
    surfaceBase: "#f8fafc",
    surfaceElevated: "#ffffff",
    primaryPale: "#e8f1f8",
    secondarySurface: "#f5f9f5",
    neutralLightest: "#f9fafb",
    neutralLight: "#e5e7eb",
    neutral: "#6b7280",
    neutralDark: "#4b5563",
    neutralDarkest: "#111827",
  };

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdBooking, setCreatedBooking] = useState<{
    id: string;
    totalPrice: number;
    currency: string;
  } | null>(null);

  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "");
  const [guests, setGuests] = useState<number>(
    Number(searchParams.get("guests") || "1") || 1,
  );

  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: "",
    specialRequests: "",
  });

  const [bookingCalculation, setBookingCalculation] = useState<{
    subtotal: number;
    serviceFee: number;
    cleaningFee: number;
    taxes: number;
    total: number;
    currency: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      setGuestInfo((prev) => ({
        ...prev,
        firstName: user.firstName || prev.firstName,
        lastName: user.lastName || prev.lastName,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!userLoading && !user) {
      const returnTo = `/booking/${propertyId}/checkout?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&guests=${guests}`;
      router.push(`/guest/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
  }, [userLoading, user, router, propertyId, checkIn, checkOut, guests]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  useEffect(() => {
    const fetchBookingCalculation = async () => {
      if (!propertyId || !checkIn || !checkOut) {
        setBookingCalculation(null);
        return;
      }

      try {
        const calculation = await bookingService.calculateBookingTotal(
          propertyId,
          new Date(checkIn),
          new Date(checkOut),
          guests,
        );
        setBookingCalculation(calculation);
      } catch {
        setBookingCalculation(null);
      }
    };

    void fetchBookingCalculation();
  }, [propertyId, checkIn, checkOut, guests]);

  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
    return differenceInDays(end, start);
  }, [checkIn, checkOut]);

  const minNights = Math.max(
    1,
    Number((property as unknown as { minNights?: number })?.minNights || 1),
  );
  const maxGuests = Math.max(1, Number(property?.maxGuests || 1));
  const isValidStay = nights >= minNights;

  const weeklyDiscount = Number(
    (property as unknown as { weeklyDiscount?: number })?.weeklyDiscount || 0,
  );
  const monthlyDiscount = Number(
    (property as unknown as { monthlyDiscount?: number })?.monthlyDiscount || 0,
  );

  let discount = 0;
  if (nights >= 28 && monthlyDiscount > 0) {
    discount = monthlyDiscount;
  } else if (nights >= 7 && weeklyDiscount > 0) {
    discount = weeklyDiscount;
  }

  const fallbackCurrency = property?.currency || "NGN";
  const baseSubtotal = (property?.pricePerNight || 0) * Math.max(0, nights);
  const discountAmount = (baseSubtotal * discount) / 100;
  const fallbackCleaningFee = Number(
    (property as unknown as { cleaningFee?: number })?.cleaningFee || 0,
  );
  const fallbackServiceFee = Number(
    (property as unknown as { serviceFee?: number })?.serviceFee || 0,
  );
  const fallbackPreTax =
    baseSubtotal - discountAmount + fallbackCleaningFee + fallbackServiceFee;
  const fallbackTaxes = fallbackPreTax * 0.1;
  const fallbackTotal = fallbackPreTax + fallbackTaxes;

  const currency = bookingCalculation?.currency || fallbackCurrency;
  const subtotal = bookingCalculation?.subtotal ?? baseSubtotal;
  const cleaningFee = bookingCalculation?.cleaningFee ?? fallbackCleaningFee;
  const serviceFee = bookingCalculation?.serviceFee ?? fallbackServiceFee;
  const taxes = bookingCalculation?.taxes ?? fallbackTaxes;
  const total = bookingCalculation?.total ?? fallbackTotal;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(price);

  const canProceed = () => {
    if (step === 1) {
      return Boolean(checkIn && checkOut) && isValidStay && guests <= maxGuests;
    }

    if (step === 2) {
      return Boolean(
        guestInfo.firstName.trim() &&
        guestInfo.lastName.trim() &&
        guestInfo.email.trim() &&
        guestInfo.phone.trim(),
      );
    }

    if (step === 3) {
      return true;
    }

    return false;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (step < 3) {
      setStep((prev) => prev + 1);
      return;
    }

    if (!canProceed()) {
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      let bookingId = createdBooking?.id;
      let bookingAmount = createdBooking?.totalPrice ?? total;
      let bookingCurrency = createdBooking?.currency ?? currency;

      if (!bookingId) {
        const booking = await bookingService.createBooking({
          propertyId,
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
          guests,
          specialRequests: guestInfo.specialRequests,
        });

        bookingId = booking.id;
        bookingAmount = booking.totalPrice || bookingAmount;
        bookingCurrency = booking.currency || bookingCurrency;

        setCreatedBooking({
          id: booking.id,
          totalPrice: booking.totalPrice || bookingAmount,
          currency: booking.currency || bookingCurrency,
        });
      }

      const paystack = (window as unknown as { PaystackPop?: PaystackPopup })
        .PaystackPop;
      if (!paystack) {
        throw new Error(
          "Payment system not loaded. Please refresh and try again.",
        );
      }

      const initResponse = await paymentService.initializePaystackPayment({
        bookingId,
      });

      if (!initResponse.reference) {
        throw new Error("Unable to initialize Paystack payment reference.");
      }

      const paystackKey =
        process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
        process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC;

      const currentUser = user;
      if (!currentUser) {
        throw new Error("Please log in again to continue with payment.");
      }

      if (!paystackKey) {
        throw new Error("Paystack public key is missing.");
      }

      const handler = paystack.setup({
        key: paystackKey,
        email: guestInfo.email.trim() || currentUser.email,
        amount: Math.round(bookingAmount * 100),
        currency: bookingCurrency || "NGN",
        ref: initResponse.reference,
        metadata: {
          bookingId,
          propertyId,
          guestId: currentUser.id,
          guestName: `${guestInfo.firstName} ${guestInfo.lastName}`.trim(),
          guestPhone: guestInfo.phone,
        },
        callback: (response: { reference?: string; trxref?: string }) => {
          const reference = response.reference || response.trxref;
          if (!reference) {
            toast.error("Payment reference missing. Please contact support.");
            return;
          }

          paymentService
            .verifyPaystackPayment({ reference })
            .then((verification) => {
              if (verification.success) {
                toast.success("Booking payment successful!");
                router.push(`/guest/bookings/${bookingId}`);
                return;
              }
              toast.error(
                verification.message || "Payment verification failed.",
              );
            })
            .catch(() => {
              toast.error("Payment verification failed.");
            });
        },
        onClose: () => {
          toast("Payment cancelled");
        },
      });

      handler.openIframe();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to create booking. Please try again.";
      setErrors({ submit: message });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (userLoading || propertyLoading || !property) {
    return (
      <div
        className="min-h-screen"
        style={{ backgroundColor: colors.surfaceBase }}
      >
        <GuestHeader
          currentPage="browse"
          searchPlaceholder="Search location..."
        />
        <div className="max-w-[1200px] mx-auto px-6 py-12 animate-pulse space-y-6">
          <div className="h-10 w-56 bg-gray-200 rounded" />
          <div className="h-80 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const propertyImage =
    property.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1568115286680-d203e08a8be6?w=400";

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: colors.surfaceBase }}
    >
      <GuestHeader
        currentPage="browse"
        searchPlaceholder="Search location..."
      />

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <Link
          href={`/guest/browse/${propertyId}`}
          className="inline-flex items-center gap-2 mb-8 hover:underline"
          style={{ color: colors.neutralDark }}
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Property
        </Link>

        <div className="mb-12">
          <h1
            className="font-semibold mb-4"
            style={{ fontSize: "40px", color: colors.neutralDarkest }}
          >
            Complete Your Booking
          </h1>

          <div className="flex items-center gap-4 mb-4">
            {[1, 2, 3].map((currentStep) => (
              <div key={currentStep} className="flex-1 flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all"
                  style={{
                    backgroundColor:
                      step >= currentStep ? primaryColor : colors.neutralLight,
                    color: step >= currentStep ? "#ffffff" : colors.neutral,
                  }}
                >
                  {step > currentStep ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    currentStep
                  )}
                </div>
                {currentStep < 3 && (
                  <div
                    className="flex-1 h-1 rounded-full"
                    style={{
                      backgroundColor:
                        step > currentStep ? primaryColor : colors.neutralLight,
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-4 text-sm">
            <span style={{ color: step === 1 ? primaryColor : colors.neutral }}>
              Dates & Guests
            </span>
            <span style={{ color: step === 2 ? primaryColor : colors.neutral }}>
              Your Information
            </span>
            <span style={{ color: step === 3 ? primaryColor : colors.neutral }}>
              Payment
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <div
                  className="p-8 rounded-2xl border space-y-8"
                  style={{
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.neutralLight,
                  }}
                >
                  <div>
                    <h2
                      className="font-semibold mb-2"
                      style={{ fontSize: "24px", color: colors.neutralDarkest }}
                    >
                      Select Your Dates
                    </h2>
                    <p style={{ color: colors.neutralDark }}>
                      Minimum stay: {minNights} nights
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label style={{ color: colors.neutralDarkest }}>
                        Check-in Date
                      </label>
                      <div className="relative">
                        <CalendarIcon
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                          style={{ color: colors.neutral }}
                        />
                        <Input
                          type="date"
                          value={checkIn}
                          min={new Date().toISOString().split("T")[0]}
                          onChange={(e) => setCheckIn(e.target.value)}
                          className="pl-12 h-14 rounded-xl"
                          style={{
                            backgroundColor: colors.neutralLightest,
                            borderColor: colors.neutralLight,
                            color: colors.neutralDarkest,
                          }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label style={{ color: colors.neutralDarkest }}>
                        Check-out Date
                      </label>
                      <div className="relative">
                        <CalendarIcon
                          className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
                          style={{ color: colors.neutral }}
                        />
                        <Input
                          type="date"
                          value={checkOut}
                          min={
                            checkIn || new Date().toISOString().split("T")[0]
                          }
                          onChange={(e) => setCheckOut(e.target.value)}
                          className="pl-12 h-14 rounded-xl"
                          style={{
                            backgroundColor: colors.neutralLightest,
                            borderColor: colors.neutralLight,
                            color: colors.neutralDarkest,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {checkIn && checkOut && (
                    <div
                      className="p-4 rounded-xl flex items-center gap-3"
                      style={{
                        backgroundColor: isValidStay
                          ? colors.secondarySurface
                          : colors.neutralLightest,
                      }}
                    >
                      <Info
                        className="w-5 h-5"
                        style={{
                          color: isValidStay
                            ? secondaryColor || primaryColor
                            : colors.neutral,
                        }}
                      />
                      <div>
                        <div
                          className="font-semibold"
                          style={{ color: colors.neutralDarkest }}
                        >
                          {nights} {nights === 1 ? "night" : "nights"}
                        </div>
                        {!isValidStay && (
                          <div className="text-sm" style={{ color: "#ef4444" }}>
                            Minimum stay is {minNights} nights
                          </div>
                        )}
                        {isValidStay && discount > 0 && (
                          <div
                            className="text-sm"
                            style={{ color: secondaryColor || primaryColor }}
                          >
                            {discount}% discount applied!
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label style={{ color: colors.neutralDarkest }}>
                      Number of Guests
                    </label>
                    <Select
                      value={guests.toString()}
                      onChange={(value) => setGuests(parseInt(value, 10))}
                      options={Array.from(
                        { length: maxGuests },
                        (_, i) => i + 1,
                      ).map((num) => ({
                        value: num.toString(),
                        label: `${num} ${num === 1 ? "Guest" : "Guests"}`,
                      }))}
                      className="h-14 rounded-xl border border-gray-200 bg-gray-50 text-gray-900"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={!canProceed()}
                    className="w-full h-14 rounded-xl font-semibold text-base"
                    style={{
                      backgroundColor: accentColor || primaryColor,
                      color: "#ffffff",
                    }}
                  >
                    Continue to Guest Information
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div
                  className="p-8 rounded-2xl border space-y-6"
                  style={{
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.neutralLight,
                  }}
                >
                  <div>
                    <h2
                      className="font-semibold mb-2"
                      style={{ fontSize: "24px", color: colors.neutralDarkest }}
                    >
                      Guest Information
                    </h2>
                    <p style={{ color: colors.neutralDark }}>
                      Who&apos;s checking in?
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label style={{ color: colors.neutralDarkest }}>
                        First Name
                      </label>
                      <Input
                        required
                        value={guestInfo.firstName}
                        onChange={(e) =>
                          setGuestInfo((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        className="h-12 rounded-xl"
                        style={{
                          backgroundColor: colors.neutralLightest,
                          borderColor: colors.neutralLight,
                          color: colors.neutralDarkest,
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label style={{ color: colors.neutralDarkest }}>
                        Last Name
                      </label>
                      <Input
                        required
                        value={guestInfo.lastName}
                        onChange={(e) =>
                          setGuestInfo((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        className="h-12 rounded-xl"
                        style={{
                          backgroundColor: colors.neutralLightest,
                          borderColor: colors.neutralLight,
                          color: colors.neutralDarkest,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label style={{ color: colors.neutralDarkest }}>
                      Email
                    </label>
                    <Input
                      type="email"
                      required
                      value={guestInfo.email}
                      onChange={(e) =>
                        setGuestInfo((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="h-12 rounded-xl"
                      style={{
                        backgroundColor: colors.neutralLightest,
                        borderColor: colors.neutralLight,
                        color: colors.neutralDarkest,
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label style={{ color: colors.neutralDarkest }}>
                      Phone
                    </label>
                    <Input
                      type="tel"
                      required
                      value={guestInfo.phone}
                      onChange={(e) =>
                        setGuestInfo((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="h-12 rounded-xl"
                      style={{
                        backgroundColor: colors.neutralLightest,
                        borderColor: colors.neutralLight,
                        color: colors.neutralDarkest,
                      }}
                    />
                  </div>

                  <div className="space-y-2">
                    <label style={{ color: colors.neutralDarkest }}>
                      Special Requests (Optional)
                    </label>
                    <textarea
                      value={guestInfo.specialRequests}
                      onChange={(e) =>
                        setGuestInfo((prev) => ({
                          ...prev,
                          specialRequests: e.target.value,
                        }))
                      }
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border resize-none"
                      style={{
                        backgroundColor: colors.neutralLightest,
                        borderColor: colors.neutralLight,
                        color: colors.neutralDarkest,
                      }}
                      placeholder="Early check-in, late check-out, etc."
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 h-14 rounded-xl font-semibold"
                      style={{
                        borderColor: colors.neutralLight,
                        color: colors.neutralDark,
                      }}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={!canProceed()}
                      className="flex-1 h-14 rounded-xl font-semibold"
                      style={{
                        backgroundColor: accentColor || primaryColor,
                        color: "#ffffff",
                      }}
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div
                  className="p-8 rounded-2xl border space-y-6"
                  style={{
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.neutralLight,
                  }}
                >
                  <div>
                    <h2
                      className="font-semibold mb-2"
                      style={{ fontSize: "24px", color: colors.neutralDarkest }}
                    >
                      Payment Information
                    </h2>
                    <p style={{ color: colors.neutralDark }}>
                      Your payment is secure and encrypted with Paystack
                    </p>
                  </div>

                  <div
                    className="p-4 rounded-xl border"
                    style={{
                      backgroundColor: colors.neutralLightest,
                      borderColor: colors.neutralLight,
                    }}
                  >
                    <div
                      className="text-sm font-semibold mb-1"
                      style={{ color: colors.neutralDarkest }}
                    >
                      Payment Method
                    </div>
                    <div
                      className="text-sm"
                      style={{ color: colors.neutralDark }}
                    >
                      Paystack inline popup (Card, Bank Transfer, USSD, Mobile
                      Money)
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-3 p-4 rounded-xl"
                    style={{ backgroundColor: colors.primaryPale }}
                  >
                    <Lock className="w-5 h-5" style={{ color: primaryColor }} />
                    <div
                      className="text-sm"
                      style={{ color: colors.neutralDark }}
                    >
                      Your payment information is secure and encrypted with
                      industry-standard SSL
                    </div>
                  </div>

                  {errors.submit && (
                    <p className="text-sm" style={{ color: "#ef4444" }}>
                      {errors.submit}
                    </p>
                  )}

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="flex-1 h-14 rounded-xl font-semibold"
                      style={{
                        borderColor: colors.neutralLight,
                        color: colors.neutralDark,
                      }}
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={!canProceed() || isSubmitting}
                      className="flex-1 h-14 rounded-xl font-semibold"
                      style={{
                        backgroundColor: accentColor || primaryColor,
                        color: "#ffffff",
                      }}
                    >
                      {isSubmitting
                        ? "Processing..."
                        : `Confirm & Pay ${formatPrice(total)}`}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>

          <div>
            <div
              className="p-6 rounded-2xl border sticky top-6"
              style={{
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.neutralLight,
              }}
            >
              <h3
                className="font-semibold mb-4"
                style={{ fontSize: "18px", color: colors.neutralDarkest }}
              >
                Booking Summary
              </h3>

              <div className="aspect-video rounded-xl overflow-hidden mb-4">
                <img
                  src={propertyImage}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <h4
                className="font-semibold mb-1"
                style={{ color: colors.neutralDarkest }}
              >
                {property.title}
              </h4>
              <p className="text-sm mb-6" style={{ color: colors.neutralDark }}>
                {property.city}
                {property.state ? `, ${property.state}` : ""}
              </p>

              <div
                className="space-y-3 pb-6 border-b"
                style={{ borderColor: colors.neutralLight }}
              >
                {checkIn && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: colors.neutral }}>Check-in:</span>
                    <span
                      className="font-medium"
                      style={{ color: colors.neutralDarkest }}
                    >
                      {format(new Date(checkIn), "MMM dd, yyyy")}
                    </span>
                  </div>
                )}
                {checkOut && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: colors.neutral }}>Check-out:</span>
                    <span
                      className="font-medium"
                      style={{ color: colors.neutralDarkest }}
                    >
                      {format(new Date(checkOut), "MMM dd, yyyy")}
                    </span>
                  </div>
                )}
                {nights > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: colors.neutral }}>Nights:</span>
                    <span
                      className="font-medium"
                      style={{ color: colors.neutralDarkest }}
                    >
                      {nights}
                    </span>
                  </div>
                )}
                {guests > 0 && (
                  <div className="flex justify-between text-sm">
                    <span style={{ color: colors.neutral }}>Guests:</span>
                    <span
                      className="font-medium"
                      style={{ color: colors.neutralDarkest }}
                    >
                      {guests}
                    </span>
                  </div>
                )}
              </div>

              {nights > 0 && (
                <>
                  <div
                    className="space-y-3 py-6 border-b"
                    style={{ borderColor: colors.neutralLight }}
                  >
                    <div className="flex justify-between text-sm">
                      <span style={{ color: colors.neutralDark }}>
                        {formatPrice((property.pricePerNight || 0) as number)} x{" "}
                        {nights} nights
                      </span>
                      <span style={{ color: colors.neutralDarkest }}>
                        {formatPrice(subtotal)}
                      </span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span style={{ color: secondaryColor || primaryColor }}>
                          {discount}% discount
                        </span>
                        <span style={{ color: secondaryColor || primaryColor }}>
                          -{formatPrice(discountAmount)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span style={{ color: colors.neutralDark }}>
                        Cleaning fee
                      </span>
                      <span style={{ color: colors.neutralDarkest }}>
                        {formatPrice(cleaningFee)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span style={{ color: colors.neutralDark }}>
                        Service fee
                      </span>
                      <span style={{ color: colors.neutralDarkest }}>
                        {formatPrice(serviceFee)}
                      </span>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span style={{ color: colors.neutralDark }}>Taxes</span>
                      <span style={{ color: colors.neutralDarkest }}>
                        {formatPrice(taxes)}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between pt-6">
                    <span
                      className="font-semibold"
                      style={{ fontSize: "18px", color: colors.neutralDarkest }}
                    >
                      Total
                    </span>
                    <span
                      className="font-bold text-2xl"
                      style={{ color: primaryColor }}
                    >
                      {formatPrice(total)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
