"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PropertyDetails } from "@/components/property/PropertyDetails";
import { BookingForm } from "@/components/booking/BookingForm";
import { FlutterwaveCheckout, PaymentStatus } from "@/components/payment";
import { Button, Card, Loading } from "@/components/ui";
import { useProperty } from "@/hooks/useProperties";
import { useAuthStore } from "@/store/authStore";
import { bookingService, paymentService, serviceUtils } from "@/services";
import type { Booking, BookingFormData, Payment, Property } from "@/types";

type RawImage =
  | string
  | {
      url?: unknown;
      imageUrl?: unknown;
    }
  | null
  | undefined;

type RawRealtorCandidate = {
  id?: string;
  userId?: string;
  firstName?: string;
  lastName?: string;
  surname?: string;
  name?: string;
  businessName?: string;
  avatar?: string;
  logoUrl?: string;
  photoUrl?: string;
};

type RawProperty = Partial<
  Omit<Property, "images" | "pricePerNight" | "realtor"> & {
    realtor: Property["realtor"];
  }
> & {
  images?: unknown;
  pricePerNight?: unknown;
  realtor?: RawRealtorCandidate;
  hostId?: string;
  realtorId?: string;
  realtor?: RawRealtorCandidate & { user?: RawRealtorCandidate };
};

interface PropertyDetailClientProps {
  propertyId: string;
}

const normalizeImages = (images: RawProperty["images"]): string[] => {
  if (!images) {
    return [];
  }

  const imageArray = Array.isArray(images) ? images : [images];

  return imageArray
    .map((image) => {
      const rawImage = image as RawImage;
      if (typeof rawImage === "string") {
        return rawImage;
      }

      if (rawImage && typeof rawImage === "object") {
        const { url, imageUrl } = rawImage;
        if (typeof url === "string") {
          return url;
        }
        if (typeof imageUrl === "string") {
          return imageUrl;
        }
      }

      return null;
    })
    .filter((value): value is string => Boolean(value));
};

const normalizeProperty = (rawProperty: RawProperty): Property => {
  const images = normalizeImages(rawProperty.images);

  const hostCandidate: RawRealtorCandidate | undefined =
    rawProperty.realtor || rawProperty.realtor?.user || rawProperty.realtor;

  const realtor = {
    id:
      hostCandidate?.id ||
      hostCandidate?.userId ||
      rawProperty.hostId ||
      rawProperty.realtorId ||
      "Realtor",
    firstName:
      hostCandidate?.firstName ||
      hostCandidate?.name ||
      hostCandidate?.businessName ||
      "Realtor",
    lastName: hostCandidate?.lastName || hostCandidate?.surname || "",
    avatar:
      hostCandidate?.avatar ||
      hostCandidate?.logoUrl ||
      hostCandidate?.photoUrl ||
      undefined,
  };

  const parsedPrice = Number(rawProperty.pricePerNight ?? 0);

  return {
    id: rawProperty.id ?? "property",
    title: rawProperty.title ?? "Property",
    description: rawProperty.description ?? "",
    type: rawProperty.type ?? "APARTMENT",
    pricePerNight: Number.isFinite(parsedPrice) ? parsedPrice : 0,
    currency: rawProperty.currency ?? "USD",
    maxGuests: rawProperty.maxGuests ?? 1,
    bedrooms: rawProperty.bedrooms ?? 1,
    bathrooms: rawProperty.bathrooms ?? 1,
    amenities: Array.isArray(rawProperty.amenities)
      ? rawProperty.amenities
      : [],
    images,
    address: rawProperty.address ?? "",
    city: rawProperty.city ?? "",
    state: rawProperty.state ?? "",
    country: rawProperty.country ?? "",
    latitude: rawProperty.latitude ?? undefined,
    longitude: rawProperty.longitude ?? undefined,
    isActive: rawProperty.isActive ?? true,
    status: rawProperty.status ?? undefined,
    createdAt: rawProperty.createdAt ?? new Date().toISOString(),
    updatedAt: rawProperty.updatedAt ?? new Date().toISOString(),
    realtor,
    hostId: rawProperty.hostId ?? rawProperty.realtorId ?? realtor.id,
    averageRating: rawProperty.averageRating ?? undefined,
    reviewCount: rawProperty.reviewCount ?? undefined,
  };
};

const summarizeBooking = (booking: Booking, property: Property) => {
  const checkInDate = new Date(booking.checkInDate).toLocaleDateString();
  const checkOutDate = new Date(booking.checkOutDate).toLocaleDateString();
  const nights = Math.ceil(
    (new Date(booking.checkOutDate).getTime() -
      new Date(booking.checkInDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return {
    checkInDate,
    checkOutDate,
    nights,
    guests: booking.totalGuests,
    total: booking.totalPrice,
    currency: booking.currency,
    bookingId: booking.id,
    propertyTitle: property.title,
  };
};

const PropertyDetailClient = ({ propertyId }: PropertyDetailClientProps) => {
  const router = useRouter();
  const bookingFormRef = useRef<HTMLDivElement | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [selectedGateway, setSelectedGateway] = useState<"flutterwave" | null>(
    null
  );
  const [flutterwaveSession, setFlutterwaveSession] = useState<{
    authorizationUrl: string;
    reference: string;
    paymentId: string;
  } | null>(null);
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const [paymentStage, setPaymentStage] = useState<
    "idle" | "processing" | "success" | "failed" | "pending" | "refunded"
  >("idle");
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [paymentRecord, setPaymentRecord] = useState<Payment | null>(null);
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);

  const { data, isLoading, isError, error, refetch } = useProperty(propertyId);
  const { isAuthenticated, user } = useAuthStore();

  const property = useMemo(() => {
    if (!data) return null;
    return normalizeProperty(data);
  }, [data]);

  const mapPaymentStatus = (status?: Payment["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "success" as const;
      case "FAILED":
        return "failed" as const;
      case "PARTIALLY_REFUNDED":
      case "REFUNDED":
        return "refunded" as const;
      case "PENDING":
        return "pending" as const;
      default:
        return "processing" as const;
    }
  };

  const refreshBooking = async (bookingId: string) => {
    if (!bookingId) return null;
    try {
      const updated = await bookingService.getBooking(bookingId);
      setActiveBooking(updated);
      return updated;
    } catch (err) {
      console.error("Failed to refresh booking", err);
      return null;
    }
  };

  const hydratePaymentRecord = async (paymentId: string) => {
    if (!paymentId) return null;
    try {
      const payment = await paymentService.getPayment(paymentId);
      setPaymentRecord(payment);
      setPaymentStage(mapPaymentStatus(payment.status));
      return payment;
    } catch (err) {
      const message = serviceUtils.extractErrorMessage(err);
      setPaymentError(message);
      toast.error(message);
      return null;
    }
  };

  const resetPaymentSelection = () => {
    setSelectedGateway(null);
    setFlutterwaveSession(null);
    setActivePaymentId(null);
    setPaymentStage("idle");
    setPaymentError(null);
    setPaymentRecord(null);
  };

  const handleSelectGateway = async (gateway: "flutterwave") => {
    if (!activeBooking) {
      toast.error("Create a reservation before choosing a payment method.");
      return;
    }

    setSelectedGateway(gateway);
    setPaymentError(null);
  };

  const finalizePayment = async (paymentId: string) => {
    if (!paymentId) return;
    setPaymentStage("processing");
    setPaymentError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1400));
      const payment = await hydratePaymentRecord(paymentId);
      if (payment) {
        await refreshBooking(payment.booking?.id || activeBooking?.id || "");
      } else {
        setPaymentStage("pending");
      }
      setFlutterwaveSession(null);
    } catch (err) {
      const message = serviceUtils.extractErrorMessage(err);
      setPaymentError(message);
      setPaymentStage("pending");
    }
  };

  const handleFlutterwaveError = (message: string) => {
    setPaymentError(message);
    setPaymentStage("failed");
    toast.error(message);
  };

  const handleFlutterwaveInitialized = async (details: {
    paymentId: string;
    reference?: string;
    paymentStatus?: Payment["status"];
  }) => {
    setActivePaymentId(details.paymentId);
    if (details.paymentStatus) {
      setPaymentStage(mapPaymentStatus(details.paymentStatus));
      if (details.paymentStatus === "COMPLETED") {
        toast.success("This booking is already paid via Flutterwave.");
        const payment = await hydratePaymentRecord(details.paymentId);
        if (payment) {
          await refreshBooking(payment.booking?.id || activeBooking?.id || "");
        }
      }
    }
  };

  const handleDownloadReceipt = async () => {
    const paymentId = paymentRecord?.id || activePaymentId;
    if (!paymentId) {
      toast.error("No payment receipt available yet.");
      return;
    }

    try {
      const blob = await paymentService.downloadReceipt(paymentId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const message = serviceUtils.extractErrorMessage(err);
      toast.error(message);
    }
  };

  const handlePaymentRetry = async () => {
    setPaymentStage("idle");
    setPaymentError(null);
    resetPaymentSelection();
  };

  const handlePaymentGoBack = () => {
    resetPaymentSelection();
  };

  const handleBookNow = () => {
    if (bookingFormRef.current) {
      bookingFormRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  useEffect(() => {
    if (!activeBooking?.payment) {
      return;
    }

    const bookingPayment = activeBooking.payment;

    setPaymentRecord((prev) => prev ?? bookingPayment);
    setActivePaymentId((prev) => prev ?? bookingPayment.id);

    if (paymentStage === "idle") {
      setPaymentStage(mapPaymentStatus(bookingPayment.status));
    }
  }, [activeBooking?.payment, paymentStage]);

  const handleBookingSubmit = async (formData: BookingFormData) => {
    if (!property) {
      return;
    }

    if (!isAuthenticated) {
      toast.error("Please log in to book this property.");
      router.push(`/auth/login?redirect=/properties/${propertyId}`);
      return;
    }

    setIsSubmitting(true);
    setBookingMessage(null);

    try {
      const availability = await bookingService.checkAvailability(
        propertyId,
        formData.checkInDate,
        formData.checkOutDate
      );

      if (!availability.available) {
        const conflictsList = availability.conflicts ?? [];
        const conflictsText = conflictsList.join(", ");
        const message =
          conflictsList.length > 0
            ? `Property is unavailable for selected dates. Conflicts on: ${conflictsText}`
            : "Property is unavailable for selected dates. Please choose different dates.";
        setBookingMessage(message);
        toast.error(message);
        return;
      }

      const newBooking = await bookingService.createBooking(formData);
      resetPaymentSelection();
      setActiveBooking(newBooking);
      setBookingMessage(
        "Reservation created successfully. Complete payment to confirm your stay."
      );
      toast.success(
        "Booking created! Complete payment to finalize your reservation."
      );
    } catch (err: unknown) {
      const message = serviceUtils.extractErrorMessage(err);
      setBookingMessage(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetBooking = () => {
    setActiveBooking(null);
    setBookingMessage(null);
    resetPaymentSelection();
    if (bookingFormRef.current) {
      bookingFormRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-gray-50">
          <Loading size="lg" />
        </main>
        <Footer />
      </div>
    );
  }

  if (isError || !property) {
    const message =
      error instanceof Error ? error.message : "Unable to load property.";

    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 bg-gray-50">
          <div className="max-w-3xl mx-auto px-4 py-16">
            <Card className="p-8 text-center space-y-4">
              <h1 className="text-2xl font-semibold text-gray-900">
                Property not available
              </h1>
              <p className="text-gray-600">{message}</p>
              <div className="flex justify-center space-x-3">
                <Button onClick={() => refetch()} variant="primary">
                  Try again
                </Button>
                <Link href="/properties" className="inline-block">
                  <Button variant="outline">Back to properties</Button>
                </Link>
              </div>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const bookingSummary = activeBooking
    ? summarizeBooking(activeBooking, property)
    : null;

  const resolvedPayment = paymentRecord ?? activeBooking?.payment ?? null;
  const effectivePaymentStage =
    paymentStage === "idle" && resolvedPayment
      ? mapPaymentStatus(resolvedPayment.status)
      : paymentStage;
  const paymentSettled =
    effectivePaymentStage === "success" || effectivePaymentStage === "refunded";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
          <PropertyDetails property={property} onBookNow={handleBookNow} />

          <div ref={bookingFormRef} className="space-y-6">
            {bookingSummary ? (
              <Card className="p-6 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">
                      Booking created successfully
                    </h2>
                    <p className="text-gray-600 mt-2">
                      Reference ID:{" "}
                      <span className="font-mono">
                        #{bookingSummary.bookingId.slice(-8).toUpperCase()}
                      </span>
                    </p>
                    <div className="mt-4 space-y-1 text-sm text-gray-600">
                      <p>
                        Stay: {bookingSummary.checkInDate} –{" "}
                        {bookingSummary.checkOutDate} ({bookingSummary.nights}{" "}
                        {bookingSummary.nights === 1 ? "night" : "nights"})
                      </p>
                      <p>Guests: {bookingSummary.guests}</p>
                      <p>
                        Total: {bookingSummary.currency}{" "}
                        {Number(bookingSummary.total).toFixed(2)}
                      </p>
                    </div>
                    {bookingMessage && (
                      <p className="mt-4 text-sm text-blue-600">
                        {bookingMessage}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="primary"
                      onClick={() => router.push("/dashboard")}
                    >
                      View my dashboard
                    </Button>
                    <Button variant="outline" onClick={handleResetBooking}>
                      Make another reservation
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-6 space-y-5">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Complete your payment
                    </h3>
                    <p className="text-sm text-gray-600">
                      Choose a payment method below to confirm your stay.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant={
                        selectedGateway === "flutterwave"
                          ? "primary"
                          : "outline"
                      }
                      onClick={() => handleSelectGateway("flutterwave")}
                      disabled={paymentSettled}
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Pay with Flutterwave (Cards, Bank Transfer, USSD)
                    </Button>
                  </div>

                  {selectedGateway === "flutterwave" && !paymentSettled && (
                    <div className="space-y-4">
                      {isInitializingPayment && (
                        <div className="flex items-center space-x-3 text-sm text-gray-600">
                          <Loading size="sm" />
                          <span>Preparing secure card checkout...</span>
                        </div>
                      )}

                      {!isInitializingPayment && !stripeSession && (
                        <p className="text-sm text-gray-600">
                          Click “Pay with card” to generate a secure Stripe
                          checkout for this booking.
                        </p>
                      )}

                      {stripeSession && (
                        <FlutterwaveCheckout
                          bookingId={activeBooking!.id}
                          amount={Number(activeBooking!.totalPrice)}
                          currency={activeBooking!.currency}
                          email={user?.email || ""}
                          customerName={
                            user
                              ? `${user.firstName} ${user.lastName}`.trim()
                              : undefined
                          }
                          customerPhone={user?.phone}
                          description={`Booking payment for ${property.title}`}
                          onInitialized={handleFlutterwaveInitialized}
                          onError={handleFlutterwaveError}
                          onCancel={handlePaymentGoBack}
                        />
                      )}
                    </div>
                  )}

                  {(effectivePaymentStage !== "idle" || resolvedPayment) && (
                    <PaymentStatus
                      payment={resolvedPayment || undefined}
                      status={
                        effectivePaymentStage === "idle"
                          ? "pending"
                          : effectivePaymentStage
                      }
                      amount={
                        resolvedPayment?.amount ||
                        Number(activeBooking!.totalPrice)
                      }
                      currency={
                        resolvedPayment?.currency || activeBooking!.currency
                      }
                      paymentMethod={resolvedPayment?.method}
                      errorMessage={paymentError || undefined}
                      onRetry={
                        !paymentSettled && effectivePaymentStage === "failed"
                          ? handlePaymentRetry
                          : undefined
                      }
                      onDownloadReceipt={
                        paymentSettled ? handleDownloadReceipt : undefined
                      }
                      onGoBack={
                        !paymentSettled &&
                        effectivePaymentStage !== "processing"
                          ? handlePaymentGoBack
                          : undefined
                      }
                      onContinue={
                        paymentSettled
                          ? () => router.push("/dashboard")
                          : undefined
                      }
                    />
                  )}
                </div>
              </Card>
            ) : (
              <Card className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:space-x-10 space-y-6 lg:space-y-0">
                  <div className="flex-1">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      Plan your stay
                    </h2>
                    <p className="text-gray-600 mb-6">
                      Select your travel dates and enter guest details to
                      reserve this property.
                    </p>
                    <BookingForm
                      property={property}
                      onSubmit={handleBookingSubmit}
                      isLoading={isSubmitting}
                    />
                    {bookingMessage && (
                      <p className="mt-4 text-sm text-red-600">
                        {bookingMessage}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PropertyDetailClient;
