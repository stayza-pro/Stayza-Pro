"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Phone,
  User,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  Shield,
  CreditCard,
  HelpCircle,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { GuestHeader } from "@/components/guest/sections/GuestHeader";
import { Footer } from "@/components/guest/sections/Footer";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { authService } from "@/services";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useCurrentUser();
  const [authChecked, setAuthChecked] = useState(false);

  const {
    brandColor: primaryColor,
    secondaryColor,
    accentColor,
    realtorName,
    logoUrl,
    tagline,
    description,
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

  const menuItems = [
    {
      section: "Account",
      items: [
        { icon: User, label: "Personal Information", href: "/guest/profile" },
        { icon: Bell, label: "Notifications", href: "/guest/notifications" },
        { icon: Shield, label: "Privacy & Security", href: "/guest/profile" },
      ],
    },
    {
      section: "Bookings",
      items: [
        {
          icon: CreditCard,
          label: "Payment & Booking History",
          href: "/guest/bookings",
        },
      ],
    },
    {
      section: "Support",
      items: [{ icon: HelpCircle, label: "Help Center", href: "/guest/help" }],
    },
  ];

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
    <div
      className="min-h-screen bg-slate-50 flex flex-col"
      style={{ colorScheme: "light" }}
    >
      <GuestHeader currentPage="profile" searchPlaceholder="Search..." />

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        <Card className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-semibold text-gray-700">
              {(fullName[0] || "G").toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-1 text-gray-900">
                {fullName}
              </h1>
              <p className="text-gray-600 mb-3">
                Manage your account and preferences
              </p>
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-200 pt-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium text-gray-900">
                  {user?.email || "-"}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                style={{ backgroundColor: primaryColor }}
              >
                <Phone className="w-5 h-5" />
              </div>
              {/* <div>
                <div className="text-sm text-gray-500">Phone</div>
                <div className="font-medium text-gray-900">{user?. || "Not set"}</div>
              </div> */}
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          {menuItems.map((section) => (
            <Card
              key={section.section}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              <div className="px-6 py-3 border-b border-gray-200">
                <h3 className="font-semibold text-sm text-gray-500 uppercase tracking-wide">
                  {section.section}
                </h3>
              </div>
              <div>
                {section.items.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors border-b border-gray-200 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 text-gray-500" />
                      <span className="text-gray-900">{item.label}</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </Link>
                ))}
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-2" />
            Log Out
          </Button>
        </div>
      </main>

      <Footer
        realtorName={realtorName}
        tagline={tagline}
        logo={logoUrl}
        description={description}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        accentColor={accentColor}
      />
    </div>
  );
}
