"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  CreditCard,
  LogOut,
  MessageSquare,
  Save,
  Shield,
  User,
} from "lucide-react";
import { Button, Card, Input } from "@/components/ui";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { authService } from "@/services";

type ProfileTab = "personal" | "preferences" | "security";

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
}

interface NotificationSettings {
  bookingUpdates: boolean;
  newListings: boolean;
  priceAlerts: boolean;
  marketingEmails: boolean;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const [authChecked, setAuthChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>("personal");

  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
  });

  const [notifications, setNotifications] = useState<NotificationSettings>({
    bookingUpdates: true,
    newListings: true,
    priceAlerts: false,
    marketingEmails: false,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const {
    brandColor: primaryColor,
    secondaryColor,
    accentColor,
  } = useRealtorBranding();

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
      phone: "",
      location: "",
    });
  }, [user]);

  const fullName =
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Guest User";

  const handleLogout = async () => {
    await authService.logout();
    router.push("/guest/login");
  };

  if (!authChecked || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <GuestHeader currentPage="profile" searchPlaceholder="Search..." />

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-6 py-12">
        <h1 className="font-semibold mb-12 text-[40px] text-gray-900">
          My Profile
        </h1>

        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
          <div className="space-y-6">
            <Card className="p-8 rounded-2xl border text-center bg-white border-gray-200">
              <div className="relative inline-block mb-6">
                <div
                  className="w-32 h-32 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <User className="w-16 h-16" style={{ color: primaryColor }} />
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full shadow-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: accentColor || primaryColor }}
                  aria-label="Update profile photo"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>

              <h2 className="font-semibold text-xl mb-1 text-gray-900">
                {fullName}
              </h2>
              <p className="text-sm text-gray-600">Member since 2026</p>
            </Card>

            <Card
              className="p-6 rounded-2xl border-0"
              style={{ backgroundColor: `${secondaryColor || primaryColor}14` }}
            >
              <h3 className="font-semibold mb-4 text-gray-900">
                Account Stats
              </h3>
              <div className="space-y-3">
                <div>
                  <div
                    className="text-2xl font-bold"
                    style={{ color: primaryColor }}
                  >
                    12
                  </div>
                  <div className="text-sm text-gray-600">Properties Viewed</div>
                </div>
                <div>
                  <div
                    className="text-2xl font-bold"
                    style={{ color: primaryColor }}
                  >
                    5
                  </div>
                  <div className="text-sm text-gray-600">Saved Favorites</div>
                </div>
                <div>
                  <div
                    className="text-2xl font-bold"
                    style={{ color: primaryColor }}
                  >
                    3
                  </div>
                  <div className="text-sm text-gray-600">Active Bookings</div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-8">
            <div
              className="inline-flex h-12 p-1 rounded-xl"
              style={{ backgroundColor: `${primaryColor}20` }}
            >
              {[
                { key: "personal", label: "Personal Info" },
                { key: "preferences", label: "Preferences" },
                { key: "security", label: "Security" },
              ].map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <Button
                    key={tab.key}
                    variant={isActive ? "primary" : "ghost"}
                    className="h-10 px-6 rounded-lg"
                    style={
                      isActive
                        ? { backgroundColor: "#fff", color: primaryColor }
                        : undefined
                    }
                    onClick={() => setActiveTab(tab.key as ProfileTab)}
                  >
                    {tab.label}
                  </Button>
                );
              })}
            </div>

            {activeTab === "personal" && (
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
                    placeholder="City, State"
                  />
                </div>

                <Button
                  className="h-12 px-8 rounded-xl font-medium text-white"
                  style={{ backgroundColor: accentColor || primaryColor }}
                >
                  <Save className="w-5 h-5 mr-2" />
                  Save Changes
                </Button>
              </Card>
            )}

            {activeTab === "preferences" && (
              <Card className="p-8 rounded-2xl border border-gray-200 bg-white space-y-6">
                <h3 className="font-semibold text-xl text-gray-900">
                  Notification Preferences
                </h3>

                <div className="space-y-4">
                  {Object.entries(notifications).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between py-4 border-b border-gray-200 last:border-b-0"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {key
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (letter) => letter.toUpperCase())}
                        </div>
                        <div className="text-sm mt-1 text-gray-600">
                          Receive notifications about {key.toLowerCase()}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setNotifications((prev) => ({
                            ...prev,
                            [key]: !value,
                          }))
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          value ? "bg-emerald-500" : "bg-gray-300"
                        }`}
                        aria-label={`Toggle ${key}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            value ? "translate-x-6" : "translate-x-1"
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === "security" && (
              <Card className="p-8 rounded-2xl border border-gray-200 bg-white space-y-6">
                <h3 className="font-semibold text-xl text-gray-900">
                  Security Settings
                </h3>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter current password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    className="h-12 rounded-xl bg-gray-50 border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    className="h-12 rounded-xl bg-gray-50 border-gray-200"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-900">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    className="h-12 rounded-xl bg-gray-50 border-gray-200"
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    className="h-12 px-8 rounded-xl font-medium text-white"
                    style={{ backgroundColor: accentColor || primaryColor }}
                  >
                    <Shield className="w-5 h-5 mr-2" />
                    Update Password
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 px-6 rounded-xl"
                    onClick={() => router.push("/guest/bookings")}
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    Booking History
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 px-6 rounded-xl"
                    onClick={() => router.push("/guest/messages")}
                  >
                    <MessageSquare className="w-5 h-5 mr-2" />
                    Messages
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>

        <div className="mt-8">
          <Button
            variant="outline"
            className="w-full lg:w-auto"
            size="lg"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Log Out
          </Button>
        </div>
      </main>

    </div>
  );
}
