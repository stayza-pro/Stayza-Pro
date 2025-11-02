import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Globe2, DollarSign } from "lucide-react";
import { AgencyData, BrandColors } from "../../types/preview";
import { useGradient } from "../../hooks/useGradient";

interface HeroSectionProps {
  agency: AgencyData;
  colors: BrandColors;
  currency: string;
  highlightRegion?: string;
  deviceType?: "desktop" | "tablet" | "mobile";
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  agency,
  colors,
  currency,
  highlightRegion,
  deviceType = "desktop",
}) => {
  const { linear, mesh } = useGradient(colors);

  const stats = agency.stats || {
    totalProperties: 50,
    happyGuests: 2500,
    averageRating: 4.9,
  };

  return (
    <motion.div
      animate={
        highlightRegion === "hero"
          ? {
              boxShadow: "0 0 0 2px #3B82F6, 0 0 0 4px rgba(59, 130, 246, 0.2)",
              scale: 1.01,
            }
          : {}
      }
      transition={{ duration: 0.3 }}
      className="relative min-h-[60vh] flex items-center text-white overflow-hidden"
      style={{ background: linear }}
    >
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-white/10 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Header Navigation */}
      <div className="absolute top-0 left-0 right-0 z-20">
        <div className="flex items-center justify-between px-8 py-6">
          <div className="flex items-center space-x-4">
            {agency.logo ? (
              <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-white/30 backdrop-blur-sm bg-white/10">
                <Image
                  src={agency.logo}
                  alt={`${agency.name} Logo`}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <span className="text-xl font-bold">
                  {agency.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-xl font-bold">{agency.name}</h2>
              <p className="text-white/80 text-sm">
                {agency.tagline || "Luxury Properties & Experiences"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Language & Currency Controls */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
                >
                  <Globe2 className="w-5 h-5" />
                </button>
              </div>
              <div className="relative">
                <button
                  type="button"
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all"
                >
                  <DollarSign className="w-5 h-5" />
                </button>
              </div>
            </div>

            <button className="px-6 py-3 bg-white text-gray-900 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg">
              Book Now
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`relative z-10 w-full ${
          deviceType === "mobile"
            ? "px-4"
            : deviceType === "tablet"
            ? "px-6"
            : "px-8"
        }`}
      >
        <div
          className={`max-w-7xl mx-auto ${
            deviceType === "mobile"
              ? "block space-y-6"
              : deviceType === "tablet"
              ? "block space-y-8"
              : "grid lg:grid-cols-2 gap-12 items-center"
          }`}
        >
          {/* Left Content */}
          <div className={deviceType === "mobile" ? "space-y-4" : "space-y-8"}>
            <div
              className={deviceType === "mobile" ? "space-y-3" : "space-y-4"}
            >
              <div className="inline-block px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <span
                  className={`font-medium ${
                    deviceType === "mobile" ? "text-xs" : "text-sm"
                  }`}
                >
                  🏆 Premium Short-Let Specialist
                </span>
              </div>
              <h1
                className={`font-bold leading-tight ${
                  deviceType === "mobile"
                    ? "text-2xl"
                    : deviceType === "tablet"
                    ? "text-4xl"
                    : "text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
                }`}
              >
                Find Your Perfect Stay
              </h1>
              <p
                className={`text-white/90 leading-relaxed max-w-xl ${
                  deviceType === "mobile"
                    ? "text-sm"
                    : deviceType === "tablet"
                    ? "text-base"
                    : "text-base sm:text-lg md:text-xl"
                }`}
              >
                {agency.description ||
                  "Discover luxury accommodations tailored to your needs. Book with confidence and experience exceptional hospitality."}
              </p>
            </div>

            {/* CTA Buttons */}
            <div
              className={`flex ${
                deviceType === "mobile"
                  ? "flex-col gap-2"
                  : "flex-col sm:flex-row gap-3 sm:gap-4"
              }`}
            >
              <button
                className={`bg-white text-gray-900 rounded-2xl font-semibold hover:bg-white/90 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-1 ${
                  deviceType === "mobile"
                    ? "px-4 py-2 text-sm"
                    : "px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg"
                }`}
              >
                Explore Properties
              </button>
              <button
                className={`bg-white/10 backdrop-blur-sm text-white rounded-2xl font-semibold border border-white/20 hover:bg-white/20 transition-all ${
                  deviceType === "mobile"
                    ? "px-4 py-2 text-sm"
                    : "px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg"
                }`}
              >
                Watch Tour Video
              </button>
            </div>

            {/* Stats */}
            <div
              className={`grid grid-cols-3 pt-8 ${
                deviceType === "mobile"
                  ? "gap-2"
                  : deviceType === "tablet"
                  ? "gap-4"
                  : "gap-6"
              }`}
            >
              {[
                { label: "Properties", value: `${stats.totalProperties}+` },
                {
                  label: "Happy Guests",
                  value: `${stats.happyGuests.toLocaleString()}+`,
                },
                { label: "Avg Rating", value: `${stats.averageRating}★` },
              ].map((stat, idx) => (
                <div key={idx} className="text-center">
                  <div
                    className={`font-bold ${
                      deviceType === "mobile"
                        ? "text-lg"
                        : deviceType === "tablet"
                        ? "text-xl"
                        : "text-2xl"
                    }`}
                  >
                    {stat.value}
                  </div>
                  <div
                    className={`text-white/70 ${
                      deviceType === "mobile" ? "text-xs" : "text-sm"
                    }`}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search Card - Only show on tablet and desktop */}
          {(deviceType === "tablet" || deviceType === "desktop") && (
            <div className="relative mt-8 lg:mt-0">
              <div
                className={`backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl ${
                  deviceType === "tablet" ? "p-4" : "p-6 sm:p-8"
                }`}
                style={{ background: mesh }}
              >
                <h3
                  className={`font-bold text-center ${
                    deviceType === "tablet"
                      ? "text-lg mb-4"
                      : "text-xl sm:text-2xl mb-4 sm:mb-6"
                  }`}
                >
                  Book Your Stay
                </h3>
                <div
                  className={`${
                    deviceType === "tablet" ? "space-y-3" : "space-y-4"
                  }`}
                >
                  <div>
                    <label
                      className={`block font-medium mb-2 text-white/90 ${
                        deviceType === "tablet" ? "text-xs" : "text-sm"
                      }`}
                    >
                      Location
                    </label>
                    <input
                      className={`w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-white/30 focus:border-transparent ${
                        deviceType === "tablet" ? "p-3 text-sm" : "p-4"
                      }`}
                      placeholder="Where would you like to stay?"
                    />
                  </div>
                  <div
                    className={`grid grid-cols-2 ${
                      deviceType === "tablet" ? "gap-2" : "gap-4"
                    }`}
                  >
                    <div>
                      <label
                        className={`block font-medium mb-2 text-white/90 ${
                          deviceType === "tablet" ? "text-xs" : "text-sm"
                        }`}
                      >
                        Check In
                      </label>
                      <input
                        type="date"
                        className={`w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-white/30 focus:border-transparent ${
                          deviceType === "tablet" ? "p-3 text-sm" : "p-4"
                        }`}
                      />
                    </div>
                    <div>
                      <label
                        className={`block font-medium mb-2 text-white/90 ${
                          deviceType === "tablet" ? "text-xs" : "text-sm"
                        }`}
                      >
                        Check Out
                      </label>
                      <input
                        type="date"
                        className={`w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white focus:ring-2 focus:ring-white/30 focus:border-transparent ${
                          deviceType === "tablet" ? "p-3 text-sm" : "p-4"
                        }`}
                      />
                    </div>
                  </div>
                  <button
                    className={`w-full bg-white text-gray-900 rounded-xl font-semibold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                      deviceType === "tablet"
                        ? "px-4 py-3 text-base"
                        : "px-6 py-4 text-lg"
                    }`}
                  >
                    Search Properties
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
