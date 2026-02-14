"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Calendar, MessageCircle, User } from "lucide-react";

interface MobileBottomNavProps {
  isAuthenticated: boolean;
  unreadMessages?: number;
}

const navItems = [
  { href: "/guest-landing", icon: Home, label: "Home" },
  { href: "/guest/browse", icon: Search, label: "Browse" },
  { href: "/guest/bookings", icon: Calendar, label: "Bookings", requiresAuth: true },
  { href: "/guest/messages", icon: MessageCircle, label: "Messages", requiresAuth: true, badgeKey: "messages" as const },
  { href: "/guest/profile", icon: User, label: "Profile", requiresAuth: true },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  isAuthenticated,
  unreadMessages = 0,
}) => {
  const pathname = usePathname();

  const visibleItems = navItems.filter(
    (item) => !item.requiresAuth || isAuthenticated
  );

  const isActive = (href: string) => {
    if (href === "/guest-landing") return pathname === "/guest-landing" || pathname === "/guest" || pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 backdrop-blur-lg md:hidden"
      role="navigation"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {visibleItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.requiresAuth && !isAuthenticated ? "/guest/login" : item.href}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                active ? "text-[var(--brand-primary)]" : "text-gray-500"
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={active ? 2.5 : 1.8} />
                {item.badgeKey === "messages" && unreadMessages > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                    {unreadMessages > 99 ? "99+" : unreadMessages}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium leading-tight ${active ? "font-semibold" : ""}`}>
                {item.label}
              </span>
              {active && (
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-[var(--brand-primary)]" />
              )}
            </Link>
          );
        })}
      </div>
      {/* Safe area for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};
