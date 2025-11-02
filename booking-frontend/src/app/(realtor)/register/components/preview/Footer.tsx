import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Instagram,
  Twitter,
  Globe,
  Heart,
  Shield,
  Award,
} from "lucide-react";
import { AgencyData, BrandColors } from "../../types/preview";

interface FooterProps {
  agency: AgencyData;
  colors: BrandColors;
  highlightRegion?: string;
  deviceType?: "desktop" | "tablet" | "mobile";
}

const FooterLink = ({
  href,
  children,
  colors,
  deviceType = "desktop",
}: {
  href: string;
  children: React.ReactNode;
  colors: BrandColors;
  deviceType?: "desktop" | "tablet" | "mobile";
}) => (
  <motion.a
    href={href}
    whileHover={{ x: 5 }}
    className={`text-gray-400 hover:transition-all duration-200 ${
      deviceType === "mobile" ? "text-sm" : ""
    }`}
    style={
      {
        "--hover-color": colors.accent,
      } as React.CSSProperties
    }
    onMouseEnter={(e) => {
      e.currentTarget.style.color = colors.accent;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.color = "#9CA3AF"; // gray-400
    }}
  >
    {children}
  </motion.a>
);

const SocialIcon = ({
  icon: Icon,
  href,
  colors,
  deviceType = "desktop",
}: {
  icon: any;
  href: string;
  colors: BrandColors;
  deviceType?: "desktop" | "tablet" | "mobile";
}) => (
  <motion.a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    whileHover={{ scale: 1.2, rotate: 5 }}
    whileTap={{ scale: 0.9 }}
    className={`rounded-lg flex items-center justify-center transition-all duration-200 bg-gray-800 hover:shadow-lg ${
      deviceType === "mobile" ? "w-8 h-8" : "w-10 h-10"
    }`}
    style={
      {
        "--hover-bg": colors.accent,
      } as React.CSSProperties
    }
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = colors.accent;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = "#1F2937"; // gray-800
    }}
  >
    <Icon
      className={`text-gray-300 ${
        deviceType === "mobile" ? "w-4 h-4" : "w-5 h-5"
      }`}
    />
  </motion.a>
);

export const Footer: React.FC<FooterProps> = ({
  agency,
  colors,
  highlightRegion,
  deviceType = "desktop",
}) => {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { label: "Home", href: "#home" },
    { label: "Properties", href: "#properties" },
    { label: "About Us", href: "#about" },
    { label: "Contact Us", href: "#contact" },
  ];

  const legalLinks = [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Cookie Policy", href: "/cookies" },
    { label: "Refund Policy", href: "/refunds" },
  ];

  const supportLinks = [
    { label: "Help Center", href: "/help" },
    { label: "Booking Guide", href: "/guide" },
    { label: "Cancellation", href: "/cancel" },
    { label: "Guest Support", href: "/support" },
  ];

  const socialLinks = [
    {
      icon: Facebook,
      href: agency.socialLinks?.facebook || "#",
      platform: "Facebook",
    },
    {
      icon: Instagram,
      href: agency.socialLinks?.instagram || "#",
      platform: "Instagram",
    },
    {
      icon: Twitter,
      href: agency.socialLinks?.twitter || "#",
      platform: "Twitter",
    },
    {
      icon: Globe,
      href: agency.website || "#",
      platform: "Website",
    },
  ];

  return (
    <motion.footer
      animate={
        highlightRegion === "footer"
          ? {
              boxShadow: "0 0 0 2px #3B82F6, 0 0 0 4px rgba(59, 130, 246, 0.2)",
              scale: 1.01,
            }
          : {}
      }
      transition={{ duration: 0.3 }}
      className="bg-gray-900 text-white"
    >
      {/* Main Footer Content */}
      <div
        className={`max-w-7xl mx-auto ${
          deviceType === "mobile"
            ? "px-4 pt-4 pb-3"
            : deviceType === "tablet"
            ? "px-6 pt-6 pb-4"
            : "px-8 pt-8 pb-6"
        }`}
      >
        <div
          className={`grid gap-12 ${
            deviceType === "mobile"
              ? "grid-cols-1 gap-6"
              : deviceType === "tablet"
              ? "grid-cols-2 gap-8"
              : "lg:grid-cols-4 md:grid-cols-2"
          }`}
        >
          {/* Company Info */}
          <div
            className={`${
              deviceType === "mobile"
                ? "space-y-4"
                : deviceType === "tablet"
                ? "space-y-5"
                : "lg:col-span-1 space-y-6"
            }`}
          >
            <div
              className={`flex items-center ${
                deviceType === "mobile" ? "space-x-3" : "space-x-4"
              }`}
            >
              {agency.logo ? (
                <div
                  className={`rounded-xl overflow-hidden ring-2 ring-white/20 ${
                    deviceType === "mobile" ? "w-10 h-10" : "w-12 h-12"
                  }`}
                >
                  <Image
                    src={agency.logo}
                    alt={`${agency.name} Logo`}
                    width={deviceType === "mobile" ? 40 : 48}
                    height={deviceType === "mobile" ? 40 : 48}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div
                  className={`rounded-xl flex items-center justify-center ${
                    deviceType === "mobile" ? "w-10 h-10" : "w-12 h-12"
                  }`}
                  style={{ backgroundColor: colors.primary }}
                >
                  <span
                    className={`font-bold text-white ${
                      deviceType === "mobile" ? "text-lg" : "text-xl"
                    }`}
                  >
                    {agency.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h3
                  className={`font-bold ${
                    deviceType === "mobile"
                      ? "text-lg"
                      : deviceType === "tablet"
                      ? "text-lg"
                      : "text-xl"
                  }`}
                >
                  {agency.name}
                </h3>
                <p
                  className={`text-gray-400 ${
                    deviceType === "mobile" ? "text-xs" : "text-sm"
                  }`}
                >
                  {agency.tagline || "Premium Short-Let Properties"}
                </p>
              </div>
            </div>

            <p
              className={`text-gray-300 leading-relaxed ${
                deviceType === "mobile" ? "text-xs" : "text-sm"
              }`}
            >
              {agency.description ||
                "Creating exceptional short-let experiences with premium properties and personalized service."}
            </p>

            {/* Trust Badges */}
            <div
              className={`flex items-center ${
                deviceType === "mobile" ? "gap-3" : "gap-4"
              }`}
            >
              <div
                className={`flex items-center gap-1 text-gray-400 ${
                  deviceType === "mobile" ? "text-xs" : "text-sm"
                }`}
              >
                <Shield
                  className={`${
                    deviceType === "mobile" ? "w-3 h-3" : "w-4 h-4"
                  }`}
                />
                <span>Verified</span>
              </div>
              <div
                className={`flex items-center gap-1 text-gray-400 ${
                  deviceType === "mobile" ? "text-xs" : "text-sm"
                }`}
              >
                <Award
                  className={`${
                    deviceType === "mobile" ? "w-3 h-3" : "w-4 h-4"
                  }`}
                />
                <span>Certified</span>
              </div>
            </div>

            {/* Social Links */}
            <div
              className={`flex items-center ${
                deviceType === "mobile" ? "gap-2" : "gap-3"
              }`}
            >
              {socialLinks.map((social, idx) => (
                <SocialIcon
                  key={idx}
                  icon={social.icon}
                  href={social.href}
                  colors={colors}
                  deviceType={deviceType}
                />
              ))}
            </div>
          </div>

          {/* Quick Links - Only show on desktop and tablet */}
          {deviceType !== "mobile" && (
            <div
              className={`${
                deviceType === "tablet" ? "space-y-4" : "space-y-6"
              }`}
            >
              <h4
                className={`font-semibold ${
                  deviceType === "tablet" ? "text-base" : "text-lg"
                }`}
              >
                Quick Links
              </h4>
              <nav
                className={`${
                  deviceType === "tablet" ? "space-y-2" : "space-y-3"
                }`}
              >
                {quickLinks.map((link, idx) => (
                  <div key={idx}>
                    <FooterLink
                      href={link.href}
                      colors={colors}
                      deviceType={deviceType}
                    >
                      {link.label}
                    </FooterLink>
                  </div>
                ))}
              </nav>
            </div>
          )}

          {/* Support - Only show on desktop and tablet */}
          {deviceType !== "mobile" && (
            <div
              className={`${
                deviceType === "tablet" ? "space-y-4" : "space-y-6"
              }`}
            >
              <h4
                className={`font-semibold ${
                  deviceType === "tablet" ? "text-base" : "text-lg"
                }`}
              >
                Support
              </h4>
              <nav
                className={`${
                  deviceType === "tablet" ? "space-y-2" : "space-y-3"
                }`}
              >
                {supportLinks.map((link, idx) => (
                  <div key={idx}>
                    <FooterLink
                      href={link.href}
                      colors={colors}
                      deviceType={deviceType}
                    >
                      {link.label}
                    </FooterLink>
                  </div>
                ))}
              </nav>
            </div>
          )}

          {/* Contact Info */}
          <div
            className={`${
              deviceType === "mobile"
                ? "space-y-3"
                : deviceType === "tablet"
                ? "space-y-4"
                : "space-y-6"
            }`}
          >
            <h4
              className={`font-semibold ${
                deviceType === "mobile"
                  ? "text-base"
                  : deviceType === "tablet"
                  ? "text-base"
                  : "text-lg"
              }`}
            >
              Contact Info
            </h4>
            <div
              className={`${
                deviceType === "mobile" ? "space-y-2" : "space-y-4"
              }`}
            >
              <div
                className={`flex items-start ${
                  deviceType === "mobile" ? "gap-2" : "gap-3"
                }`}
              >
                <MapPin
                  className={`text-gray-400 mt-1 flex-shrink-0 ${
                    deviceType === "mobile" ? "w-4 h-4" : "w-5 h-5"
                  }`}
                />
                <div
                  className={`text-gray-300 ${
                    deviceType === "mobile" ? "text-xs" : "text-sm"
                  }`}
                >
                  {agency.address || "123 Business Street\nCity, State 12345"}
                </div>
              </div>

              <div
                className={`flex items-center ${
                  deviceType === "mobile" ? "gap-2" : "gap-3"
                }`}
              >
                <Phone
                  className={`text-gray-400 flex-shrink-0 ${
                    deviceType === "mobile" ? "w-4 h-4" : "w-5 h-5"
                  }`}
                />
                <a
                  href={`tel:${agency.phone || "+15551234567"}`}
                  className={`text-gray-300 hover:transition-colors duration-200 ${
                    deviceType === "mobile" ? "text-xs" : "text-sm"
                  }`}
                  style={
                    {
                      "--hover-color": colors.accent,
                    } as React.CSSProperties
                  }
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = colors.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#D1D5DB"; // gray-300
                  }}
                >
                  {agency.phone || "+1 (555) 123-4567"}
                </a>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <a
                  href={`mailto:${agency.email || "hello@stayza.com"}`}
                  className="text-sm text-gray-300 hover:transition-colors duration-200"
                  style={
                    {
                      "--hover-color": colors.accent,
                    } as React.CSSProperties
                  }
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = colors.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#D1D5DB"; // gray-300
                  }}
                >
                  {agency.email || "hello@stayza.com"}
                </a>
              </div>
            </div>

            {/* Emergency Contact */}
            <div
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: `${colors.accent}20`,
                borderColor: `${colors.accent}40`,
              }}
            >
              <h5 className="font-semibold text-sm mb-2">Emergency</h5>
              <a
                href={`tel:${agency.emergencyPhone || "+15551234567"}`}
                className="text-sm font-medium"
                style={{ color: colors.accent }}
              >
                {agency.emergencyPhone || "+1 (555) 123-4567"}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Links */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex flex-wrap justify-center gap-6 mb-4">
            {legalLinks.map((link, idx) => (
              <FooterLink key={idx} href={link.href} colors={colors}>
                {link.label}
              </FooterLink>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>
                © {currentYear} {agency.name}.
              </span>
              <div className="flex items-center gap-1">
                <span>Powered by</span>
                <motion.span
                  className="font-semibold"
                  style={{ color: colors.accent }}
                  whileHover={{ scale: 1.05 }}
                >
                  Stayza Pro
                </motion.span>
                <Heart className="w-4 h-4 text-red-500" />
              </div>
            </div>

            {/* Additional Info */}
            <div className="flex items-center gap-4 text-sm text-gray-400">
              <span>All rights reserved</span>
              <div className="flex items-center gap-1">
                <span>Made with</span>
                <Heart className="w-3 h-3 text-red-500" />
                <span>in Nigeria</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};
