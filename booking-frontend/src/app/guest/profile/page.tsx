"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User,
  Calendar,
  HelpCircle,
  LogOut,
  AlertCircle,
  MapPin,
} from "lucide-react";
import { Card, Button, Input } from "@/components/ui";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { Footer } from "@/components/guest/sections";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";

export default function GuestProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const {
    brandColor: primaryColor, // Lighter touch - primary for CTAs and key elements
    secondaryColor, // Lighter touch - secondary for icons and accents
    accentColor, // Lighter touch - accent for highlights
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding();
  const [authChecked, setAuthChecked] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchLocation, setSearchLocation] = useState("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    address: "",
    city: "",
    country: "",
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Mark auth as checked once we've gotten a result
  useEffect(() => {
    if (!isLoading && (isAuthenticated || !authChecked)) {
      setAuthChecked(true);
    }
  }, [isLoading, isAuthenticated, authChecked]);

  // Initialize form data when user loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth
          ? new Date(user.dateOfBirth).toISOString().split("T")[0]
          : "",
        address: user.address || "",
        city: user.city || "",
        country: user.country || "",
      });
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (authChecked && !isLoading && !isAuthenticated) {
      router.push("/guest/login?redirect=/guest/profile");
    }
  }, [isLoading, isAuthenticated, authChecked, router]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setShowUserMenu(false);
    window.location.href = "/";
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = () => {
    // TODO: Implement profile update API call
    console.log("Saving profile:", formData);
  };

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion
    console.log("Deleting account");
    setShowDeleteModal(false);
  };

  // Show loading state while checking authentication
  if (!authChecked || isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-gray-100 rounded w-1/3"></div>
            <div className="h-64 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
          .light-mode-force,
          .light-mode-force * {
            color-scheme: light !important;
          }
          .light-mode-force .dark\\:bg-gray-800 {
            background-color: white !important;
          }
          .light-mode-force .dark\\:bg-gray-700 {
            background-color: white !important;
          }
          .light-mode-force .dark\\:border-gray-700 {
            border-color: #e5e7eb !important;
          }
          .light-mode-force .dark\\:border-gray-600 {
            border-color: #d1d5db !important;
          }
          .light-mode-force .dark\\:text-white {
            color: #111827 !important;
          }
          .light-mode-force .dark\\:text-gray-300 {
            color: #374151 !important;
          }
          .light-mode-force .dark\\:text-gray-400 {
            color: #6b7280 !important;
          }
        `,
        }}
      />
      <div className="light-mode-force min-h-screen bg-gray-50 flex flex-col">
        <GuestHeader
          currentPage="profile"
          searchPlaceholder="Search location..."
        />

        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
          {/* Page Header */}
          <div className="mb-10 bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  My Profile
                </h1>
                <p className="text-sm text-gray-500">Powered by Stayza Pro</p>
              </div>
            </div>

            {/* Divider with brand color accent */}
            <div
              className="h-1 w-24 rounded"
              style={{ backgroundColor: primaryColor }} // Lighter touch - primary for accent divider
            ></div>
          </div>

          {/* Profile Content */}
          <div className="space-y-6">
            {/* Personal Information Card */}
            <Card className="p-6 border border-gray-200 bg-white shadow-none">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Personal Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <Input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className="w-full bg-gray-50 border-gray-300"
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <Input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className="w-full bg-gray-50 border-gray-300"
                    disabled
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full bg-gray-50 border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full bg-white border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <Input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      handleInputChange("dateOfBirth", e.target.value)
                    }
                    className="w-full bg-white border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <Input
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    className="w-full bg-white border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <Input
                    type="text"
                    value={formData.country}
                    onChange={(e) =>
                      handleInputChange("country", e.target.value)
                    }
                    className="w-full bg-white border-gray-300"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <Input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      handleInputChange("address", e.target.value)
                    }
                    className="w-full bg-white border-gray-300"
                  />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <Button
                  onClick={handleSaveProfile}
                  className="text-white border-0 shadow-none"
                  style={{ backgroundColor: primaryColor }} // Lighter touch - primary for save CTA
                >
                  Save Changes
                </Button>
              </div>
            </Card>

            {/* Delete Account Section */}
            <Card className="p-6 border border-gray-200 bg-gray-50 shadow-none">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    Delete Account
                  </h3>
                  <p className="text-sm text-gray-600">
                    Permanently delete your account and all data.
                  </p>
                </div>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="text-sm font-medium text-red-600 hover:text-red-700 hover:underline"
                >
                  Delete Account
                </button>
              </div>
            </Card>
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <Card className="max-w-md w-full p-6 border border-gray-200 bg-white shadow-none">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Delete Account
                    </h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Are you sure you want to delete your account? This action
                      cannot be undone. All your data, bookings, and reviews
                      will be permanently deleted.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end">
                  <Button
                    onClick={() => setShowDeleteModal(false)}
                    variant="outline"
                    className="border-gray-300 text-gray-700 shadow-none"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700 text-white border-0 shadow-none"
                  >
                    Delete Account
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </main>

        {/* Footer - Same as Landing Page */}
        <Footer
          realtorName={realtorName}
          tagline={tagline}
          logo={logoUrl}
          description={description}
          primaryColor={primaryColor}
        />
      </div>
    </>
  );
}
