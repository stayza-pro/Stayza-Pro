import React from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  MessageSquare,
  Globe,
  Instagram,
  Facebook,
  Twitter,
} from "lucide-react";
import { AgencyData, BrandColors } from "../../types/preview";
import { useAlert } from "@/context/AlertContext";

interface ContactSectionProps {
  agency: AgencyData;
  colors: BrandColors;
  highlightRegion?: string;
  deviceType?: "desktop" | "tablet" | "mobile";
}

const ContactCard = ({
  icon: Icon,
  title,
  content,
  colors,
  action,
  deviceType = "desktop",
}: {
  icon: any;
  title: string;
  content: string;
  colors: BrandColors;
  action?: () => void;
  deviceType?: "desktop" | "tablet" | "mobile";
}) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    className={`bg-white shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 cursor-pointer ${
      deviceType === "mobile"
        ? "p-4 rounded-xl"
        : deviceType === "tablet"
        ? "p-5 rounded-xl"
        : "p-6 rounded-2xl"
    }`}
    onClick={action}
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
        deviceType === "mobile" ? "text-sm" : ""
      }`}
    >
      {title}
    </h3>
    <p className={`text-gray-600 ${deviceType === "mobile" ? "text-xs" : ""}`}>
      {content}
    </p>
  </motion.div>
);

const SocialButton = ({
  icon: Icon,
  platform,
  url,
  colors,
  deviceType = "desktop",
}: {
  icon: any;
  platform: string;
  url?: string;
  colors: BrandColors;
  deviceType?: "desktop" | "tablet" | "mobile";
}) => (
  <motion.a
    href={url || "#"}
    target="_blank"
    rel="noopener noreferrer"
    whileHover={{ scale: 1.1, rotate: 5 }}
    whileTap={{ scale: 0.95 }}
    className={`rounded-xl flex items-center justify-center transition-all duration-200 shadow-md hover:shadow-lg ${
      deviceType === "mobile" ? "w-10 h-10" : "w-12 h-12"
    }`}
    style={{
      backgroundColor: colors.accent,
      color: "white",
    }}
  >
    <Icon className={`${deviceType === "mobile" ? "w-4 h-4" : "w-5 h-5"}`} />
  </motion.a>
);

export const ContactSection: React.FC<ContactSectionProps> = ({
  agency,
  colors,
  highlightRegion,
  deviceType = "desktop",
}) => {
  const { showSuccess, showInfo } = useAlert();

  const contactMethods = [
    {
      icon: Phone,
      title: "Call Us",
      content: agency.phone || "+1 (555) 123-4567",
      action: () => window.open(`tel:${agency.phone || "+15551234567"}`),
    },
    {
      icon: Mail,
      title: "Email Us",
      content: agency.email || "hello@stayza.com",
      action: () => window.open(`mailto:${agency.email || "hello@stayza.com"}`),
    },
    {
      icon: MapPin,
      title: "Visit Us",
      content: agency.address || "123 Business St, City, State 12345",
      action: () =>
        window.open(
          `https://maps.google.com/?q=${encodeURIComponent(
            agency.address || "123 Business St"
          )}`
        ),
    },
    {
      icon: MessageSquare,
      title: "Live Chat",
      content: "Chat available 24/7",
      action: () => {
        showInfo("Live chat coming soon!");
      },
    },
  ];

  const socialLinks = [
    { icon: Facebook, platform: "Facebook", url: agency.socialLinks?.facebook },
    {
      icon: Instagram,
      platform: "Instagram",
      url: agency.socialLinks?.instagram,
    },
    { icon: Twitter, platform: "Twitter", url: agency.socialLinks?.twitter },
    { icon: Globe, platform: "Website", url: agency.website },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showSuccess("Message sent successfully!");
  };

  return (
    <motion.section
      animate={
        highlightRegion === "contact"
          ? {
              boxShadow: "0 0 0 2px #3B82F6, 0 0 0 4px rgba(59, 130, 246, 0.2)",
              scale: 1.01,
            }
          : {}
      }
      transition={{ duration: 0.3 }}
      className="py-12 bg-gradient-to-br from-gray-50 to-white"
      id="contact"
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
              backgroundColor: `${colors.accent}15`,
              color: colors.accent,
            }}
          >
            Get in Touch
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
            Contact Us
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
            We're ready to help you find your perfect accommodation
          </motion.p>
        </div>

        {/* Contact Methods Grid */}
        <div
          className={`grid ${
            deviceType === "mobile"
              ? "grid-cols-1 gap-4 mb-4"
              : deviceType === "tablet"
              ? "grid-cols-2 gap-5 mb-6"
              : "md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          }`}
        >
          {contactMethods.map((method, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              <ContactCard
                {...method}
                colors={colors}
                deviceType={deviceType}
              />
            </motion.div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div
          className={`grid ${
            deviceType === "mobile"
              ? "grid-cols-1 gap-6"
              : deviceType === "tablet"
              ? "grid-cols-1 gap-8"
              : "lg:grid-cols-2 gap-16"
          }`}
        >
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className={`bg-white shadow-xl border border-gray-100 ${
              deviceType === "mobile"
                ? "p-4 rounded-2xl"
                : deviceType === "tablet"
                ? "p-6 rounded-2xl"
                : "p-8 rounded-3xl"
            }`}
          >
            <h3
              className={`font-bold text-gray-900 ${
                deviceType === "mobile"
                  ? "text-lg mb-4"
                  : deviceType === "tablet"
                  ? "text-xl mb-5"
                  : "text-2xl mb-6"
              }`}
            >
              Send Message
            </h3>

            <form
              onSubmit={handleSubmit}
              className={`${
                deviceType === "mobile" ? "space-y-4" : "space-y-6"
              }`}
            >
              <div
                className={`grid ${
                  deviceType === "mobile"
                    ? "grid-cols-1 gap-3"
                    : "md:grid-cols-2 gap-4"
                }`}
              >
                <div>
                  <label
                    className={`block font-medium text-gray-700 mb-2 ${
                      deviceType === "mobile" ? "text-xs" : "text-sm"
                    }`}
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    className={`w-full border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all ${
                      deviceType === "mobile" ? "p-3 text-sm" : "p-4"
                    }`}
                    style={
                      {
                        "--tw-ring-color": colors.primary,
                      } as React.CSSProperties
                    }
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <label
                    className={`block font-medium text-gray-700 mb-2 ${
                      deviceType === "mobile" ? "text-xs" : "text-sm"
                    }`}
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    className={`w-full border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all ${
                      deviceType === "mobile" ? "p-3 text-sm" : "p-4"
                    }`}
                    style={
                      {
                        "--tw-ring-color": colors.primary,
                      } as React.CSSProperties
                    }
                    placeholder="Enter your last name"
                  />
                </div>
              </div>

              <div>
                <label
                  className={`block font-medium text-gray-700 mb-2 ${
                    deviceType === "mobile" ? "text-xs" : "text-sm"
                  }`}
                >
                  Email
                </label>
                <input
                  type="email"
                  className={`w-full border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all ${
                    deviceType === "mobile" ? "p-3 text-sm" : "p-4"
                  }`}
                  style={
                    {
                      "--tw-ring-color": colors.primary,
                    } as React.CSSProperties
                  }
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label
                  className={`block font-medium text-gray-700 mb-2 ${
                    deviceType === "mobile" ? "text-xs" : "text-sm"
                  }`}
                >
                  Subject
                </label>
                <select
                  className={`w-full border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all ${
                    deviceType === "mobile" ? "p-3 text-sm" : "p-4"
                  }`}
                  style={
                    {
                      "--tw-ring-color": colors.primary,
                    } as React.CSSProperties
                  }
                >
                  <option>Select a subject</option>
                  <option>Booking Inquiry</option>
                  <option>Property Information</option>
                  <option>Support</option>
                  <option>Partnership</option>
                </select>
              </div>

              <div>
                <label
                  className={`block font-medium text-gray-700 mb-2 ${
                    deviceType === "mobile" ? "text-xs" : "text-sm"
                  }`}
                >
                  Message
                </label>
                <textarea
                  rows={deviceType === "mobile" ? 3 : 5}
                  className={`w-full border border-gray-200 rounded-xl focus:ring-2 focus:border-transparent transition-all resize-none ${
                    deviceType === "mobile" ? "p-3 text-sm" : "p-4"
                  }`}
                  style={
                    {
                      "--tw-ring-color": colors.primary,
                    } as React.CSSProperties
                  }
                  placeholder="Enter your message"
                />
              </div>

              <button
                type="submit"
                className={`w-full flex items-center justify-center gap-2 rounded-xl font-semibold text-white transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-1 ${
                  deviceType === "mobile" ? "py-3 text-sm" : "py-4"
                }`}
                style={{ backgroundColor: colors.primary }}
              >
                <Send
                  className={`${
                    deviceType === "mobile" ? "w-4 h-4" : "w-5 h-5"
                  }`}
                />
                Send Message
              </button>
            </form>
          </motion.div>

          {/* Contact Info & Map */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className={`${
              deviceType === "mobile"
                ? "space-y-4"
                : deviceType === "tablet"
                ? "space-y-6"
                : "space-y-8"
            }`}
          >
            {/* Business Hours */}
            <div
              className={`bg-white shadow-lg border border-gray-100 ${
                deviceType === "mobile"
                  ? "p-4 rounded-xl"
                  : deviceType === "tablet"
                  ? "p-5 rounded-xl"
                  : "p-6 rounded-2xl"
              }`}
            >
              <div
                className={`flex items-center mb-4 ${
                  deviceType === "mobile" ? "gap-2" : "gap-3"
                }`}
              >
                <Clock
                  className={`${
                    deviceType === "mobile" ? "w-5 h-5" : "w-6 h-6"
                  }`}
                  style={{ color: colors.secondary }}
                />
                <h3
                  className={`font-semibold text-gray-900 ${
                    deviceType === "mobile" ? "text-base" : "text-lg"
                  }`}
                >
                  Business Hours
                </h3>
              </div>
              <div
                className={`text-gray-600 ${
                  deviceType === "mobile" ? "space-y-1 text-sm" : "space-y-2"
                }`}
              >
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span>
                    {agency.businessHours?.weekdays || "9:00 AM - 6:00 PM"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>
                    {agency.businessHours?.saturday || "10:00 AM - 4:00 PM"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>{agency.businessHours?.sunday || "Closed"}</span>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div
              className={`bg-white shadow-lg border border-gray-100 ${
                deviceType === "mobile"
                  ? "p-4 rounded-xl"
                  : deviceType === "tablet"
                  ? "p-5 rounded-xl"
                  : "p-6 rounded-2xl"
              }`}
            >
              <h3
                className={`font-semibold text-gray-900 ${
                  deviceType === "mobile" ? "text-base mb-3" : "text-lg mb-4"
                }`}
              >
                Follow Us
              </h3>
              <div
                className={`flex ${
                  deviceType === "mobile" ? "gap-3" : "gap-4"
                }`}
              >
                {socialLinks.map((social, idx) => (
                  <SocialButton
                    key={idx}
                    {...social}
                    colors={colors}
                    deviceType={deviceType}
                  />
                ))}
              </div>
            </div>

            {/* Location Map Placeholder - Hide on mobile for space */}
            {deviceType !== "mobile" && (
              <div
                className={`bg-white shadow-lg border border-gray-100 overflow-hidden ${
                  deviceType === "tablet" ? "rounded-xl" : "rounded-2xl"
                }`}
              >
                <div
                  className={`flex items-center justify-center ${
                    deviceType === "tablet" ? "h-48" : "h-64"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${colors.primary}10, ${colors.secondary}10)`,
                  }}
                >
                  <div className="text-center">
                    <MapPin
                      className={`mx-auto mb-3 ${
                        deviceType === "tablet" ? "w-10 h-10" : "w-12 h-12"
                      }`}
                      style={{ color: colors.primary }}
                    />
                    <p
                      className={`text-gray-600 font-medium ${
                        deviceType === "tablet" ? "text-sm" : ""
                      }`}
                    >
                      Interactive Map
                    </p>
                    <p
                      className={`text-gray-500 mt-1 ${
                        deviceType === "tablet" ? "text-xs" : "text-sm"
                      }`}
                    >
                      {agency.address || "123 Business St, City, State"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Emergency Contact */}
            <div
              className={`border ${
                deviceType === "mobile"
                  ? "p-4 rounded-xl"
                  : deviceType === "tablet"
                  ? "p-5 rounded-xl"
                  : "p-6 rounded-2xl"
              }`}
              style={{
                backgroundColor: `${colors.accent}10`,
                borderColor: colors.accent,
              }}
            >
              <h3
                className={`font-semibold text-gray-900 mb-2 ${
                  deviceType === "mobile" ? "text-sm" : ""
                }`}
              >
                Emergency Contact
              </h3>
              <p
                className={`text-gray-600 mb-3 ${
                  deviceType === "mobile" ? "text-xs" : "text-sm"
                }`}
              >
                For urgent matters during your stay
              </p>
              <a
                href={`tel:${agency.emergencyPhone || "+15551234567"}`}
                className={`inline-flex items-center gap-2 rounded-lg font-semibold text-white transition-all ${
                  deviceType === "mobile" ? "px-3 py-1.5 text-sm" : "px-4 py-2"
                }`}
                style={{ backgroundColor: colors.accent }}
              >
                <Phone
                  className={`${
                    deviceType === "mobile" ? "w-3 h-3" : "w-4 h-4"
                  }`}
                />
                {agency.emergencyPhone || "+1 (555) 123-4567"}
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};
