"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "@/components/ui";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan");

  useEffect(() => {
    // Redirect old registration URLs to new realtor registration
    if (plan) {
      router.replace(`/register/realtor?plan=${plan}`);
    } else {
      router.replace("/register/realtor");
    }
  }, [router, plan]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to registration...</p>
      </Card>
    </div>
  );
}
