"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "react-query";
import {
  Building,
  Mail,
  MapPin,
  BadgeCheck,
  Palette,
  ExternalLink,
} from "lucide-react";
import { realtorService } from "@/services/realtors";
import { Card, Button, Loading } from "@/components/ui";

export default function BusinessProfileManager() {
  const router = useRouter();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["realtor-profile"],
    queryFn: () => realtorService.getProfile(),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Loading />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Business Profile
            </h1>
            <p className="text-gray-600 mb-6">
              We couldn’t load your business profile. Please try again or edit
              your details in settings.
            </p>
            <Button onClick={() => router.push("/settings")}>
              Open Settings
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="p-8 border border-gray-200 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
              <Building className="w-7 h-7 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {profile.businessName}
              </h1>
              <p className="text-gray-600 mt-1">
                {profile.tagline || "Stayza Pro business profile"}
              </p>
            </div>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => router.push("/settings")}
            >
              Edit in Settings
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Business Details
            </h2>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-gray-400" />
                <span>{profile.slug}.stayza.pro</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{profile.businessEmail || profile.user?.email}</span>
              </div>
              {profile.businessAddress && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>{profile.businessAddress}</span>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 border border-gray-200 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Verification Status
            </h2>
            <div className="flex items-center gap-3 text-sm text-gray-700">
              <BadgeCheck className="w-5 h-5 text-green-600" />
              <span>
                CAC status:{" "}
                <span className="font-semibold">{profile.cacStatus}</span>
              </span>
            </div>
            {profile.corporateRegNumber && (
              <p className="text-xs text-gray-500 mt-3">
                RC: {profile.corporateRegNumber}
              </p>
            )}
          </Card>

          <Card className="p-6 border border-gray-200 shadow-sm md:col-span-2">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Brand Colors
            </h2>
            <div className="flex flex-wrap gap-4 items-center text-sm text-gray-700">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-gray-400" />
                <span>Primary</span>
                <span
                  className="w-5 h-5 rounded-full border border-gray-200"
                  style={{ backgroundColor: profile.primaryColor }}
                />
                <span className="text-xs text-gray-500">
                  {profile.primaryColor}
                </span>
              </div>
              {profile.secondaryColor && (
                <div className="flex items-center gap-2">
                  <span>Secondary</span>
                  <span
                    className="w-5 h-5 rounded-full border border-gray-200"
                    style={{ backgroundColor: profile.secondaryColor }}
                  />
                  <span className="text-xs text-gray-500">
                    {profile.secondaryColor}
                  </span>
                </div>
              )}
              {profile.accentColor && (
                <div className="flex items-center gap-2">
                  <span>Accent</span>
                  <span
                    className="w-5 h-5 rounded-full border border-gray-200"
                    style={{ backgroundColor: profile.accentColor }}
                  />
                  <span className="text-xs text-gray-500">
                    {profile.accentColor}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {profile.description && (
            <Card className="p-6 border border-gray-200 shadow-sm md:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                About Your Business
              </h2>
              <p className="text-sm text-gray-700 leading-relaxed">
                {profile.description}
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
