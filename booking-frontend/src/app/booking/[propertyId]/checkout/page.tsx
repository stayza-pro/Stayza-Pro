import { Suspense } from "react";
import BookingCheckoutContent from "./_content";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";

function CheckoutFallback() {
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

export default function BookingCheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <BookingCheckoutContent />
    </Suspense>
  );
}
