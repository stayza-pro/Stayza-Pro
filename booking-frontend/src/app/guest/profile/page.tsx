"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Save, Trash2, User } from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { authService } from "@/services";
import { useAuthStore } from "@/store";
import toast from "react-hot-toast";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const [authChecked, setAuthChecked] = useState(false);

  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
  });

  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [deleteReason, setDeleteReason] = useState("");
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleteStep, setDeleteStep] = useState<"idle" | "otp-sent">("idle");
  const [isRequestingDeleteOtp, setIsRequestingDeleteOtp] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const {
    brandColor: primaryColor,
    accentColor,
    realtorName,
  } = useRealtorBranding();
  const primaryPale = "#e8f1f8";
  const secondarySurface = "#f9f4ef";

  useEffect(() => {
    if (!isLoading && (isAuthenticated || !authChecked)) {
      setAuthChecked(true);
    }
  }, [isLoading, isAuthenticated, authChecked]);

  useEffect(() => {
    if (authChecked && !isLoading && !isAuthenticated) {
      router.push("/guest/login?returnTo=/guest/profile");
    }
  }, [authChecked, isLoading, isAuthenticated, router]);

  useEffect(() => {
    setFormData({
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      location: [user?.city, user?.country].filter(Boolean).join(", "),
    });
    setAvatarPreview(user?.avatar || null);
  }, [user]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setSelectedAvatar(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("First name and last name are required");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }

    try {
      setIsSavingProfile(true);
      let updatedUser;

      if (selectedAvatar) {
        const payload = new FormData();
        payload.append("firstName", formData.firstName.trim());
        payload.append("lastName", formData.lastName.trim());
        payload.append("phone", formData.phone.trim());
        payload.append("avatar", selectedAvatar);
        updatedUser = await authService.updateProfile(payload);
      } else {
        updatedUser = await authService.updateProfile({
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim(),
        });
      }

      if (updatedUser) {
        useAuthStore.setState((state) => ({
          ...state,
          user: state.user ? { ...state.user, ...updatedUser } : updatedUser,
        }));
      }

      toast.success("Profile updated successfully");
      setSelectedAvatar(null);
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to update profile";
      toast.error(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleRequestDeleteOtp = async () => {
    try {
      setIsRequestingDeleteOtp(true);
      await authService.requestGuestDeleteOtp(deleteReason.trim() || undefined);
      setDeleteStep("otp-sent");
      toast.success("Verification code sent to your email");
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to request verification code";
      toast.error(message);
    } finally {
      setIsRequestingDeleteOtp(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteOtp.trim()) {
      toast.error("Enter the OTP sent to your email");
      return;
    }

    try {
      setIsDeletingAccount(true);
      await authService.verifyGuestDeleteOtp({
        otp: deleteOtp.trim(),
        reason: deleteReason.trim() || undefined,
      });
      await logout();
      toast.success("Account deleted successfully");
      router.replace("/guest-landing");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to delete account";
      toast.error(message);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const fullName =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Guest User";
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "N/A";

  if (!authChecked || isLoading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: "#f8fafc" }}>
        <GuestHeader currentPage="profile" searchPlaceholder="Search..." />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-28 bg-gray-200 rounded-xl" />
            <div className="h-48 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#f8fafc" }}
    >
      <GuestHeader currentPage="profile" searchPlaceholder="Search..." />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-6 py-12">
        <h1 className="font-semibold mb-12 text-[40px] text-gray-900">
          My Profile
        </h1>

        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
          <div className="space-y-6">
            <Card className="p-8 rounded-2xl border text-center bg-white border-gray-200">
              <div className="relative inline-block mb-6">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt={fullName}
                    className="w-32 h-32 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className="w-32 h-32 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: primaryPale }}
                  >
                    <User
                      className="w-16 h-16"
                      style={{ color: primaryColor }}
                    />
                  </div>
                )}
                <button
                  type="button"
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: accentColor || primaryColor }}
                  aria-label="Update profile photo"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Camera className="w-5 h-5" />
                </button>
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <h2 className="font-semibold text-xl mb-1 text-gray-900">
                {fullName}
              </h2>
              <p className="text-sm text-gray-600">
                Member since {memberSince}
              </p>
            </Card>

            <Card
              className="p-6 rounded-2xl border-0"
              style={{ backgroundColor: secondarySurface }}
            >
              <h3 className="font-semibold mb-4 text-gray-900">
                Account Actions
              </h3>
              <p className="text-sm text-gray-600">
                Manage your {realtorName || "Stayza Pro"} account securely with
                one-time email verification.
              </p>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="p-8 rounded-2xl border border-gray-200 bg-white space-y-6">
              <h3 className="font-semibold text-xl text-gray-900">
                Personal Information
              </h3>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    First Name
                  </label>
                  <Input
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        firstName: e.target.value,
                      }))
                    }
                    className="h-12 rounded-xl bg-gray-50 border-gray-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Last Name
                  </label>
                  <Input
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        lastName: e.target.value,
                      }))
                    }
                    className="h-12 rounded-xl bg-gray-50 border-gray-200"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Email
                </label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="h-12 rounded-xl bg-gray-50 border-gray-200"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Phone
                </label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      phone: e.target.value,
                    }))
                  }
                  className="h-12 rounded-xl bg-gray-50 border-gray-200"
                  placeholder="Enter phone number"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Location
                </label>
                <Input
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      location: e.target.value,
                    }))
                  }
                  className="h-12 rounded-xl bg-gray-50 border-gray-200"
                  placeholder="City, Country"
                />
              </div>

              <Button
                className="h-12 px-8 rounded-xl font-medium text-white"
                style={{ backgroundColor: accentColor || primaryColor }}
                onClick={handleSaveProfile}
                loading={isSavingProfile}
              >
                <Save className="w-5 h-5 mr-2" />
                Save Changes
              </Button>
            </Card>

            <Card className="p-8 rounded-2xl border border-red-200 bg-white space-y-4">
              <h3 className="font-semibold text-xl text-red-600">
                Delete Account
              </h3>
              <p className="text-sm text-gray-600">
                This action is irreversible. We will send a one-time code to
                your email before deletion.
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Reason (optional)
                </label>
                <Input
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="h-12 rounded-xl bg-gray-50 border-gray-200"
                  placeholder={`Tell ${realtorName || "Stayza Pro"} why you’re leaving`}
                />
              </div>

              {deleteStep === "otp-sent" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Enter OTP
                  </label>
                  <Input
                    value={deleteOtp}
                    onChange={(e) => setDeleteOtp(e.target.value)}
                    className="h-12 rounded-xl bg-gray-50 border-gray-200"
                    placeholder="6-digit code"
                    maxLength={6}
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  variant="outline"
                  className="h-12 rounded-xl"
                  onClick={handleRequestDeleteOtp}
                  loading={isRequestingDeleteOtp}
                >
                  Send Deletion OTP
                </Button>

                {deleteStep === "otp-sent" && (
                  <Button
                    className="h-12 rounded-xl text-white"
                    style={{ backgroundColor: "#dc2626" }}
                    onClick={handleDeleteAccount}
                    loading={isDeletingAccount}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Confirm Delete
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
