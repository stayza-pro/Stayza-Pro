"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Search, Shield, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui";
import { useRealtorBranding } from "@/hooks/useRealtorBranding";

export default function GuestLandingPage() {
  const {
    brandColor: primaryColor,
    secondaryColor,
    accentColor,
    realtorName,
    tagline,
    description,
  } = useRealtorBranding();

  const features = [
    {
      icon: Search,
      title: "Curated Properties",
      description:
        "Hand-selected luxury properties that match your lifestyle and aspirations.",
    },
    {
      icon: Shield,
      title: "Trusted Process",
      description:
        "Verified listings with transparent booking and secure payment handling.",
    },
    {
      icon: Star,
      title: "Premium Service",
      description:
        "Dedicated support throughout your property search and booking journey.",
    },
    {
      icon: Sparkles,
      title: "Exclusive Access",
      description:
        "Priority viewing for new listings and off-market opportunities.",
    },
  ];

  const stats = [
    { value: "500+", label: "Properties" },
    { value: "98%", label: "Satisfaction" },
    { value: "24/7", label: "Support" },
  ];
  const primaryDark = "#10283f";
  const secondarySurface = "#faf8f4";
  const secondaryDark = "#b8875f";

  return (
    <div className="min-h-screen">
      <section
        className="relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryDark} 100%)`,
        }}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_2px_2px,white_1px,transparent_0)] bg-[length:48px_48px]" />

        <div className="relative max-w-[1440px] mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[600px] lg:min-h-[700px]">
            <div className="px-6 lg:px-12 py-16 lg:py-24 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20 bg-white/10 text-white">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {tagline || "Premium short-let properties"}
                </span>
              </div>

              <div className="space-y-4">
                <h1
                  className="font-semibold leading-tight tracking-tight text-white"
                  style={{ fontSize: "clamp(36px, 5vw, 56px)" }}
                >
                  Discover Your Next
                  <br />
                  <span style={{ color: secondaryColor || "#ffffff" }}>
                    Extraordinary Home
                  </span>
                </h1>
                <p className="text-lg leading-relaxed max-w-lg text-white/90">
                  {description ||
                    "Discover premium properties from trusted realtors across the country."}
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/guest/browse">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-8 py-6 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all text-white"
                    style={{ backgroundColor: accentColor || primaryColor }}
                  >
                    Browse Properties
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/guest/register">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full sm:w-auto px-8 py-6 rounded-xl font-semibold text-base backdrop-blur-sm transition-all border-white/30 text-white bg-white/10 hover:bg-white/20"
                  >
                    Create Account
                  </Button>
                </Link>
              </div>

              <div className="flex gap-8 pt-8 border-t border-white/20">
                {stats.map((stat) => (
                  <div key={stat.label}>
                    <div
                      className="font-bold text-3xl"
                      style={{ color: secondaryColor || "#ffffff" }}
                    >
                      {stat.value}
                    </div>
                    <div className="text-sm mt-1 text-white/80">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:block relative h-full">
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="relative w-full h-[600px] rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1706808849827-7366c098b317?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBtb2Rlcm4lMjBob3VzZSUyMGV4dGVyaW9yfGVufDF8fHx8MTc3MTAwOTg1M3ww&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Luxury Property"
                    className="w-full h-full object-cover"
                  />
                  <div
                    className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-30"
                    style={{ backgroundColor: accentColor || primaryColor }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="py-20 lg:py-32"
        style={{ backgroundColor: secondarySurface }}
      >
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2
              className="font-semibold mb-4 text-gray-900"
              style={{ fontSize: "clamp(28px, 4vw, 40px)" }}
            >
              Why Choose {realtorName || "Our Platform"}
            </h2>
            <p className="text-lg leading-relaxed text-gray-600">
              Experience a seamless property booking journey designed for
              discerning clients
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-8 rounded-2xl border transition-all hover:shadow-lg bg-white border-gray-200"
                >
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                    style={{ backgroundColor: `${primaryColor}20` }}
                  >
                    <Icon className="w-7 h-7" style={{ color: primaryColor }} />
                  </div>
                  <h3 className="font-semibold mb-3 text-[18px] text-gray-900">
                    {feature.title}
                  </h3>
                  <p className="leading-relaxed text-[15px] text-gray-600">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className="py-20 lg:py-32"
        style={{
          background: `linear-gradient(135deg, ${secondaryColor || "#d4a574"} 0%, ${secondaryDark} 100%)`,
        }}
      >
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2
              className="font-semibold leading-tight text-white"
              style={{ fontSize: "clamp(32px, 4vw, 48px)" }}
            >
              Ready to Find Your Dream Property?
            </h2>
            <p className="text-lg leading-relaxed max-w-2xl mx-auto text-white/95">
              Join thousands of satisfied clients who have found their perfect
              home through {realtorName || "our team"}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/guest/browse">
                <Button
                  size="lg"
                  className="px-8 py-6 rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all text-white"
                  style={{ backgroundColor: accentColor || primaryColor }}
                >
                  Start Exploring
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/guest/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="px-8 py-6 rounded-xl font-semibold text-base backdrop-blur-sm transition-all border-white/30 bg-white/15 text-white hover:bg-white/20"
                >
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
