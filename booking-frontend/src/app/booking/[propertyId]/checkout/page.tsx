"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Users,
  CreditCard,
  Lock,
  CheckCircle2,
  Info,
  MapPin,
  Home,
} from "lucide-react";
import Link from "next/link";
import { format, differenceInDays } from "date-fns";
import { toast } from "react-hot-toast";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Footer } from "@/components/guest/sections";
import { Button, Card, Input, Select } from "@/components/ui";
import { useProperty } from "@/hooks/useProperties";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { bookingService } from "@/services";

interface GuestInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialRequests: string;
}

interface PaymentInfo {
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
}

export default function BookingCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const propertyId = params.propertyId as string;

  const { user, isLoading: userLoading } = useCurrentUser();
  const { data: property, isLoading: propertyLoading } = useProperty(propertyId);
  const {
    brandColor: primaryColor,
    secondaryColor,
    accentColor,
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo>({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  });
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const [bookingCalculation, setBookingCalculation] = useState<{
    subtotal: number;
    serviceFee: number;
    cleaningFee: number;
    securityDeposit: number;
    taxes: number;
    total: number;
    currency: string;
    nights: number;
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
  }, [user, userLoading, router, propertyId, checkIn, checkOut, guests]);

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
    return Math.max(0, differenceInDays(end, start));
  }, [checkIn, checkOut]);

  const minNights = Math.max(
    1,
    Number((property as unknown as { minNights?: number })?.minNights || 1),
  );
  const maxGuests = Math.max(1, Number(property?.maxGuests || 1));
  const isValidStay = nights >= minNights;

  const fallbackCurrency = property?.currency || "NGN";
  const fallbackSubtotal = (property?.pricePerNight || 0) * nights;
  const fallbackCleaningFee = Number(
    (property as unknown as { cleaningFee?: number })?.cleaningFee || 0,
  );
  const fallbackServiceFee = Number(
    (property as unknown as { serviceFee?: number })?.serviceFee || 0,
  );
  const fallbackTaxes = Math.round((fallbackSubtotal + fallbackCleaningFee + fallbackServiceFee) * 0.1);
  const fallbackTotal = fallbackSubtotal + fallbackCleaningFee + fallbackServiceFee + fallbackTaxes;

  const currency = bookingCalculation?.currency || fallbackCurrency;
  const subtotal = bookingCalculation?.subtotal ?? fallbackSubtotal;
  const cleaningFee = bookingCalculation?.cleaningFee ?? fallbackCleaningFee;
  const serviceFee = bookingCalculation?.serviceFee ?? fallbackServiceFee;
  const securityDeposit = bookingCalculation?.securityDeposit ?? 0;
  const taxes = bookingCalculation?.taxes ?? fallbackTaxes;
  const total = bookingCalculation?.total ?? fallbackTotal;

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);

  const canProceed = () => {
    if (step === 1) {
      return Boolean(checkIn && checkOut) && isValidStay && guests > 0 && guests <= maxGuests;
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
      return Boolean(
        paymentInfo.cardNumber.trim() &&
          paymentInfo.cardName.trim() &&
          paymentInfo.expiryDate.trim() &&
          paymentInfo.cvv.trim() &&
          agreeToTerms,
      );
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
      setErrors({ submit: "Please complete all required fields before continuing." });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const booking = await bookingService.createBooking({
        propertyId,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        guests,
        specialRequests: guestInfo.specialRequests,
      });

      router.push(`/booking/${propertyId}/payment?bookingId=${booking.id}&paymentMethod=paystack`);
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
      <div className="min-h-screen bg-gray-50">
        <GuestHeader currentPage="browse" searchPlaceholder="Search location..." />
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
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&auto=format&fit=crop&q=80";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f8fafc" }}>
      <GuestHeader currentPage="browse" searchPlaceholder="Search location..." />

      <main className="max-w-[1200px] mx-auto w-full px-6 py-12 flex-1">
        <Link
          href={`/guest/browse/${propertyId}`}
          className="inline-flex items-center gap-2 mb-8 hover:underline text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Property
        </Link>

        <div className="mb-12">
          <h1 className="font-semibold mb-4 text-[40px] text-gray-900">Complete Your Booking</h1>

          <div className="flex items-center gap-4 mb-4">
            {[1, 2, 3].map((currentStep) => (
              <div key={currentStep} className="flex-1 flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all"
                  style={{
                    backgroundColor: step >= currentStep ? primaryColor : "#e5e7eb",
                    color: step >= currentStep ? "#ffffff" : "#6b7280",
                  }}
                >
                  {step > currentStep ? <CheckCircle2 className="w-6 h-6" /> : currentStep}
                </div>
                {currentStep < 3 && (
                  <div
                    className="flex-1 h-1 rounded-full"
                    style={{ backgroundColor: step > currentStep ? primaryColor : "#e5e7eb" }}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-4 text-sm">
            <span style={{ color: step === 1 ? primaryColor : "#6b7280" }}>Dates & Guests</span>
            <span style={{ color: step === 2 ? primaryColor : "#6b7280" }}>Your Information</span>
            <span style={{ color: step === 3 ? primaryColor : "#6b7280" }}>Payment</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <Card className="p-8 rounded-2xl border space-y-8 bg-white border-gray-200">
                  <div>
                    <h2 className="font-semibold mb-2 text-[24px] text-gray-900">Select Your Dates</h2>
                    <p className="text-gray-600">Minimum stay: {minNights} nights</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-gray-900">Check-in Date</label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <Input
                          type="date"
                          className="pl-12 h-14 rounded-xl border text-base bg-gray-50 border-gray-200"
                          min={new Date().toISOString().split("T")[0]}
                          value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-gray-900">Check-out Date</label>
                      <div className="relative">
                        <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                        <Input
                          type="date"
                          className="pl-12 h-14 rounded-xl border text-base bg-gray-50 border-gray-200"
                          min={checkIn || new Date().toISOString().split("T")[0]}
                          value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {checkIn && checkOut && (
                    <div
                      className="p-4 rounded-xl flex items-center gap-3"
                      style={{ backgroundColor: isValidStay ? "#f5f9f5" : "#f3f4f6" }}
                    >
                      <Info
                        className="w-5 h-5"
                        style={{ color: isValidStay ? secondaryColor || primaryColor : "#6b7280" }}
                      />
                      <div>
                        <div className="font-semibold text-gray-900">
                          {nights} {nights === 1 ? "night" : "nights"}
                        </div>
                        {!isValidStay && (
                          <div className="text-sm text-red-500">Minimum stay is {minNights} nights</div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-gray-900">Number of Guests</label>
                    <Select
                      value={String(guests)}
                      onChange={(value) => setGuests(Number(value))}
                      options={Array.from({ length: maxGuests }, (_, index) => {
                        const value = index + 1;
                        return {
                          value: String(value),
                          label: `${value} ${value === 1 ? "Guest" : "Guests"}`,
                        };
                      })}
                    />
                    <div className="text-xs text-gray-500">Maximum: {maxGuests} guests</div>
                  </div>

                  <Button
                    type="submit"
                    disabled={!canProceed()}
                    className="w-full h-14 rounded-xl font-semibold text-base text-white"
                    style={{ backgroundColor: accentColor || primaryColor }}
                  >
                    Continue to Guest Information
                  </Button>
                </Card>
              )}

              {step === 2 && (
                <Card className="p-8 rounded-2xl border space-y-6 bg-white border-gray-200">
                  <div>
                    <h2 className="font-semibold mb-2 text-[24px] text-gray-900">Guest Information</h2>
                    <p className="text-gray-600">Who&apos;s checking in?</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-gray-900">First Name</label>
                      <Input
                        value={guestInfo.firstName}
                        onChange={(e) =>
                          setGuestInfo((prev) => ({ ...prev, firstName: e.target.value }))
                        }
                        className="h-12 rounded-xl bg-gray-50 border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-gray-900">Last Name</label>
                      <Input
                        value={guestInfo.lastName}
                        onChange={(e) =>
                          setGuestInfo((prev) => ({ ...prev, lastName: e.target.value }))
                        }
                        className="h-12 rounded-xl bg-gray-50 border-gray-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-gray-900">Email</label>
                    <Input
                      type="email"
                      value={guestInfo.email}
                      onChange={(e) =>
                        setGuestInfo((prev) => ({ ...prev, email: e.target.value }))
                      }
                      className="h-12 rounded-xl bg-gray-50 border-gray-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-gray-900">Phone</label>
                    <Input
                      type="tel"
                      value={guestInfo.phone}
                      onChange={(e) =>
                        setGuestInfo((prev) => ({ ...prev, phone: e.target.value }))
                      }
                      className="h-12 rounded-xl bg-gray-50 border-gray-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-gray-900">Special Requests (Optional)</label>
                    <textarea
                      value={guestInfo.specialRequests}
                      onChange={(e) =>
                        setGuestInfo((prev) => ({ ...prev, specialRequests: e.target.value }))
                      }
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border resize-none bg-gray-50 border-gray-200 text-gray-900"
                      placeholder="Early check-in, late check-out, etc."
                    />
                  </div>

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="flex-1 h-14 rounded-xl font-semibold"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={!canProceed()}
                      className="flex-1 h-14 rounded-xl font-semibold text-white"
                      style={{ backgroundColor: accentColor || primaryColor }}
                    >
                      Continue to Payment
                    </Button>
                  </div>
                </Card>
              )}

              {step === 3 && (
                <Card className="p-8 rounded-2xl border space-y-6 bg-white border-gray-200">
                  <div>
                    <h2 className="font-semibold mb-2 text-[24px] text-gray-900">Payment Information</h2>
                    <p className="text-gray-600">Your payment is secure and encrypted</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-gray-900">Card Number</label>
                    <div className="relative">
                      <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <Input
                        placeholder="1234 5678 9012 3456"
                        value={paymentInfo.cardNumber}
                        onChange={(e) =>
                          setPaymentInfo((prev) => ({ ...prev, cardNumber: e.target.value }))
                        }
                        className="pl-12 h-12 rounded-xl bg-gray-50 border-gray-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-gray-900">Cardholder Name</label>
                    <Input
                      placeholder="John Doe"
                      value={paymentInfo.cardName}
                      onChange={(e) =>
                        setPaymentInfo((prev) => ({ ...prev, cardName: e.target.value }))
                      }
                      className="h-12 rounded-xl bg-gray-50 border-gray-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-gray-900">Expiry Date</label>
                      <Input
                        placeholder="MM/YY"
                        value={paymentInfo.expiryDate}
                        onChange={(e) =>
                          setPaymentInfo((prev) => ({ ...prev, expiryDate: e.target.value }))
                        }
                        className="h-12 rounded-xl bg-gray-50 border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-gray-900">CVV</label>
                      <Input
                        placeholder="123"
                        value={paymentInfo.cvv}
                        onChange={(e) =>
                          setPaymentInfo((prev) => ({ ...prev, cvv: e.target.value }))
                        }
                        className="h-12 rounded-xl bg-gray-50 border-gray-200"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl border flex items-start gap-3 bg-blue-50 border-blue-100">
                    <Lock className="w-5 h-5 mt-0.5" style={{ color: primaryColor }} />
                    <div>
                      <div className="font-semibold text-gray-900">Secure Payment</div>
                      <div className="text-sm text-gray-600">
                        You will be redirected to Paystack to complete your payment securely.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <input
                      id="checkout-terms"
                      type="checkbox"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />
                    <label htmlFor="checkout-terms" className="text-sm text-gray-700">
                      I agree to the <Link href="/legal/terms" className="underline">Terms</Link> and <Link href="/legal/privacy" className="underline">Privacy Policy</Link>.
                    </label>
                  </div>

                  {errors.submit && <p className="text-sm text-red-500">{errors.submit}</p>}

                  <div className="flex gap-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(2)}
                      className="flex-1 h-14 rounded-xl font-semibold"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={!canProceed() || isSubmitting}
                      className="flex-1 h-14 rounded-xl font-semibold text-white"
                      style={{ backgroundColor: accentColor || primaryColor }}
                    >
                      {isSubmitting ? "Processing..." : "Complete Booking"}
                    </Button>
                  </div>
                </Card>
              )}
            </form>
          </div>

          <div className="space-y-6">
            <Card className="p-6 rounded-2xl border bg-white border-gray-200 sticky top-24">
              <h3 className="font-semibold mb-4 text-[20px] text-gray-900">Booking Summary</h3>

              <div className="flex items-start gap-4 mb-6">
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {propertyImage ? (
                    <img src={propertyImage} alt={property.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Home className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900 line-clamp-1">{property.title}</div>
                  <div className="flex items-center gap-1 text-sm text-gray-600 mt-1 line-clamp-1">
                    <MapPin className="w-4 h-4" />
                    {property.city}
                    {property.state ? `, ${property.state}` : ""}
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <CalendarIcon className="w-4 h-4" style={{ color: accentColor || primaryColor }} />
                  <span>
                    {checkIn ? format(new Date(checkIn), "PPP") : "Select check-in"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <CalendarIcon className="w-4 h-4" style={{ color: accentColor || primaryColor }} />
                  <span>
                    {checkOut ? format(new Date(checkOut), "PPP") : "Select check-out"}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <Users className="w-4 h-4" style={{ color: accentColor || primaryColor }} />
                  <span>{guests} {guests === 1 ? "guest" : "guests"}</span>
                </div>
              </div>

              <div className="border-t pt-4 space-y-3 border-gray-200">
                <div className="flex justify-between text-sm text-gray-700">
                  <span>
                    {formatPrice(nights > 0 ? subtotal / Math.max(nights, 1) : property.pricePerNight)} × {nights || 0} {nights === 1 ? "night" : "nights"}
                  </span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>

                {cleaningFee > 0 && (
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Cleaning fee</span>
                    <span className="font-medium">{formatPrice(cleaningFee)}</span>
                  </div>
                )}

                {serviceFee > 0 && (
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Service fee</span>
                    <span className="font-medium">{formatPrice(serviceFee)}</span>
                  </div>
                )}

                {securityDeposit > 0 && (
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Security deposit</span>
                    <span className="font-medium">{formatPrice(securityDeposit)}</span>
                  </div>
                )}

                {taxes > 0 && (
                  <div className="flex justify-between text-sm text-gray-700">
                    <span>Taxes</span>
                    <span className="font-medium">{formatPrice(taxes)}</span>
                  </div>
                )}

                <div className="border-t pt-4 flex items-center justify-between border-gray-200">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-xl font-bold" style={{ color: primaryColor }}>
                    {formatPrice(total)}
                  </span>
                </div>
              </div>
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
