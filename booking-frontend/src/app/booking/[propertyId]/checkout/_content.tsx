"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Clock, Info, Lock } from "lucide-react";
import { differenceInDays, format } from "date-fns";
import { toast } from "react-hot-toast";
import { AnimatedDateInput, Button, Input, Select } from "@/components/ui";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { useProperty, usePropertyAvailability } from "@/hooks/useProperties";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { bookingService, paymentService } from "@/services";
import { formatPrice as formatNaira } from "@/utils/currency";

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

const toDateKey = (value: Date): string => value.toISOString().split("T")[0];

const getTomorrowDateKey = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return toDateKey(tomorrow);
};

const parseIntegerFromQuery = (
  value: string | null,
  fallback: number,
  min: number,
): number => {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.floor(parsed));
};

export default function BookingCheckoutContent() {
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

  const sourceBookingId = searchParams.get("sourceBookingId") || "";
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdBooking, setCreatedBooking] = useState<{
    id: string;
    totalPrice: number;
    currency: string;
  } | null>(null);

  // Ref to track whether Paystack callback fired (prevents onClose from false-failing)
  const paymentCallbackFired = useRef(false);

  // Capture the original URL-param dates (from Book Again) so we can validate
  // them once availability data loads — without causing dependency-loop issues.
  const initialCheckInRef = useRef(searchParams.get("checkIn") || "");
  const initialCheckOutRef = useRef(searchParams.get("checkOut") || "");
  const datesValidatedRef = useRef(false);

  const [checkIn, setCheckIn] = useState(searchParams.get("checkIn") || "");
  const [checkOut, setCheckOut] = useState(searchParams.get("checkOut") || "");
  const [guests, setGuests] = useState<number>(
    parseIntegerFromQuery(searchParams.get("guests"), 1, 1),
  );

  const [guestInfo, setGuestInfo] = useState<GuestInfo>({
    firstName: searchParams.get("firstName") || "",
    lastName: searchParams.get("lastName") || "",
    email: searchParams.get("email") || "",
    phone: searchParams.get("phone") || "",
    specialRequests: searchParams.get("specialRequests") || "",
  });

  const [bookingCalculation, setBookingCalculation] = useState<{
    subtotal: number;
    serviceFee: number;
    cleaningFee: number;
    securityDeposit: number;
    taxes: number;
    total: number;
    currency: string;
  } | null>(null);

  const minCheckInDate = useMemo(() => getTomorrowDateKey(), []);
  const minCheckOutDate = useMemo(() => {
    if (!checkIn) {
      const tomorrow = new Date(minCheckInDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return toDateKey(tomorrow);
    }
    const nextDay = new Date(checkIn);
    nextDay.setDate(nextDay.getDate() + 1);
    return toDateKey(nextDay);
  }, [checkIn, minCheckInDate]);

  // Availability: load blocked/booked dates for this property
  const availabilityRangeEnd = useMemo(() => {
    const rangeEnd = new Date();
    rangeEnd.setFullYear(rangeEnd.getFullYear() + 1);
    return toDateKey(rangeEnd);
  }, []);

  const { data: availabilityData, isLoading: availabilityLoading } =
    usePropertyAvailability(propertyId, minCheckInDate, availabilityRangeEnd);

  const unavailableDateSet = useMemo(
    () =>
      new Set(
        (availabilityData?.unavailableDates || []).filter((v): v is string =>
          Boolean(v),
        ),
      ),
    [availabilityData?.unavailableDates],
  );

  const unavailableDateList = useMemo(
    () => Array.from(unavailableDateSet),
    [unavailableDateSet],
  );

  // Once availability data arrives, validate any pre-filled dates (Book Again flow).
  // If they're in the past or now unavailable, clear them and warn the user.
  useEffect(() => {
    if (datesValidatedRef.current) return;
    if (!availabilityData) return;
    const initCI = initialCheckInRef.current;
    if (!initCI) return; // no pre-filled dates — nothing to check
    datesValidatedRef.current = true;

    const inPast = initCI < minCheckInDate;
    const ciBlocked = unavailableDateSet.has(initCI);
    const coBlocked = initialCheckOutRef.current
      ? unavailableDateSet.has(initialCheckOutRef.current)
      : false;

    if (inPast || ciBlocked || coBlocked) {
      setCheckIn("");
      setCheckOut("");
      toast.error(
        inPast
          ? "Those dates have already passed — please select new dates."
          : "Those dates are no longer available — please select new dates.",
      );
    }
  }, [availabilityData, unavailableDateSet, minCheckInDate]);

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

  const fallbackCurrency = property?.currency || "NGN";
  const baseSubtotal = (property?.pricePerNight || 0) * Math.max(0, nights);
  const fallbackCleaningFee = Number(
    (property as unknown as { cleaningFee?: number })?.cleaningFee || 0,
  );
  const fallbackServiceFee = Number(
    (property as unknown as { serviceFee?: number })?.serviceFee || 0,
  );
  const fallbackPreTax =
    baseSubtotal + fallbackCleaningFee + fallbackServiceFee;
  const fallbackTaxes = fallbackPreTax * 0.1;
  const fallbackTotal = fallbackPreTax + fallbackTaxes;

  const currency = bookingCalculation?.currency || fallbackCurrency;
  const subtotal = bookingCalculation?.subtotal ?? baseSubtotal;
  const cleaningFee = bookingCalculation?.cleaningFee ?? fallbackCleaningFee;
  const serviceFee = bookingCalculation?.serviceFee ?? fallbackServiceFee;
  const taxes = bookingCalculation?.taxes ?? fallbackTaxes;
  const securityDeposit =
    bookingCalculation?.securityDeposit ??
    Number(
      (property as unknown as { securityDeposit?: number })?.securityDeposit ||
        0,
    );
  const total = bookingCalculation?.total ?? fallbackTotal + securityDeposit;

  const formatPrice = (amount: number) => formatNaira(amount);

  const validateDates = useCallback((): string | null => {
    if (!checkIn || !checkOut) {
      return "Please select both check-in and check-out dates.";
    }
    if (checkIn < minCheckInDate) {
      return "Check-in date must be at least tomorrow.";
    }
    if (checkOut <= checkIn) {
      return "Check-out date must be after check-in date.";
    }
    if (nights < minNights) {
      return `Minimum stay is ${minNights} night${minNights === 1 ? "" : "s"}.`;
    }
    if (unavailableDateSet.has(checkIn)) {
      return "The selected check-in date is already booked. Please choose another date.";
    }
    if (unavailableDateSet.has(checkOut)) {
      return "The selected check-out date is already booked. Please choose another date.";
    }
    return null;
  }, [
    checkIn,
    checkOut,
    minCheckInDate,
    nights,
    minNights,
    unavailableDateSet,
  ]);

  useEffect(() => {
    if (!user) return;
    setGuestInfo((prev) => ({
      ...prev,
      firstName: prev.firstName || user.firstName || "",
      lastName: prev.lastName || user.lastName || "",
      email: prev.email || user.email || "",
      phone: prev.phone || user.phone || "",
    }));
  }, [user]);

  useEffect(() => {
    if (userLoading) {
      return;
    }

    const fullPath = `/booking/${propertyId}/checkout${window.location.search || ""}`;

    if (!user) {
      router.push(`/guest/login?returnTo=${encodeURIComponent(fullPath)}`);
      return;
    }

    if (user.role !== "GUEST") {
      toast.error("Please sign in with a guest account to continue checkout.");
      router.push(`/guest/login?returnTo=${encodeURIComponent(fullPath)}`);
    }
  }, [userLoading, user, router, propertyId]);

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
      const dateError = validateDates();
      if (!propertyId || dateError) {
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
      } catch (error: unknown) {
        setBookingCalculation(null);
        const message =
          error instanceof Error
            ? error.message
            : "Unable to calculate booking total for selected dates.";
        setErrors((prev) => ({ ...prev, date: message }));
      }
    };

    // Debounce: wait 400ms after last change before calling the API
    const timer = setTimeout(() => {
      void fetchBookingCalculation();
    }, 400);
    return () => clearTimeout(timer);
  }, [
    propertyId,
    checkIn,
    checkOut,
    guests,
    nights,
    minNights,
    minCheckInDate,
    validateDates,
  ]);

  const canContinueStepOne = () => {
    return !validateDates() && guests >= 1 && guests <= maxGuests;
  };

  const canInitializePayment = () => {
    return Boolean(
      canContinueStepOne() &&
      guestInfo.firstName.trim() &&
      guestInfo.lastName.trim() &&
      guestInfo.email.trim() &&
      guestInfo.phone.trim(),
    );
  };

  const maybeReplaceOldBooking = async (newBookingId: string) => {
    if (!sourceBookingId || sourceBookingId === newBookingId) return;
    try {
      await bookingService.cancelBooking(
        sourceBookingId,
        `Replaced by Book Again flow (${newBookingId})`,
      );
    } catch {
      // Replacement cancellation is best-effort and should not block success flow.
    }
  };

  const goToFailedCallback = (
    bookingId?: string,
    reason?: string,
    reference?: string,
  ) => {
    const query = new URLSearchParams();
    if (bookingId) query.set("bookingId", bookingId);
    if (reason) query.set("reason", reason);
    if (reference) query.set("reference", reference);
    router.push(`/booking/payment/failed?${query.toString()}`);
  };

  const handleInitializePayment = async () => {
    const dateError = validateDates();
    if (dateError) {
      toast.error(dateError);
      setErrors((prev) => ({ ...prev, date: dateError }));
      return;
    }

    if (!canInitializePayment()) {
      toast.error("Please complete your information before continuing.");
      return;
    }

    // Reset callback flag for this new payment attempt
    paymentCallbackFired.current = false;
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
        originUrl: typeof window !== "undefined" ? window.location.origin : "",
      });
      if (!initResponse.reference) {
        throw new Error("Unable to initialize Paystack payment reference.");
      }

      const paystackKey =
        process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ||
        process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC;

      if (!user) {
        throw new Error("Please log in again to continue with payment.");
      }
      if (!paystackKey) {
        throw new Error("Paystack public key is missing.");
      }

      const handler = paystack.setup({
        key: paystackKey,
        email: guestInfo.email.trim() || user.email,
        amount: Math.round(bookingAmount * 100),
        currency: bookingCurrency || "NGN",
        ref: initResponse.reference,
        metadata: {
          bookingId,
          propertyId,
          guestId: user.id,
          guestName: `${guestInfo.firstName} ${guestInfo.lastName}`.trim(),
          guestPhone: guestInfo.phone,
          sourceBookingId: sourceBookingId || undefined,
        },
        callback: async (response: { reference?: string; trxref?: string }) => {
          // Mark that the payment callback was triggered — prevents onClose from false-failing
          paymentCallbackFired.current = true;
          const reference = response.reference || response.trxref;
          if (!reference) {
            goToFailedCallback(bookingId, "missing_reference");
            return;
          }

          try {
            const verification = await paymentService.verifyPaystackPayment({
              reference,
            });

            if (verification.success) {
              await maybeReplaceOldBooking(bookingId);
              router.push(
                `/booking/payment/success?reference=${encodeURIComponent(
                  reference,
                )}&bookingId=${encodeURIComponent(bookingId)}`,
              );
              return;
            }

            const fallback = await paymentService.verifyPaymentByBooking({
              bookingId,
            });
            if (fallback.success) {
              await maybeReplaceOldBooking(bookingId);
              router.push(
                `/booking/payment/success?reference=${encodeURIComponent(
                  reference,
                )}&bookingId=${encodeURIComponent(bookingId)}`,
              );
              return;
            }

            goToFailedCallback(bookingId, "verification_failed", reference);
          } catch {
            goToFailedCallback(bookingId, "verification_failed", reference);
          }
        },
        onClose: () => {
          // Only redirect to failed if the payment callback was NOT already handled
          if (paymentCallbackFired.current) return;
          toast("Payment cancelled");
          goToFailedCallback(bookingId, "cancelled");
        },
      });

      handler.openIframe();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to initialize payment. Please try again.";
      setErrors({ submit: message });
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const dateError = validateDates();
    if (dateError) {
      setErrors((prev) => ({ ...prev, date: dateError }));
      toast.error(dateError);
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.date;
      return next;
    });
    await handleInitializePayment();
  };

  if (userLoading || propertyLoading || !property) {
    return (
      <div className="min-h-screen bg-slate-50">
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

  if (!user || user.role !== "GUEST") {
    return null;
  }

  const propertyImage =
    property.images?.[0]?.url ||
    "https://images.unsplash.com/photo-1568115286680-d203e08a8be6?w=400";

  return (
    <div className="min-h-screen bg-slate-50">
      <GuestHeader
        currentPage="browse"
        searchPlaceholder="Search location..."
      />

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <Link
          href={`/guest/browse/${propertyId}`}
          className="inline-flex items-center gap-2 mb-8 hover:underline text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Property
        </Link>

        <div className="mb-12">
          <h1 className="font-semibold mb-2 text-[40px] text-gray-900">
            Complete Your Booking
          </h1>
          <p className="text-gray-600">
            Enter your dates, guests, and information to proceed to payment.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              <div className="p-8 rounded-2xl border space-y-8 bg-white border-gray-200">
                <div>
                  <h2 className="font-semibold mb-2 text-2xl text-gray-900">
                    Select Your Dates &amp; Guests
                  </h2>
                  <p className="text-gray-600">
                    Earliest check-in is tomorrow. Minimum stay: {minNights}{" "}
                    nights.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <AnimatedDateInput
                    label="Check-in Date"
                    value={checkIn}
                    min={minCheckInDate}
                    unavailableDates={unavailableDateList}
                    disabled={availabilityLoading}
                    onChange={setCheckIn}
                    inputWrapperClassName="border-gray-300 bg-gradient-to-br from-white to-slate-50"
                    iconClassName="text-slate-500"
                  />

                  <AnimatedDateInput
                    label="Check-out Date"
                    value={checkOut}
                    min={minCheckOutDate}
                    unavailableDates={unavailableDateList}
                    disabled={availabilityLoading}
                    onChange={setCheckOut}
                    inputWrapperClassName="border-gray-300 bg-gradient-to-br from-white to-slate-50"
                    iconClassName="text-slate-500"
                  />
                </div>

                {checkIn && checkOut && (
                  <div className="p-4 rounded-xl flex items-center gap-3 bg-slate-50">
                    <Info
                      className="w-5 h-5"
                      style={{ color: secondaryColor || primaryColor }}
                    />
                    <div>
                      <div className="font-semibold text-gray-900">
                        {nights > 0
                          ? `${nights} night${nights === 1 ? "" : "s"}`
                          : "Select valid dates"}
                      </div>
                      {errors.date ? (
                        <div className="text-sm text-red-500">
                          {errors.date}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-600">
                          Check-in cannot be today.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="guest-count" className="text-gray-900">
                    Number of Guests
                  </label>
                  <Select
                    id="guest-count"
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

                <div className="border-t border-gray-200 pt-6">
                  <h2 className="font-semibold mb-2 text-2xl text-gray-900">
                    Your Information
                  </h2>
                  {sourceBookingId ? (
                    <p
                      className="text-sm mt-2"
                      style={{ color: secondaryColor || primaryColor }}
                    >
                      Book Again mode: after successful payment, your previous
                      booking will be replaced automatically.
                    </p>
                  ) : null}
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="first-name" className="text-gray-900">
                      First Name
                    </label>
                    <Input
                      id="first-name"
                      required
                      value={guestInfo.firstName}
                      onChange={(e) =>
                        setGuestInfo((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                      className="h-12 rounded-xl bg-gray-50 border-gray-200"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="last-name" className="text-gray-900">
                      Last Name
                    </label>
                    <Input
                      id="last-name"
                      required
                      value={guestInfo.lastName}
                      onChange={(e) =>
                        setGuestInfo((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                      className="h-12 rounded-xl bg-gray-50 border-gray-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="guest-email" className="text-gray-900">
                    Email
                  </label>
                  <Input
                    id="guest-email"
                    type="email"
                    required
                    value={guestInfo.email}
                    onChange={(e) =>
                      setGuestInfo((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="h-12 rounded-xl bg-gray-50 border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="guest-phone" className="text-gray-900">
                    Phone
                  </label>
                  <Input
                    id="guest-phone"
                    type="tel"
                    required
                    value={guestInfo.phone}
                    onChange={(e) =>
                      setGuestInfo((prev) => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                    className="h-12 rounded-xl bg-gray-50 border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="special-requests" className="text-gray-900">
                    Special Requests (Optional)
                  </label>
                  <textarea
                    id="special-requests"
                    value={guestInfo.specialRequests}
                    onChange={(e) =>
                      setGuestInfo((prev) => ({
                        ...prev,
                        specialRequests: e.target.value,
                      }))
                    }
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border resize-none bg-gray-50 border-gray-200 text-gray-900"
                    placeholder="Early check-in, late check-out, etc."
                  />
                </div>

                <div className="p-4 rounded-xl border bg-gray-50 border-gray-200">
                  <div className="text-sm font-semibold mb-1 text-gray-900">
                    Payment Method
                  </div>
                  <div className="text-sm text-gray-600">
                    Paystack inline popup (Card, Bank Transfer, USSD, Mobile
                    Money)
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-100">
                  <Lock className="w-5 h-5" style={{ color: primaryColor }} />
                  <div className="text-sm text-gray-700">
                    Your payment information is encrypted with industry-standard
                    SSL.
                  </div>
                </div>

                {errors.submit ? (
                  <p className="text-sm text-red-500">{errors.submit}</p>
                ) : null}

                <Button
                  type="submit"
                  disabled={!canInitializePayment() || isSubmitting}
                  className="w-full h-14 rounded-xl font-semibold text-base text-white"
                  style={{ backgroundColor: accentColor || primaryColor }}
                >
                  {isSubmitting
                    ? "Initializing..."
                    : `Proceed to Payment (${formatPrice(total)})`}
                </Button>
              </div>
            </form>
          </div>

          <div>
            <div className="p-6 rounded-2xl border sticky top-6 bg-white border-gray-200">
              <h3 className="font-semibold mb-4 text-[18px] text-gray-900">
                Booking Summary
              </h3>

              <div className="aspect-video rounded-xl overflow-hidden mb-4">
                <img
                  src={propertyImage}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <h4 className="font-semibold mb-1 text-gray-900">
                {property.title}
              </h4>
              <p className="text-sm mb-6 text-gray-600">
                {property.city}
                {property.state ? `, ${property.state}` : ""}
              </p>

              <div className="space-y-3 pb-6 border-b border-gray-200">
                {checkIn ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Check-in:</span>
                    <span className="font-medium text-gray-900">
                      {format(new Date(checkIn), "MMM dd, yyyy")}
                    </span>
                  </div>
                ) : null}
                {checkOut ? (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Check-out:</span>
                    <span className="font-medium text-gray-900">
                      {format(new Date(checkOut), "MMM dd, yyyy")}
                    </span>
                  </div>
                ) : null}
                {(property?.checkInTime || property?.checkOutTime) && (
                  <div className="flex justify-between text-sm">
                    <span className="flex items-center gap-1 text-gray-500">
                      <Clock className="w-3.5 h-3.5" />
                      Times:
                    </span>
                    <span className="font-medium text-gray-900 text-right">
                      {property.checkInTime && `From ${property.checkInTime}`}
                      {property.checkInTime && property.checkOutTime && " · "}
                      {property.checkOutTime &&
                        `Until ${property.checkOutTime}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Guests:</span>
                  <span className="font-medium text-gray-900">{guests}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Nights:</span>
                  <span className="font-medium text-gray-900">
                    {Math.max(0, nights)}
                  </span>
                </div>
              </div>

              <div className="pt-6 space-y-3 text-sm">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Cleaning fee</span>
                  <span>{formatPrice(cleaningFee)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Service fee</span>
                  <span>{formatPrice(serviceFee)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Taxes</span>
                  <span>{formatPrice(taxes)}</span>
                </div>
                {securityDeposit > 0 && (
                  <div className="flex justify-between text-gray-700">
                    <span>Security deposit</span>
                    <span>{formatPrice(securityDeposit)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-gray-200 flex justify-between text-base font-semibold text-gray-900">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Currency: {currency}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
