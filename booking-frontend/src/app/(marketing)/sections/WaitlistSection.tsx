"use client";

import { useState, useEffect } from "react";
import { WaitlistForm } from "../components/WaitlistForm";
import { Rocket, Bell, Users } from "lucide-react";
import { palette } from "@/app/(marketing)/content";

export function WaitlistSection() {
  const [waitlistCount, setWaitlistCount] = useState(100);

  useEffect(() => {
    const fetchWaitlistCount = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/waitlist/count`
        );
        const data = await response.json();
        if (data.success) {
          // Add 100 baseline to actual count
          setWaitlistCount(data.data.count + 100);
        }
      } catch (error) {
        console.error("Failed to fetch waitlist count:", error);
        // Keep default 100 if fetch fails
      }
    };

    fetchWaitlistCount();
  }, []);

  return (
    <section
      id="waitlist"
      className="py-24 relative overflow-hidden"
      style={{ backgroundColor: palette.primary }}
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/5 to-black/10" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white/90 text-sm font-medium mb-6"
            style={{ backgroundColor: `${palette.accent}40` }}
          >
            <Rocket className="w-4 h-4" />
            Coming Soon
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Be First to Experience
            <br />
            <span style={{ color: palette.accent }}>
              Property Booking, Reimagined
            </span>
          </h2>

          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Join {waitlistCount}+ realtors on the waitlist. Get priority access
            to your branded booking site, escrow payments, and CAC verification.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="text-center p-6">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${palette.secondary}30` }}
            >
              <Bell className="w-6 h-6" style={{ color: palette.accent }} />
            </div>
            <h3 className="text-white font-semibold mb-2">Early Access</h3>
            <p className="text-white/70 text-sm">
              Be among the first to use Stayza Pro before public launch
            </p>
          </div>

          <div className="text-center p-6">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${palette.secondary}30` }}
            >
              <Users className="w-6 h-6" style={{ color: palette.accent }} />
            </div>
            <h3 className="text-white font-semibold mb-2">Founding Member</h3>
            <p className="text-white/70 text-sm">
              Priority access to all platform features when we launch
            </p>
          </div>

          <div className="text-center p-6">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: `${palette.secondary}30` }}
            >
              <Rocket className="w-6 h-6" style={{ color: palette.accent }} />
            </div>
            <h3 className="text-white font-semibold mb-2">Shape the Future</h3>
            <p className="text-white/70 text-sm">
              Your feedback will directly influence product features
            </p>
          </div>
        </div>

        {/* Waitlist Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12">
          <WaitlistForm />
        </div>

        {/* Social Proof */}
        <div className="text-center mt-8">
          <p className="text-white/80 text-sm">
            Join <span className="font-bold text-white">{waitlistCount}+</span>{" "}
            property professionals already on the waitlist
          </p>
        </div>
      </div>
    </section>
  );
}
