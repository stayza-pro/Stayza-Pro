"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../../store/authStore";
import { ModernDashboardLayout } from "../../../components/layout/ModernDashboardLayout";
import { useRouter } from "next/navigation";

interface RealtorBranding {
  businessName: string;
  primaryColor: string;
  secondaryColor?: string;
  logoUrl?: string;
}

export default function RealtorPropertiesPage() {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [realtorBranding, setRealtorBranding] =
    useState<RealtorBranding | null>(null);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "REALTOR")) {
      router.push("/realtor/login");
    }
  }, [isAuthenticated, isLoading, user?.role, router]);

  // Fetch realtor branding data
  useEffect(() => {
    const fetchRealtorBranding = async () => {
      if (user?.role === "REALTOR") {
        try {
          const response = await fetch("/api/realtors/profile", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          });

          if (response.ok) {
            const data = await response.json();
            const realtor = data.data?.realtor;

            if (realtor) {
              setRealtorBranding({
                businessName: realtor.businessName || "My Business",
                primaryColor: realtor.primaryColor || "#0066CC",
                secondaryColor: realtor.secondaryColor || "#10B981",
                logoUrl: realtor.logoUrl,
              });
            }
          }
        } catch (error) {
          console.error("Failed to fetch realtor branding:", error);
          setRealtorBranding({
            businessName: user.firstName + "'s Properties",
            primaryColor: "#0066CC",
          });
        }
      }
    };

    if (user?.role === "REALTOR") {
      fetchRealtorBranding();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading Your Properties...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || user.role !== "REALTOR") {
    return null;
  }

  const branding = realtorBranding || {
    businessName: user.firstName + "'s Properties",
    primaryColor: "#0066CC",
  };

  return (
    <ModernDashboardLayout
      currentUser={user}
      activeRoute="properties"
      onRouteChange={() => {}}
      branding={branding}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Properties</h1>
            <p className="text-gray-600">
              Manage your property listings for {branding.businessName}
            </p>
          </div>
          <button
            className="px-4 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: branding.primaryColor }}
          >
            Add New Property
          </button>
        </div>

        {/* Properties content would go here */}
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">Your properties will appear here.</p>
        </div>
      </div>
    </ModernDashboardLayout>
  );
}
