"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, HelpCircle, X, Send } from "lucide-react";
import { apiClient } from "@/services/api";
import { getRealtorSubdomain } from "@/utils/subdomain";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface FooterProps {
  realtorName: string;
  tagline: string;
  logo?: string;
  description: string;
  primaryColor: string; // 60% - Used for border top accent and primary buttons
  secondaryColor?: string; // 30% - Used for text and secondary elements
  accentColor?: string; // 10% - Used for CTAs and highlights
  realtorId?: string;
}

export const Footer: React.FC<FooterProps> = ({
  realtorName,
  tagline,
  logo,
  description,
  primaryColor,
  secondaryColor = "#10B981", // Default secondary color
  accentColor = "#F59E0B", // Default accent color
  realtorId,
}) => {
  const router = useRouter();
  const { isAuthenticated } = useCurrentUser();
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactType, setContactType] = useState<"realtor" | "support" | null>(
    null
  );
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [resolvedRealtorId, setResolvedRealtorId] = useState(realtorId || "");
  const activeRealtorId = realtorId || resolvedRealtorId;

  const getErrorText = (error: unknown): string => {
    const fallback = "Unable to send your message right now. Please try again.";

    if (!error || typeof error !== "object") {
      return fallback;
    }

    const responseData = (
      error as {
        response?: {
          data?: {
            message?: unknown;
            error?: unknown;
          };
        };
      }
    ).response?.data;

    const maybeMessage = responseData?.message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) {
      return maybeMessage;
    }

    const maybeError = responseData?.error;
    if (typeof maybeError === "string" && maybeError.trim()) {
      return maybeError;
    }

    if (
      maybeError &&
      typeof maybeError === "object" &&
      "message" in maybeError &&
      typeof (maybeError as { message?: unknown }).message === "string"
    ) {
      const nestedMessage = (maybeError as { message: string }).message.trim();
      if (nestedMessage) {
        return nestedMessage;
      }
    }

    return fallback;
  };

  const navLinks = [
    { label: "Home", href: "/guest-landing" },
    { label: "Browse Properties", href: "/guest/browse" },
    { label: "Bookings", href: "/guest/bookings" },
    { label: "Favorites", href: "/guest/favorites" },
    { label: "Help", href: "/guest/help" },
  ];

  useEffect(() => {
    if (realtorId) {
      setResolvedRealtorId(realtorId);
      return;
    }

    const subdomain = getRealtorSubdomain();
    if (!subdomain) {
      return;
    }

    const resolveRealtorId = async () => {
      try {
        const response = await apiClient.get<{ id?: string }>(
          `/branding/subdomain/${subdomain}`
        );
        if (response.data?.id) {
          setResolvedRealtorId(response.data.id);
        }
      } catch (error) {
        setResolvedRealtorId("");
      }
    };

    resolveRealtorId();
  }, [realtorId]);

  const handleContactClick = () => {
    setShowContactModal(true);
    setContactType(null);
    setSubmitSuccess(false);
    setSubmitError("");
  };

  const handleContactTypeSelect = (type: "realtor" | "support") => {
    if (type === "support") {
      // Redirect to Stayza support
      window.location.href =
        "mailto:support@stayza.com?subject=Support Request";
      setShowContactModal(false);
      setSubmitError("");
    } else {
      if (!isAuthenticated) {
        setShowContactModal(false);
        router.push(
          `/guest/login?returnTo=${encodeURIComponent("/guest/messages")}`
        );
        return;
      }
      setContactType(type);
    }
  };

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      if (!isAuthenticated) {
        router.push(
          `/guest/login?returnTo=${encodeURIComponent("/guest/messages")}`
        );
        return;
      }

      if (!activeRealtorId) {
        setSubmitError("Unable to locate this realtor. Please try again.");
        return;
      }

      const response = await apiClient.post<
        { messageId: string; propertyId?: string; realtorUserId: string },
        { message: string }
      >(`/realtors/${activeRealtorId}/contact`, {
        message: message.trim(),
      });

      setSubmitSuccess(true);
      setMessage("");

      setTimeout(() => {
        setShowContactModal(false);
        setSubmitSuccess(false);
        setContactType(null);
        const propertyId = response.data?.propertyId;
        router.push(
          propertyId
            ? `/guest/messages?propertyId=${propertyId}`
            : "/guest/messages"
        );
      }, 800);
    } catch (error: unknown) {
      setSubmitError(getErrorText(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNavigate = (href: string) => {
    router.push(href);
  };

  return (
    <>
      <footer
        className="relative bg-gray-900 text-white py-12 px-6"
        style={{
          borderTop: `3px solid ${primaryColor}`,
        }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mb-12">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                {logo && logo.trim() !== "" ? (
                  <img
                    src={logo}
                    alt={`${realtorName} logo`}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-xl"
                    style={{ backgroundColor: primaryColor }} // 60% - Primary color for logo fallback
                  >
                    {realtorName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <h3
                    className="font-bold text-xl"
                    style={{ color: secondaryColor }}
                  >
                    {realtorName}
                  </h3>
                  {tagline && tagline.trim() !== "" && (
                    <p className="text-gray-400 text-sm">{tagline}</p>
                  )}
                </div>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                {description ||
                  "Your trusted partner for exceptional accommodation experiences."}
              </p>
            </div>

            {/* Navigation Links */}
            <div>
              <h4
                className="font-semibold text-lg mb-4"
                style={{ color: secondaryColor }}
              >
                Navigation
              </h4>
              <nav className="flex flex-col space-y-3">
                {navLinks.map((link) => (
                  <button
                    key={link.label}
                    onClick={() => handleNavigate(link.href)}
                    className="text-gray-400 text-sm text-left transition-colors duration-200"
                    style={{
                      color: "rgba(156, 163, 175, 1)", // gray-400
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = secondaryColor; // 30% - Secondary color on hover
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "rgba(156, 163, 175, 1)";
                    }}
                  >
                    {link.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Contact Section */}
            <div>
              <h4
                className="font-semibold text-lg mb-4"
                style={{ color: secondaryColor }}
              >
                Get in Touch
              </h4>
              <p className="text-gray-400 text-sm mb-4">
                Have questions or need assistance? We are here to help.
              </p>
              <button
                onClick={handleContactClick}
                className="flex items-center gap-2 px-6 py-3 rounded-lg text-white font-medium transition-all duration-200 hover:opacity-90"
                style={{ backgroundColor: accentColor }} // 10% - Accent color for CTA button
              >
                <MessageCircle size={18} />
                Contact Us
              </button>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-gray-800">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-sm">
                Copyright {new Date().getFullYear()} {realtorName}. All rights reserved.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-xs">Powered by</span>
                <span
                  className="font-semibold text-sm"
                  style={{ color: secondaryColor }} // 30% - Secondary color for branding
                >
                  Stayza{" "}
                  <span className="text-gray-500 font-extrabold">Pro</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div
              className="px-6 py-4 text-white flex justify-between items-center"
              style={{ backgroundColor: primaryColor }}
            >
              <h3 className="text-xl font-bold">Contact Options</h3>
              <button
                onClick={() => {
                  setShowContactModal(false);
                  setContactType(null);
                  setSubmitSuccess(false);
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              {!contactType && !submitSuccess && (
                <div className="space-y-4">
                  <p className="text-gray-600 mb-6">How can we assist you?</p>

                  <button
                    onClick={() => handleContactTypeSelect("realtor")}
                    className="w-full flex items-center gap-4 p-4 border-2 rounded-xl transition-colors text-left"
                    style={{
                      borderColor: `${primaryColor}40`, // 60% - Primary color border
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = primaryColor;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = `${primaryColor}40`;
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white"
                      style={{ backgroundColor: secondaryColor }} // 30% - Secondary color
                    >
                      <MessageCircle size={24} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Contact {realtorName}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Ask about properties and bookings
                      </p>
                    </div>
                  </button>

                  <button
                    onClick={() => handleContactTypeSelect("support")}
                    className="w-full flex items-center gap-4 p-4 border-2 border-gray-200 rounded-xl hover:border-gray-300 transition-colors text-left"
                  >
                    <div className="w-12 h-12 bg-gray-900 rounded-full flex items-center justify-center text-white">
                      <HelpCircle size={24} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Contact Stayza Support
                      </h4>
                      <p className="text-sm text-gray-600">
                        Get help with platform issues
                      </p>
                    </div>
                  </button>
                </div>
              )}

              {contactType === "realtor" && !submitSuccess && (
                <form onSubmit={handleSubmitMessage} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-opacity-50 outline-none resize-none"
                      placeholder="Tell us how we can help..."
                    />
                  </div>

                  {submitError && (
                    <p className="text-sm text-red-600">{submitError}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setContactType(null)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 px-4 py-3 rounded-lg text-white font-medium transition-all duration-200 hover:opacity-90 flex items-center justify-center gap-2"
                      style={{ backgroundColor: accentColor }} // 10% - Accent color for submit button
                    >
                      {isSubmitting ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send size={18} />
                          Send Message
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {submitSuccess && (
                <div className="text-center py-8">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                    style={{ backgroundColor: `${accentColor}20` }} // 10% - Accent color with transparency
                  >
                    <svg
                      className="w-8 h-8"
                      style={{ color: accentColor }} // 10% - Accent color for success icon
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    Message Sent!
                  </h4>
                  <p className="text-gray-600">
                    Your message is now in your in-app conversation with {realtorName}.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

