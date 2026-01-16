"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getSubdomainInfo } from "@/utils/subdomain";
import { buildMainDomainUrl } from "@/utils/domains";

export default function RealtorNotFound() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const handleNotFound = async () => {
      setIsRedirecting(true);

      // Get subdomain info
      const tenantInfo = getSubdomainInfo();

      // Log out the user
      try {
        const { useAuthStore } = await import("@/store/authStore");
        await useAuthStore.getState().logout();
      } catch (error) {
        
      }

      // Redirect to main domain realtor login
      window.location.href = buildMainDomainUrl("/realtor/login");
    };

    handleNotFound();
  }, []);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Page Not Found
        </h2>
        <p className="text-gray-600">Redirecting to login...</p>
      </div>
    </div>
  );
}
