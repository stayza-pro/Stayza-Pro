"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Users,
  Lock,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { Button, Input } from "@/components/ui";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
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
  guest: { email: string; firstName?: string; lastName?: string };
  property: {
    name?: string;
    title?: string;
    city?: string;
    state?: string;
    images?: string[] | { url: string }[];
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
  } = useRealtorBranding();

  const { isAuthenticated, isLoading: authLoading } = useCurrentUser();
  const [authChecked, setAuthChecked] = useState(false);
  const [booking, setBooking] = useState<CheckoutBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [step, setStep] = useState(1);
  const [date, setDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    notes: "",
  });

  const timeSlots = [
    "9:00 AM",
    "10:00 AM",
    "11:00 AM",
    "12:00 PM",
    "2:00 PM",
    "3:00 PM",
    "4:00 PM",
    "5:00 PM",
  ];

  const fetchBooking = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = (await bookingService.getBooking(bookingId)) as unknown as CheckoutBooking;
      setBooking(data || null);

      if (data?.status !== "PENDING") {
        router.push(`/guest/bookings/${bookingId}`);
      }

      const checkInDate = data?.checkInDate ? new Date(data.checkInDate) : undefined;
      if (checkInDate && !Number.isNaN(checkInDate.getTime())) {
        setDate(checkInDate);
      }

      setFormData((prev) => ({
        ...prev,
        firstName: data?.guest?.firstName || prev.firstName,
        lastName: data?.guest?.lastName || prev.lastName,
        email: data?.guest?.email || prev.email,
      }));
    } catch {
      toast.error("Failed to load checkout details");
      router.push("/guest/bookings");
    } finally {
      setIsLoading(false);
    }
  }, [bookingId, router]);

  useEffect(() => {
    if (!authLoading && (isAuthenticated || !authChecked)) {
      setAuthChecked(true);
    }
  }, [authLoading, isAuthenticated, authChecked]);

  useEffect(() => {
    if (authChecked && !authLoading && !isAuthenticated) {
      router.push(`/guest/login?returnTo=/guest/bookings/${bookingId}/checkout`);
    }
  }, [authChecked, authLoading, isAuthenticated, router, bookingId]);

  useEffect(() => {
    if (authChecked && isAuthenticated) {
      void fetchBooking();
    }
  }, [authChecked, isAuthenticated, fetchBooking]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const getPropertyImage = () => {
    const firstImage = booking?.property?.images?.[0];
    if (!firstImage) return null;
    if (typeof firstImage === "string") return firstImage;
    return firstImage.url;
  };

  const amount = booking?.payment?.amount || 0;
  const currency = booking?.payment?.currency || "NGN";

  const nights = useMemo(() => {
    if (!booking) return 0;
    const start = new Date(booking.checkInDate);
    const end = new Date(booking.checkOutDate);
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }, [booking]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
    }).format(value);

  const handlePayment = async () => {
    if (!booking || !booking.payment) {
      toast.error("Payment information not available");
      return;
    }

    const paystack = (window as unknown as { PaystackPop?: PaystackPopup }).PaystackPop;
    if (!paystack) {
      toast.error("Payment system not loaded. Please refresh and try again.");
      return;
    }

    try {
      setIsProcessing(true);

      let reference = booking.payment.reference;
      if (!reference) {
        const initResponse = await paymentService.initializePaystackPayment({ bookingId });
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
                router.push(`/guest/bookings/${bookingId}`);
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
      const message = error instanceof Error ? error.message : "Failed to process payment";
      toast.error(message);
      setIsProcessing(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (step < 3) {
      setStep((prev) => prev + 1);
      return;
    }
    void handlePayment();
  };

  if (!authChecked || authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">Loading...</div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">Booking not found</div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f8fafc" }}>
      <GuestHeader currentPage="bookings" searchPlaceholder="Search your bookings..." />

      <main className="max-w-[1200px] mx-auto w-full px-6 py-12">
        <Link
          href={`/guest/bookings/${booking.id}`}
          className="inline-flex items-center gap-2 mb-8 hover:underline text-gray-600"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Property
        </Link>

        <div className="mb-12">
          <h1 className="font-semibold mb-4 text-[40px] text-gray-900">Book Your Viewing</h1>

          <div className="flex items-center gap-4 mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all"
                  style={{
                    backgroundColor: step >= s ? primaryColor : "#e5e7eb",
                    color: step >= s ? "#ffffff" : "#6b7280",
                  }}
                >
                  {step > s ? <CheckCircle2 className="w-6 h-6" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className="flex-1 h-1 rounded-full"
                    style={{ backgroundColor: step > s ? primaryColor : "#e5e7eb" }}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-4 text-sm">
            <span style={{ color: step === 1 ? primaryColor : "#6b7280" }}>Select Date & Time</span>
            <span style={{ color: step === 2 ? primaryColor : "#6b7280" }}>Your Information</span>
            <span style={{ color: step === 3 ? primaryColor : "#6b7280" }}>Review & Confirm</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit}>
              {step === 1 && (
                <div className="p-8 rounded-2xl border space-y-8 bg-white border-gray-200">
                  <div>
                    <h2 className="font-semibold mb-2 text-[24px] text-gray-900">Select Date & Time</h2>
                    <p className="text-gray-600">Choose your preferred viewing date and time</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-gray-900">Viewing Date</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                      <Input
                        type="date"
                        className="pl-12 h-14 rounded-xl border text-base bg-gray-50 border-gray-200"
                        value={date ? format(date, "yyyy-MM-dd") : ""}
                        onChange={(e) => setDate(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-gray-900">Viewing Time</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {timeSlots.map((time) => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setSelectedTime(time)}
                          className="h-12 rounded-xl font-medium transition-all"
                          style={{
                            backgroundColor: selectedTime === time ? "#e8f1f8" : "#f9fafb",
                            borderWidth: "2px",
                            borderColor: selectedTime === time ? primaryColor : "#e5e7eb",
                            color: selectedTime === time ? primaryColor : "#4b5563",
                          }}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={!date || !selectedTime}
                    className="w-full h-14 rounded-xl font-semibold text-base text-white"
                    style={{ backgroundColor: accentColor || primaryColor }}
                  >
                    Continue to Information
                  </Button>
                </div>
              )}

              {step === 2 && (
                <div className="p-8 rounded-2xl border space-y-6 bg-white border-gray-200">
                  <div>
                    <h2 className="font-semibold mb-2 text-[24px] text-gray-900">Your Information</h2>
                    <p className="text-gray-600">We&apos;ll use this to confirm your booking</p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-gray-900">First Name</label>
                      <Input
                        required
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="h-12 rounded-xl bg-gray-50 border-gray-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-gray-900">Last Name</label>
                      <Input
                        required
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="h-12 rounded-xl bg-gray-50 border-gray-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-gray-900">Email</label>
                    <Input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-12 rounded-xl bg-gray-50 border-gray-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-gray-900">Phone</label>
                    <Input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-12 rounded-xl bg-gray-50 border-gray-200"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-gray-900">Notes (Optional)</label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border resize-none bg-gray-50 border-gray-200 text-gray-900"
                      placeholder="Any specific questions or requirements?"
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
                      className="flex-1 h-14 rounded-xl font-semibold text-white"
                      style={{ backgroundColor: accentColor || primaryColor }}
                    >
                      Review Booking
                    </Button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="p-8 rounded-2xl border space-y-6 bg-white border-gray-200">
                  <div>
                    <h2 className="font-semibold mb-2 text-[24px] text-gray-900">Review & Confirm</h2>
                    <p className="text-gray-600">Please review your booking details</p>
                  </div>

                  <div className="p-6 rounded-xl space-y-4 bg-[#f9f4ef]">
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-5 h-5" style={{ color: primaryColor }} />
                      <div>
                        <div className="text-sm text-gray-500">Date</div>
                        <div className="font-semibold text-gray-900">
                          {date ? format(date, "PPPP") : ""}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5" style={{ color: primaryColor }} />
                      <div>
                        <div className="text-sm text-gray-500">Time</div>
                        <div className="font-semibold text-gray-900">{selectedTime}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5" style={{ color: primaryColor }} />
                      <div>
                        <div className="text-sm text-gray-500">Guests</div>
                        <div className="font-semibold text-gray-900">{booking.totalGuests || 1}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-xl space-y-3 bg-gray-50">
                    <div className="font-semibold text-gray-900">Contact Information</div>
                    <div className="text-gray-600">{formData.firstName} {formData.lastName}</div>
                    <div className="text-gray-600">{formData.email}</div>
                    <div className="text-gray-600">{formData.phone}</div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-xl bg-[#e8f1f8]">
                    <Lock className="w-5 h-5" style={{ color: primaryColor }} />
                    <div className="text-sm text-gray-600">
                      Your information is secure and will only be used to confirm your viewing
                    </div>
                  </div>

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
                      className="flex-1 h-14 rounded-xl font-semibold text-white"
                      style={{ backgroundColor: accentColor || primaryColor }}
                      loading={isProcessing}
                    >
                      Confirm Booking
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>

          <div>
            <div className="p-6 rounded-2xl border sticky top-6 bg-white border-gray-200">
              <h3 className="font-semibold mb-4 text-[18px] text-gray-900">Booking Summary</h3>

              {getPropertyImage() ? (
                <div className="aspect-video rounded-xl overflow-hidden mb-4">
                  <img
                    src={getPropertyImage() || ""}
                    alt={booking.property.title || booking.property.name || "Property"}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : null}

              <h4 className="font-semibold mb-1 text-gray-900">
                {booking.property.title || booking.property.name || "Property"}
              </h4>
              <p className="text-sm mb-6 text-gray-600">
                {booking.property.city || ""}
                {booking.property.state ? `, ${booking.property.state}` : ""}
              </p>

              <div className="space-y-3 text-sm">
                {date && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Date:</span>
                    <span className="font-medium text-gray-900">{format(date, "MMM dd, yyyy")}</span>
                  </div>
                )}
                {selectedTime && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Time:</span>
                    <span className="font-medium text-gray-900">{selectedTime}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Duration:</span>
                  <span className="font-medium text-gray-900">60 minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Room fee</span>
                  <span>{formatCurrency(booking.roomFee || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cleaning fee</span>
                  <span>{formatCurrency(booking.cleaningFee || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Service fee</span>
                  <span>{formatCurrency(booking.serviceFee || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Security deposit</span>
                  <span>{formatCurrency(booking.securityDeposit || 0)}</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between font-semibold text-gray-900">
                  <span>Total ({nights} nights)</span>
                  <span>{formatCurrency(amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
