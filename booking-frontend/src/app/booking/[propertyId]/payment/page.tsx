import { Suspense } from "react";
import PaymentPageContent from "./_content";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";

function PaymentFallback() {
  return (
    <div className="min-h-screen bg-gray-50">
      <GuestHeader
        currentPage="browse"
        searchPlaceholder="Search location..."
      />
      <div className="max-w-[1100px] mx-auto px-6 py-12 animate-pulse space-y-6">
        <div className="h-10 w-64 bg-gray-200 rounded" />
        <div className="h-96 bg-gray-200 rounded-2xl" />
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<PaymentFallback />}>
      <PaymentPageContent />
    </Suspense>
  );
}
