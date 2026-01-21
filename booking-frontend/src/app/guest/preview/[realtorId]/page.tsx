"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RealtorWebsite } from "@/components/guest/RealtorWebsite";
import { brandingService, RealtorBranding } from "@/services/branding";
import { buildMainDomainUrl } from "@/utils/domains";
import { Loading } from "@/components/ui";

export default function RealtorPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const [branding, setBranding] = useState<RealtorBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const subdomain = useMemo(() => {
    const raw = params.realtorId;
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw)) return raw[0];
    return "";
  }, [params.realtorId]);

  useEffect(() => {
    if (!subdomain) {
      router.replace(buildMainDomainUrl("/en"));
      return;
    }

    let isActive = true;
    setIsLoading(true);

    brandingService
      .getBrandingBySubdomain(subdomain)
      .then((data) => {
        if (!isActive) return;
        setBranding(data);
      })
      .catch(() => {
        if (!isActive) return;
        router.replace(buildMainDomainUrl("/en"));
      })
      .finally(() => {
        if (!isActive) return;
        setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [subdomain, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loading />
      </div>
    );
  }

  if (!branding || !branding.id) {
    return null;
  }

  return (
    <RealtorWebsite
      data={{
        fullName: branding.businessName,
        businessEmail: branding.businessEmail,
        agencyName: branding.businessName,
        customSubdomain: branding.subdomain,
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        accentColor: branding.accentColor,
        userId: branding.userId,
      }}
      logoPreview={branding.logoUrl || branding.logo}
      language="en"
      currency="NGN"
      realtorId={branding.id}
    />
  );
}
