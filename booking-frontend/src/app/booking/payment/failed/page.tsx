import { Suspense } from "react";
import PaymentFailedContent from "./_content";

export default function PaymentFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">
          Loading payment status…
        </div>
      }
    >
      <PaymentFailedContent />
    </Suspense>
  );
}
