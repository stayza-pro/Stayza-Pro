import { Suspense } from "react";
import { Loading } from "@/components/ui";
import PaymentSuccessContent from "./_content";

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loading size="lg" />
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
