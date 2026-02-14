"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Bell,
} from "lucide-react";
import { guestUserMenuItems } from "./guestUserMenuItems";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface GuestNavbarProps {
  agencyName: string;
  tagline: string;
  primaryColor: string;
  logo?: string;
  isSticky?: boolean;
}

const navLinks = [
  { href: "/guest-landing", label: "Home" },
  { href: "/guest/browse", label: "Browse" },
  { href: "/guest/bookings", label: "Bookings", requiresAuth: true },
];

export const GuestNavbar: React.FC<GuestNavbarProps> = ({
  agencyName,
  tagline,
  primaryColor,
  logo,
  isSticky = true,
}) => {
  const { user, isAuthenticated } = useCurrentUser();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

  const handleLogout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });
      }
    } catch {
      // ignore
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      setShowUserMenu(false);
      window.location.href = "/";
    }
  }, []);

  const isActive = (href: string) => {
    if (href === "/guest-landing") return pathname === "/guest-landing" || pathname === "/guest" || pathname === "/";
    return pathname.startsWith(href);
  };

  const userInitial = user?.firstName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || "G";

  return (
    <>
      <nav
        className={`${isSticky ? "sticky" : ""} top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md shadow-sm" : "bg-white"
        }`}
      >
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Left: Logo + Brand */}
          <Link href="/guest-landing" className="flex items-center gap-3 min-w-0 shrink-0">
            <div
              className="w-10 h-10 rounded-xl overflow-hidden border-2 shadow-sm shrink-0"
              style={{ borderColor: `${primaryColor}25` }}
            >
              {logo && logo.trim() !== "" ? (
                <img
                  src={logo}
                  alt={`${agencyName} logo`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center font-bold text-base text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {agencyName.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h1
                className="text-base font-bold leading-tight truncate"
                style={{ color: primaryColor }}
              >
                {agencyName}
              </h1>
              <p className="hidden sm:block text-xs text-gray-500 truncate leading-tight">
                {tagline && tagline.trim() !== "" ? tagline : "Premium short-let properties"}
              </p>
            </div>
          </Link>

          {/* Center: Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks
              .filter((link) => !link.requiresAuth || isAuthenticated)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? "text-[var(--brand-primary)] bg-[var(--brand-primary-light)]"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
          </div>

          {/* Right: User actions */}
          <div className="flex items-center gap-2 shrink-0">
            {isAuthenticated && user ? (
              <>
                {/* Notification bell - desktop only */}
                <Link
                  href="/guest/notifications"
                  className="hidden md:flex items-center justify-center w-10 h-10 rounded-full text-gray-500 hover:bg-gray-100 transition-colors relative"
                  aria-label="Notifications"
                >
                  <Bell size={20} />
                </Link>

                {/* User menu */}
                <div ref={menuRef} className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all bg-white"
                    aria-expanded={showUserMenu}
                    aria-haspopup="true"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                      style={{
                        backgroundColor: primaryColor,
                        color: "white",
                      }}
                    >
                      {userInitial}
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-gray-500 transition-transform duration-200 ${showUserMenu ? "rotate-180" : ""}`}
                    />
                  </button>

                  {showUserMenu && (
                    <div className="absolute top-[calc(100%+0.5rem)] right-0 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-scale-in">
                      {/* User info */}
                      <div className="p-4 border-b border-gray-100" style={{ background: `linear-gradient(135deg, ${primaryColor}06, ${primaryColor}10)` }}>
                        <p className="font-semibold text-gray-900 text-sm">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{user.email}</p>
                        <span
                          className="inline-block mt-2 px-2.5 py-1 text-[10px] font-bold tracking-wider rounded-md uppercase"
                          style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                        >
                          Guest
                        </span>
                      </div>

                      {/* Menu items */}
                      <div className="p-1.5">
                        {guestUserMenuItems.map((item) => {
                          const Icon = item.icon;
                          const active = pathname.startsWith(item.href);
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setShowUserMenu(false)}
                              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                                active
                                  ? "bg-[var(--brand-primary-light)] text-[var(--brand-primary)] font-medium"
                                  : "text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              <Icon size={18} className={active ? "text-[var(--brand-primary)]" : "text-gray-400"} />
                              {item.label}
                            </Link>
                          );
                        })}
                      </div>

                      {/* Logout */}
                      <div className="p-1.5 border-t border-gray-100">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={18} />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/guest/login"
                  className="hidden sm:flex px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/guest/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-sm"
                  style={{ backgroundColor: primaryColor }}
                >
                  Sign up
                </Link>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors text-gray-700"
              aria-label="Toggle menu"
              aria-expanded={showMobileMenu}
            >
              {showMobileMenu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile slide-in menu */}
      {showMobileMenu && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-40 md:hidden animate-fade-in"
            onClick={() => setShowMobileMenu(false)}
          />
          <div
            ref={mobileMenuRef}
            className="fixed top-0 right-0 bottom-0 w-72 bg-white z-50 shadow-2xl md:hidden animate-slide-in-right overflow-y-auto"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-gray-900">Menu</span>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-2">
              {navLinks
                .filter((link) => !link.requiresAuth || isAuthenticated)
                .map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive(link.href)
                        ? "bg-[var(--brand-primary-light)] text-[var(--brand-primary)]"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
            </div>

            {isAuthenticated && user && (
              <>
                <div className="mx-4 border-t border-gray-100" />
                <div className="p-2">
                  {guestUserMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Icon size={18} className="text-gray-400" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
                <div className="mx-4 border-t border-gray-100" />
                <div className="p-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
              </>
            )}

            {!isAuthenticated && (
              <div className="p-4 flex flex-col gap-2">
                <Link
                  href="/guest/login"
                  className="w-full flex items-center justify-center px-4 py-3 rounded-xl text-sm font-medium text-gray-700 border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  Log in
                </Link>
                <Link
                  href="/guest/register"
                  className="w-full flex items-center justify-center px-4 py-3 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ backgroundColor: primaryColor }}
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
};
