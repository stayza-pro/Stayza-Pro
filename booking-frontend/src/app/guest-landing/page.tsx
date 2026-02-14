"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Shield,
  Award,
  Headphones,
  ArrowRight,
  Calendar,
  Star,
} from "lucide-react";
import { PropertyCard } from "@/components/property/PropertyCard";
import { useProperties } from "@/hooks/useProperties";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";
import { GuestNavbar } from "@/components/guest/sections/GuestNavbar";
import { Footer } from "@/components/guest/sections/Footer";
import { MobileBottomNav } from "@/components/guest/sections/MobileBottomNav";
import { BrandTokenProvider, useBrandTokens } from "@/providers/BrandTokenProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      <div className="aspect-[4/3] animate-shimmer" />
      <div className="p-4 space-y-3">
        <div className="h-5 w-3/4 rounded-lg animate-shimmer" />
        <div className="h-4 w-1/2 rounded-lg animate-shimmer" />
        <div className="h-4 w-full rounded-lg animate-shimmer" />
      </div>
    </div>
  );
}

function LandingContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const tokens = useBrandTokens();
  const { isAuthenticated } = useCurrentUser();
  const { data: propertiesResponse, isLoading } = useProperties(
    { isActive: true, isApproved: true },
    { page: 1, limit: 6 }
  );
  const featuredProperties = propertiesResponse?.data || [];

  const trustFeatures = [
    {
      icon: Shield,
      title: "Verified Properties",
      desc: "Every listing is verified and approved by our team for quality assurance.",
    },
    {
      icon: Award,
      title: "Trusted Realtors",
      desc: "Work with experienced and certified real estate professionals.",
    },
    {
      icon: Headphones,
      title: "24/7 Support",
      desc: "Our support team is always available to help with your needs.",
    },
  ];

  const popularCities = ["Lagos", "Abuja", "Port Harcourt", "Ibadan", "Lekki"];

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg"
      >
        Skip to main content
      </a>

      <GuestNavbar
        agencyName={tokens.realtorName}
        tagline={tokens.tagline}
        primaryColor={tokens.primary}
        logo={tokens.logoUrl}
      />

      <main id="main-content" className="flex-1 pb-20 md:pb-0">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gray-50">
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, var(--brand-primary) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }} />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-28">
            <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 text-sm text-gray-600 mb-6 shadow-sm">
                <Star size={14} className="text-amber-500 fill-amber-500" />
                <span>Trusted by thousands of guests</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight text-gray-900 mb-5 text-balance">
                Find Your Perfect{" "}
                <span className="text-brand-primary">Stay</span>
              </h1>

              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-8 leading-relaxed text-pretty">
                {tokens.tagline !== "Premium short-let properties"
                  ? tokens.tagline
                  : "Discover premium short-let properties from trusted realtors across Nigeria."}
              </p>

              {/* Search bar */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-2 max-w-2xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Where are you going?"
                      className="w-full h-12 pl-11 pr-4 text-sm rounded-xl border-0 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-0"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          window.location.href = `/guest/browse${searchQuery ? `?location=${encodeURIComponent(searchQuery)}` : ""}`;
                        }
                      }}
                    />
                  </div>
                  <Link
                    href={`/guest/browse${searchQuery ? `?location=${encodeURIComponent(searchQuery)}` : ""}`}
                    className="flex items-center justify-center gap-2 h-12 px-6 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 shadow-sm shrink-0 bg-[var(--brand-primary)]"
                  >
                    <Search size={18} />
                    <span>Search</span>
                  </Link>
                </div>
              </div>

              {/* Popular cities */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">Popular:</span>
                {popularCities.map((city) => (
                  <Link
                    key={city}
                    href={`/guest/browse?location=${encodeURIComponent(city)}`}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-gray-200 text-gray-600 hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)] transition-colors"
                  >
                    {city}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trust features */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 text-balance">
                Why Choose Us
              </h2>
              <p className="text-gray-500 max-w-lg mx-auto">
                Premium real estate booking made simple and secure
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
              {trustFeatures.map((feature, i) => (
                <div
                  key={feature.title}
                  className={`group bg-gray-50 rounded-2xl p-8 border border-gray-100 hover:border-[var(--brand-primary-light)] hover:shadow-lg transition-all duration-300 text-center animate-fade-in-up stagger-${i + 1}`}
                  style={{ animationFillMode: "both" }}
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5 bg-[var(--brand-primary)] text-white transition-transform duration-300 group-hover:scale-110">
                    <feature.icon size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Featured properties */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Featured Properties
                </h2>
                <p className="text-gray-500">Handpicked properties you will love</p>
              </div>
              <Link
                href="/guest/browse"
                className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-[var(--brand-primary)] hover:underline"
              >
                View all
                <ArrowRight size={16} />
              </Link>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : featuredProperties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredProperties.map((property) => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <Search size={40} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No properties yet</h3>
                <p className="text-sm text-gray-500">Check back soon for new listings.</p>
              </div>
            )}

            <div className="text-center mt-8 sm:hidden">
              <Link
                href="/guest/browse"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors"
              >
                View All Properties
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="rounded-3xl p-8 md:p-14 text-center relative overflow-hidden"
              style={{ backgroundColor: tokens.primary }}
            >
              <div className="absolute inset-0 opacity-10" style={{
                backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                backgroundSize: '32px 32px',
              }} />
              <div className="relative z-10">
                <h2
                  className="text-3xl md:text-4xl font-bold mb-4 text-balance"
                  style={{ color: tokens.primaryContrast }}
                >
                  Ready to Find Your Dream Stay?
                </h2>
                <p
                  className="text-lg mb-8 max-w-xl mx-auto opacity-90"
                  style={{ color: tokens.primaryContrast }}
                >
                  Join thousands of satisfied guests who found their perfect property with us.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    href="/guest/browse"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-white text-gray-900 hover:bg-gray-100 transition-colors shadow-lg"
                  >
                    <Search size={18} />
                    Browse Properties
                  </Link>
                  <Link
                    href="/guest/register"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold border-2 border-white/30 hover:bg-white/10 transition-colors"
                    style={{ color: tokens.primaryContrast }}
                  >
                    <Calendar size={18} />
                    Create Account
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="hidden md:block">
        <Footer
          realtorName={tokens.realtorName}
          tagline={tokens.tagline}
          logo={tokens.logoUrl}
          description={tokens.description}
          primaryColor={tokens.primary}
          secondaryColor={tokens.secondary}
          accentColor={tokens.accent}
          realtorId={tokens.realtorId || undefined}
        />
      </div>

      <MobileBottomNav isAuthenticated={isAuthenticated} />
    </div>
  );
}

export default function GuestLandingPage() {
  return (
    <BrandTokenProvider>
      <LandingContent />
    </BrandTokenProvider>
  );
}
