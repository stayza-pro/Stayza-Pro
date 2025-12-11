"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  User,
  Mail,
  Phone,
  Save,
  Upload,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Card, Button, Input } from "@/components/ui";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { Footer } from "@/components/guest/sections";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { authService } from "@/services/auth";
import toast from "react-hot-toast";

export default function GuestProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const {
    brandColor: primaryColor,
    realtorName,
    logoUrl,
    tagline,
    description,
  } = useRealtorBranding();
  const [authChecked, setAuthChecked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

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
      });

      // Set profile image from user avatar
      if (user.avatar) {
        setProfileImage(user.avatar);
      }
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (authChecked && !isLoading && !isAuthenticated) {
      router.push("/guest/login?redirect=/guest/profile");
    }
  }, [isLoading, isAuthenticated, authChecked, router]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setIsSaving(true);
    try {
      // Prepare FormData for API (supports both regular fields and file upload)
      const formDataToSend = new FormData();

      // Add text fields
      if (formData.firstName)
        formDataToSend.append("firstName", formData.firstName);
      if (formData.lastName)
        formDataToSend.append("lastName", formData.lastName);
      if (formData.phone) formDataToSend.append("phone", formData.phone);

      // Add avatar file if selected
      if (avatarFile) {
        formDataToSend.append("avatar", avatarFile);
      }

      // Call API to update profile
      const updatedUser = await authService.updateProfile(formDataToSend);

      // Update localStorage with new user data
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const mergedUser = { ...parsedUser, ...updatedUser };
        localStorage.setItem("user", JSON.stringify(mergedUser));
      }

      // Update profile image if avatar was uploaded
      if (avatarFile && updatedUser.avatar) {
        setProfileImage(updatedUser.avatar);
        setAvatarFile(null); // Clear the pending file
      }

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      console.error("Profile update error:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (2MB for API limit)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Please upload a JPEG, PNG, or WebP image");
      return;
    }

    // Store the file to be uploaded with the profile update
    setAvatarFile(file);

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    toast.success("Profile picture selected. Click 'Save Changes' to upload.");
  };

  const handleDeleteAccount = () => {
    // TODO: Implement account deletion API call
    toast.success("Account deletion requested");
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
    <div
      className="min-h-screen bg-gray-50 flex flex-col"
      style={{ colorScheme: "light" }}
    >
      <GuestHeader
        currentPage="profile"
        searchPlaceholder="Search location..."
      />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Header with Brand Color */}
        <div
          className="relative rounded-3xl overflow-hidden mb-12 shadow-lg"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)`,
          }}
        >
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-32 h-32 bg-white rounded-full blur-2xl" />
          </div>

          <div className="relative px-8 py-12">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-6">
                {/* Profile Picture */}
                <div className="relative group">
                  <div className="w-28 h-28 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm border-4 border-white/30 shadow-xl">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-white/20">
                        <User size={48} className="text-white" />
                      </div>
                    )}
                  </div>
                  <label
                    htmlFor="profile-upload"
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity duration-200"
                  >
                    <Upload size={24} className="text-white" />
                  </label>
                  <input
                    id="profile-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>

                <div className="text-white">
                  <h1 className="text-4xl font-bold mb-2">
                    {user?.firstName} {user?.lastName}
                  </h1>
                  <p className="text-white/80 text-lg mb-3 flex items-center gap-2">
                    <Mail size={18} />
                    {user?.email}
                  </p>
                  <div className="flex items-center gap-2 text-sm">
                    <div className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-sm border border-white/30">
                      <CheckCircle2 size={16} className="inline mr-2" />
                      Verified Guest
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information Card */}
            <Card
              className="p-8 border-2 border-gray-100 !bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
            >
              <div className="flex items-center gap-3 mb-6">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}15` }}
                >
                  <User size={20} style={{ color: primaryColor }} />
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Personal Information
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    First Name
                  </label>
                  <Input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    className="w-full !bg-gray-50 border-gray-200 focus:border-2 rounded-xl transition-all duration-200"
                    style={{ backgroundColor: "#f9fafb", color: "#111827" }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = primaryColor;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "";
                    }}
                    disabled
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Last Name
                  </label>
                  <Input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    className="w-full !bg-gray-50 border-gray-200 rounded-xl"
                    style={{ backgroundColor: "#f9fafb", color: "#111827" }}
                    disabled
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Mail size={16} />
                    Email Address
                  </label>
                  <Input
                    type="email"
                    value={formData.email}
                    disabled
                    className="w-full !bg-gray-50 border-gray-200 rounded-xl"
                    style={{ backgroundColor: "#f9fafb", color: "#111827" }}
                  />
                  <p className="text-xs text-gray-500 mt-1.5">
                    Email cannot be changed
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Phone size={16} />
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    className="w-full !bg-white border-gray-200 focus:border-2 rounded-xl"
                    style={{ backgroundColor: "#ffffff", color: "#111827" }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = primaryColor;
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = "";
                    }}
                    placeholder="+234 800 000 0000"
                  />
                  {errors.phone && (
                    <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                      <AlertCircle size={12} />
                      {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex gap-3">
                <Button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="text-white border-0 rounded-xl px-8 py-3 font-semibold shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2 inline-block" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} className="mr-2 inline" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* Sidebar - 1/3 width */}
          <div className="space-y-6">
            {/* Account Status Card */}
            <Card
              className="p-6 border-2 !bg-white rounded-2xl shadow-sm"
              style={{
                borderColor: `${primaryColor}30`,
                backgroundColor: "#ffffff",
                color: "#111827",
              }}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Account Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600">Email Verified</span>
                  <CheckCircle2 size={18} style={{ color: primaryColor }} />
                </div>
                <div className="flex items-center justify-between py-2 border-t border-gray-100">
                  <span className="text-sm text-gray-600">Member Since</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {new Date().toLocaleDateString("en-US", {
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </Card>

            {/* Delete Account Card */}
            <Card
              className="p-6 border-2 border-red-100 !bg-red-50/50 rounded-2xl shadow-sm"
              style={{ backgroundColor: "#fef2f2", color: "#111827" }}
            >
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Danger Zone
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Permanently delete your account and all data.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full px-4 py-2.5 text-sm font-semibold text-red-600 bg-white border-2 border-red-200 rounded-xl hover:bg-red-50 hover:border-red-300 transition-all duration-200"
              >
                Delete Account
              </button>
            </Card>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
            <Card
              className="max-w-md w-full p-8 border-2 border-gray-100 !bg-white rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
              style={{ backgroundColor: "#ffffff", color: "#111827" }}
            >
              <div className="flex items-start gap-4 mb-6">
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: "#FEE2E2" }}
                >
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Delete Account?
                  </h3>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone. All your data, bookings, and
                    reviews will be permanently deleted.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  variant="outline"
                  className="border-2 border-gray-200 text-gray-700 rounded-xl px-6 py-2.5 font-semibold hover:bg-gray-50 transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700 text-white border-0 rounded-xl px-6 py-2.5 font-semibold shadow-md hover:shadow-lg transition-all duration-200 transform hover:scale-105"
                >
                  Delete Account
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer
        realtorName={realtorName}
        tagline={tagline}
        logo={logoUrl}
        description={description}
        primaryColor={primaryColor}
      />
    </div>
  );
}
