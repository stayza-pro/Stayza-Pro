"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Home,
  Calendar,
  Heart,
  MessageSquare,
  History,
  HelpCircle,
  User,
} from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      { name: "History", href: "/guest/history", icon: History },
      { name: "Help", href: "/guest/help", icon: HelpCircle },
      { name: "Profile", href: "/guest/profile", icon: User },
    ],
    [],
  );

  const isActive = (href: string) => {
    if (href === "/guest/bookings") {
      return (
        pathname.startsWith("/guest/bookings") ||
        pathname.startsWith("/guest/booking")
      );
    }
    return pathname === href;
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
              className="flex items-center gap-3 min-w-0"
            >
              {logo && logo.trim() !== "" ? (
                <img src={logo} alt={agencyName} className="h-10 w-auto" />
              ) : (
                <div
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="text-white text-[18px] font-semibold">
                    {agencyName.charAt(0)}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <div className="font-semibold tracking-tight text-[20px] text-gray-900 truncate">
                  {agencyName}
                </div>
                <div className="text-xs tracking-wide text-gray-500 truncate">
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
                <img src={logo} alt={agencyName} className="h-8 w-auto" />
              ) : (
                <div
                  className="h-8 w-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: primaryColor }}
                >
                  <span className="text-white text-sm font-semibold">
                    {agencyName.charAt(0)}
                  </span>
                </div>
              )}
              <span className="font-semibold text-[16px] text-gray-900 truncate">
                {agencyName}
              </span>
            </Link>

            <div className="flex items-center gap-1">
              <GuestNotificationDropdown primaryColor={primaryColor} />
              <button
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                className="p-2 rounded-lg text-gray-700"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <div
            className="border-t px-4 py-4 space-y-1"
            style={{ borderColor: "#e5e7eb" }}
          >
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-all"
                  style={{
                    backgroundColor: active
                      ? `${primaryColor}12`
                      : "transparent",
                    color: active ? primaryColor : "#374151",
                  }}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      <div
        className="md:hidden fixed bottom-0 left-0 right-0 z-[55] border-t bg-white"
        style={{ borderColor: "#e5e7eb" }}
      >
        <div className="flex items-center justify-around px-2 py-2">
          {[...navigation, { name: "Profile", href: "/guest/profile", icon: User }].map((item) => {
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
  );
};
