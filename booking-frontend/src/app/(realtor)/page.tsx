"use client";

import React from "react";
import { getSubdomainInfo } from "@/utils/subdomain";
import { useBranding } from "@/hooks/useBranding";

export default function RealtorPublicPage() {
  const tenantInfo = getSubdomainInfo();
  const { branding } = useBranding();

  // This is the public-facing page for the realtor's properties
  // Guests can view properties without logging in

  const brandColors = {
    primary: branding?.primaryColor || "#3B82F6",
    secondary: branding?.secondaryColor || "#1E40AF",
    accent: branding?.accentColor || "#F59E0B",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              {branding?.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={branding.businessName}
                  className="h-8 w-auto"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded"
                  style={{ backgroundColor: brandColors.primary }}
                />
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {branding?.businessName ||
                    `${tenantInfo.subdomain}'s Properties`}
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/guest/login"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm"
              >
                Guest Login
              </a>
              <a
                href="/guest/register"
                className="text-white px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
                style={{ backgroundColor: brandColors.primary }}
              >
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="relative bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
              Welcome to {branding?.businessName || `${tenantInfo.subdomain}'s`}
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Discover premium properties and book your perfect stay with ease.
            </p>
            <div className="mt-8">
              <p className="text-sm text-gray-400">
                You're viewing:{" "}
                <span className="font-medium">
                  {tenantInfo.subdomain}.localhost:3000
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">
          Available Properties
        </h2>

        {/* Sample Property Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((property) => (
            <div
              key={property}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                <div className="w-full h-48 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <span className="text-gray-500">Property Image</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Premium Property #{property}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Beautiful property with modern amenities and great location.
                </p>
                <div className="flex items-center justify-between">
                  <span
                    className="text-2xl font-bold"
                    style={{ color: brandColors.primary }}
                  >
                    $150
                    <span className="text-sm font-normal text-gray-500">
                      /night
                    </span>
                  </span>
                  <button
                    className="px-4 py-2 rounded-md text-white text-sm font-medium hover:opacity-90"
                    style={{ backgroundColor: brandColors.primary }}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {branding?.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={branding.businessName}
                  className="h-6 w-auto"
                />
              ) : (
                <div
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: brandColors.primary }}
                />
              )}
              <span className="text-gray-600">
                © 2025{" "}
                {branding?.businessName ||
                  `${tenantInfo.subdomain}'s Properties`}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              Powered by{" "}
              <span className="font-medium text-gray-700">Stayza</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
