import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Shield, Award, Users, Clock, CheckCircle, Star } from "lucide-react";
import { AgencyData, BrandColors } from "../../types/preview";

interface AboutSectionProps {
  agency: AgencyData;
  colors: BrandColors;
  highlightRegion?: string;
  deviceType?: "desktop" | "tablet" | "mobile";
}

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  colors,
  deviceType = "desktop",
}: {
  icon: any;
  title: string;
  description: string;
  colors: BrandColors;
  deviceType?: "desktop" | "tablet" | "mobile";
}) => (
  <motion.div
    whileHover={{ y: -10, scale: 1.02 }}
    className={`bg-white shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 ${
      deviceType === "mobile"
        ? "p-4 rounded-xl"
        : deviceType === "tablet"
        ? "p-5 rounded-xl"
        : "p-6 rounded-2xl"
    }`}
  >
    <div
      className={`rounded-xl flex items-center justify-center ${
        deviceType === "mobile" ? "w-10 h-10 mb-3" : "w-12 h-12 mb-4"
      }`}
      style={{ backgroundColor: `${colors.primary}15` }}
    >
      <Icon
        className={`${deviceType === "mobile" ? "w-5 h-5" : "w-6 h-6"}`}
        style={{ color: colors.primary }}
      />
    </div>
    <h3
      className={`font-semibold text-gray-900 mb-2 ${
        deviceType === "mobile" ? "text-base" : "text-lg"
      }`}
    >
      {title}
    </h3>
    <p className={`text-gray-600 ${deviceType === "mobile" ? "text-sm" : ""}`}>
      {description}
    </p>
  </motion.div>
);

const StatCard = ({
  number,
  label,
  colors,
  deviceType = "desktop",
}: {
  number: string;
  label: string;
  colors: BrandColors;
  deviceType?: "desktop" | "tablet" | "mobile";
}) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className={`text-center bg-white/50 backdrop-blur-sm border border-white/20 ${
      deviceType === "mobile"
        ? "p-4 rounded-xl"
        : deviceType === "tablet"
        ? "p-5 rounded-xl"
        : "p-6 rounded-2xl"
    }`}
  >
    <div
      className="text-3xl lg:text-4xl font-bold mb-2"
      style={{ color: colors.primary }}
    >
      {number}
    </div>
    <div className="text-gray-600 font-medium">{label}</div>
  </motion.div>
);

export const AboutSection: React.FC<AboutSectionProps> = ({
  agency,
  colors,
  highlightRegion,
  deviceType = "desktop",
}) => {
  const features = [
    {
      icon: Shield,
      title: "Verified & Secure",
      description:
        "All properties are verified for safety and security standards.",
    },
    {
      icon: Award,
      title: "Premium Quality",
      description:
        "Hand-picked properties that meet our high quality standards.",
    },
    {
      icon: Users,
      title: "Personalized Service",
      description: "Dedicated support throughout your entire stay experience.",
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description: "Round-the-clock assistance for all your needs.",
    },
  ];

  const stats = agency.stats || {
    totalProperties: 50,
    happyGuests: 2500,
    averageRating: 4.9,
    yearsExperience: 5,
  };

  const achievements = agency.achievements || [
    "Top Host 2023",
    "Excellence in Service Award",
    "5-Star Rating Champion",
    "Customer Choice Award",
  ];

  return (
    <motion.section
      animate={
        highlightRegion === "about"
          ? {
              boxShadow: "0 0 0 2px #3B82F6, 0 0 0 4px rgba(59, 130, 246, 0.2)",
              scale: 1.01,
            }
          : {}
      }
      transition={{ duration: 0.3 }}
      className="py-12 bg-gradient-to-br from-white via-gray-50 to-white overflow-hidden"
      id="about"
    >
      <div
        className={`max-w-7xl mx-auto ${
          deviceType === "mobile"
            ? "px-4"
            : deviceType === "tablet"
            ? "px-6"
            : "px-8"
        }`}
      >
        {/* Section Header */}
        <div
          className={`text-center ${deviceType === "mobile" ? "mb-4" : "mb-8"}`}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className={`inline-block px-4 py-2 rounded-full font-medium ${
              deviceType === "mobile" ? "text-xs mb-2" : "text-sm mb-4"
            }`}
            style={{
              backgroundColor: `${colors.secondary}15`,
              color: colors.secondary,
            }}
          >
            About Us
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className={`font-bold text-gray-900 ${
              deviceType === "mobile"
                ? "text-2xl mb-3"
                : deviceType === "tablet"
                ? "text-3xl mb-4"
                : "text-4xl lg:text-5xl mb-6"
            }`}
          >
            Why Choose Us
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className={`text-gray-600 max-w-3xl mx-auto ${
              deviceType === "mobile"
                ? "text-sm"
                : deviceType === "tablet"
                ? "text-base"
                : "text-xl"
            }`}
          >
            {agency.description ||
              "Experience excellence in hospitality with our premium short-let properties."}
          </motion.p>
        </div>

        {/* Main Content Grid */}
        <div
          className={`grid items-center ${
            deviceType === "mobile"
              ? "grid-cols-1 gap-4 mb-6"
              : deviceType === "tablet"
              ? "grid-cols-1 gap-6 mb-8"
              : "lg:grid-cols-2 gap-8 mb-10"
          }`}
        >
          {/* Left Content - Agency Info */}
          <div
            className={`${
              deviceType === "mobile"
                ? "space-y-4"
                : deviceType === "tablet"
                ? "space-y-6"
                : "space-y-8"
            }`}
          >
            <div
              className={`${
                deviceType === "mobile" ? "space-y-3" : "space-y-6"
              }`}
            >
              <h3
                className={`font-bold text-gray-900 ${
                  deviceType === "mobile"
                    ? "text-lg"
                    : deviceType === "tablet"
                    ? "text-xl"
                    : "text-2xl"
                }`}
              >
                {agency.name} - Your Trusted Partner
              </h3>
              <p
                className={`text-gray-600 leading-relaxed ${
                  deviceType === "mobile"
                    ? "text-sm"
                    : deviceType === "tablet"
                    ? "text-base"
                    : "text-lg"
                }`}
              >
                {agency.fullDescription ||
                  "We are dedicated to providing exceptional short-let experiences that exceed your expectations. Our carefully curated properties and personalized service ensure every stay is memorable."}
              </p>
            </div>

            {/* Key Features List */}
            <div
              className={`${
                deviceType === "mobile" ? "space-y-2" : "space-y-4"
              }`}
            >
              {[
                "Professional Management",
                "Hand-picked Properties",
                "Seamless Booking",
                "Local Expertise",
              ].map((feature: string, idx: number) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className={`flex items-center ${
                    deviceType === "mobile" ? "gap-2" : "gap-3"
                  }`}
                >
                  <CheckCircle
                    className={`flex-shrink-0 ${
                      deviceType === "mobile" ? "w-4 h-4" : "w-5 h-5"
                    }`}
                    style={{ color: colors.accent }}
                  />
                  <span
                    className={`text-gray-700 ${
                      deviceType === "mobile" ? "text-sm" : ""
                    }`}
                  >
                    {feature}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Achievements */}
            <div>
              <h4
                className={`font-semibold text-gray-900 ${
                  deviceType === "mobile" ? "text-sm mb-2" : "mb-4"
                }`}
              >
                Awards & Recognition
              </h4>
              <div
                className={`flex flex-wrap ${
                  deviceType === "mobile" ? "gap-2" : "gap-3"
                }`}
              >
                {achievements.map((achievement: string, idx: number) => (
                  <span
                    key={idx}
                    className={`rounded-full border ${
                      deviceType === "mobile"
                        ? "px-2 py-1 text-xs"
                        : "px-3 py-1 text-sm"
                    }`}
                    style={{
                      borderColor: colors.accent,
                      color: colors.accent,
                      backgroundColor: `${colors.accent}10`,
                    }}
                  >
                    {achievement}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right Content - Stats & Image */}
          <div
            className={`${
              deviceType === "mobile"
                ? "space-y-4"
                : deviceType === "tablet"
                ? "space-y-6"
                : "space-y-8"
            }`}
          >
            {/* Agency Image or Placeholder - Hide on mobile for space */}
            {deviceType !== "mobile" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
                className="relative"
              >
                {agency.heroImage ? (
                  <div
                    className={`relative overflow-hidden shadow-2xl ${
                      deviceType === "tablet"
                        ? "h-64 rounded-2xl"
                        : "h-80 rounded-3xl"
                    }`}
                  >
                    <Image
                      src={agency.heroImage}
                      alt={`${agency.name} Office`}
                      fill
                      className="object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                ) : (
                  <div
                    className={`shadow-2xl flex items-center justify-center ${
                      deviceType === "tablet"
                        ? "h-64 rounded-2xl"
                        : "h-80 rounded-3xl"
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary}20, ${colors.secondary}20)`,
                    }}
                  >
                    <div
                      className={`text-center ${
                        deviceType === "tablet" ? "space-y-3" : "space-y-4"
                      }`}
                    >
                      <div
                        className={`mx-auto flex items-center justify-center ${
                          deviceType === "tablet"
                            ? "w-16 h-16 rounded-xl"
                            : "w-20 h-20 rounded-2xl"
                        }`}
                        style={{ backgroundColor: colors.primary }}
                      >
                        <span
                          className={`font-bold text-white ${
                            deviceType === "tablet" ? "text-xl" : "text-2xl"
                          }`}
                        >
                          {agency.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <p
                        className={`text-gray-600 font-medium ${
                          deviceType === "tablet" ? "text-sm" : ""
                        }`}
                      >
                        {agency.name}
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Stats Grid */}
            <div
              className={`grid grid-cols-2 ${
                deviceType === "mobile" ? "gap-2" : "gap-4"
              }`}
            >
              <StatCard
                number={`${stats.totalProperties}+`}
                label="Properties"
                colors={colors}
                deviceType={deviceType}
              />
              <StatCard
                number={`${stats.happyGuests}+`}
                label="Happy Guests"
                colors={colors}
                deviceType={deviceType}
              />
              <StatCard
                number={`${stats.averageRating}`}
                label="Rating"
                colors={colors}
                deviceType={deviceType}
              />
              <StatCard
                number={`${stats.yearsExperience}+`}
                label="Years Experience"
                colors={colors}
                deviceType={deviceType}
              />
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div
          className={`grid ${
            deviceType === "mobile"
              ? "grid-cols-1 gap-4"
              : deviceType === "tablet"
              ? "grid-cols-2 gap-5"
              : "md:grid-cols-2 lg:grid-cols-4 gap-6"
          }`}
        >
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              <FeatureCard
                {...feature}
                colors={colors}
                deviceType={deviceType}
              />
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className={`text-center ${
            deviceType === "mobile" ? "mt-8" : "mt-16"
          }`}
        >
          <div
            className={`inline-block ${
              deviceType === "mobile"
                ? "p-4 rounded-2xl"
                : deviceType === "tablet"
                ? "p-6 rounded-2xl"
                : "p-8 rounded-3xl"
            }`}
            style={{
              background: `linear-gradient(135deg, ${colors.primary}10, ${colors.secondary}10)`,
              border: `1px solid ${colors.primary}20`,
            }}
          >
            <h3
              className={`font-bold text-gray-900 ${
                deviceType === "mobile"
                  ? "text-lg mb-2"
                  : deviceType === "tablet"
                  ? "text-xl mb-3"
                  : "text-2xl mb-4"
              }`}
            >
              Ready to Book?
            </h3>
            <p
              className={`text-gray-600 ${
                deviceType === "mobile"
                  ? "text-sm mb-4"
                  : deviceType === "tablet"
                  ? "text-sm mb-5"
                  : "mb-6"
              }`}
            >
              Join thousands of satisfied guests who trust us with their
              accommodation needs.
            </p>
            <button
              className={`rounded-xl font-semibold text-white transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                deviceType === "mobile"
                  ? "px-6 py-3 text-sm"
                  : deviceType === "tablet"
                  ? "px-7 py-3.5 text-base"
                  : "px-8 py-4"
              }`}
              style={{ backgroundColor: colors.primary }}
            >
              Start Booking
            </button>
          </div>
        </motion.div>
      </div>
    </motion.section>
  );
};
