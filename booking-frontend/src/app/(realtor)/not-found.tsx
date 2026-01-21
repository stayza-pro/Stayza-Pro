"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { buildMainDomainUrl } from "@/utils/domains";

export default function RealtorNotFound() {
  const router = useRouter();
  useEffect(() => {
    const handleNotFound = async () => {
      // Redirect to main domain marketing home
      window.location.replace(buildMainDomainUrl("/en"));
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
        <p className="text-gray-600">Redirecting to Stayza Pro...</p>
      </div>
    </div>
  );
}
