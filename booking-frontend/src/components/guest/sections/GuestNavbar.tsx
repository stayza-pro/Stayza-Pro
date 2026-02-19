"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Calendar,
  Heart,
  MessageSquare,
  HelpCircle,
  User,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/store";
import { GuestNotificationDropdown } from "./GuestNotificationDropdown";

interface GuestNavbarProps {
  agencyName: string;
  tagline: string;
  primaryColor: string;
  logo?: string;
  isSticky?: boolean;
}

export const GuestNavbar: React.FC<GuestNavbarProps> = ({
  agencyName,
  tagline,
  primaryColor,
  logo,
  isSticky = true,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);
  const hideBottomNav =
    pathname.startsWith("/guest/messages") ||
    pathname.startsWith("/booking/") ||
    pathname.startsWith("/guest/browse/");

  const navigation = useMemo(
    () => [
      { name: "Browse", href: "/guest/browse", icon: Home },
      { name: "Bookings", href: "/guest/bookings", icon: Calendar },
      { name: "Favorites", href: "/guest/favorites", icon: Heart },
      { name: "Messages", href: "/guest/messages", icon: MessageSquare },
    ],
    [],
  );

  const actionLinks = useMemo(
    () => [
      { name: "Help", href: "/guest/help", icon: HelpCircle },
      { name: "Profile", href: "/guest/profile", icon: User },
    ],
    [],
  );

  const isActive = (href: string) => {
    if (href === "/guest/bookings") {
      return pathname.startsWith("/guest/bookings");
    }
    return pathname === href;
  };

  const handleLogout = async () => {
    await logout();
    router.push("/guest/login");
  };

  return (
    <>
      <nav
        className={`${isSticky ? "sticky" : ""} top-0 z-[60] hidden md:block border-b bg-white`}
        style={{ borderColor: "#e5e7eb" }}
      >
        <div className="max-w-[1440px] mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <Link
              href="/guest-landing"
              className="flex items-center gap-4 min-w-0"
            >
              {logo && logo.trim() !== "" ? (
                <img
                  src={logo}
                  alt={agencyName}
                  className="h-16 w-auto rounded-2xl object-contain p-1.5 bg-white border border-gray-200 shadow-sm"
                />
              ) : (
                <div
                  className="h-16 w-16 rounded-2xl flex items-center justify-center shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="text-white text-[26px] font-semibold">
                    {agencyName.charAt(0)}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <div className="font-semibold tracking-tight text-[24px] text-gray-900 truncate leading-tight">
                  {agencyName}
                </div>
                <div className="text-[13px] tracking-wide text-gray-500 truncate">
                  {tagline && tagline.trim() !== ""
                    ? tagline
                    : "Premium short-let properties"}
                </div>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              {navigation.slice(0, 4).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
                    style={{
                      backgroundColor: active
                        ? `${primaryColor}12`
                        : "transparent",
                      color: active ? primaryColor : "#374151",
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <GuestNotificationDropdown primaryColor={primaryColor} />
              {actionLinks.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="p-2 rounded-lg transition-all relative"
                    style={{
                      backgroundColor: active
                        ? `${primaryColor}12`
                        : "transparent",
                      color: active ? primaryColor : "#374151",
                    }}
                  >
                    <Icon className="w-5 h-5" />
                  </Link>
                );
              })}
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <nav
        className={`${isSticky ? "sticky" : ""} top-0 z-[60] md:hidden border-b bg-white`}
        style={{ borderColor: "#e5e7eb" }}
      >
        <div className="px-4">
          <div className="flex items-center justify-between h-16">
            <Link
              href="/guest-landing"
              className="flex items-center gap-2 min-w-0"
            >
              {logo && logo.trim() !== "" ? (
                <img
                  src={logo}
                  alt={agencyName}
                  className="h-10 w-auto rounded-lg object-contain"
                />
              ) : (
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="text-white text-base font-semibold">
                    {agencyName.charAt(0)}
                  </span>
                </div>
              )}
              <span className="font-semibold text-[17px] text-gray-900 truncate">
                {agencyName}
              </span>
            </Link>

            <div className="flex items-center gap-1">
              <GuestNotificationDropdown primaryColor={primaryColor} />
              <button
                type="button"
                onClick={() => void handleLogout()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {!hideBottomNav && (
        <>
          <div
            className="md:hidden fixed bottom-0 left-0 right-0 z-[55] border-t bg-white"
            style={{ borderColor: "#e5e7eb" }}
          >
            <div className="flex items-center justify-around px-2 py-2">
              {[
                ...navigation,
                { name: "Profile", href: "/guest/profile", icon: User },
              ].map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg min-w-[64px]"
                    style={{
                      color: active ? primaryColor : "#374151",
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="md:hidden h-20" />
        </>
      )}
    </>
  );
};
