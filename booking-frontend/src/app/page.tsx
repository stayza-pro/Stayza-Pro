"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRealtorSubdomain, isAdminSubdomain } from "@/utils/subdomain";

// Root page router - directs based on subdomain
export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const subdomain = getRealtorSubdomain();
    const isAdmin = isAdminSubdomain();

    // Admin subdomain -> admin login
    if (isAdmin) {
      router.push("/admin/login");
      return;
    }

    // All domains -> marketing site
    // Users can navigate to guest features from there
    router.push("/en");
  }, [router]);

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}
