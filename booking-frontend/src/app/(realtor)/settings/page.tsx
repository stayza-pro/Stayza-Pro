"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useBranding } from "@/hooks/useBranding";
import { getRealtorSubdomain } from "@/utils/subdomain";
import {
  Copy,
  Eye,
  User,
  Palette,
  Bell,
  Shield,
  CreditCard,
  Building2,
  Save,
  Loader2,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";

type SettingsTab =
  | "profile"
  | "branding"
  | "notifications"
  | "security"
  | "business";

export default function SettingsPage() {
  const { user } = useAuth();
  const { branding } = useBranding();
  const realtorSubdomain = getRealtorSubdomain();

  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");
  const [saving, setSaving] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    branding?.logoUrl || null
  );
  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    businessName: branding?.businessName || "",
    tagline: branding?.tagline || "",
    primaryColor: branding?.colors?.primary || "#3B82F6",
    secondaryColor: branding?.colors?.secondary || "#1E40AF",
    accentColor: branding?.colors?.accent || "#F59E0B",
    registrationNumber: "",
    taxId: "",
    businessAddress: "",
    city: "",
    state: "",
  });

  const brandColors = branding?.colors || {
    primary: "#3B82F6",
    secondary: "#1E40AF",
    accent: "#F59E0B",
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    setTimeout(() => {
      setSaving(false);
      alert("Settings saved successfully!");
    }, 1000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert("Logo file size must be less than 2MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please upload an image file");
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoPreview(null);
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "branding", label: "White-Label Branding", icon: Palette },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "business", label: "Business Info", icon: Building2 },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 flex-shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Welcome back, {user?.firstName || "User"} 👋
            </h1>
            <p className="text-gray-600 flex items-center space-x-2">
              <span>Your website:</span>
              <span
                className="font-semibold px-3 py-1 rounded-md text-sm"
                style={{
                  color: brandColors.primary,
                  backgroundColor: brandColors.primary + "15",
                }}
              >
                {realtorSubdomain || "yourcompany"}.stayza.pro
              </span>
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() =>
                copyToClipboard(
                  `https://${realtorSubdomain || "yourcompany"}.stayza.pro`
                )
              }
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </button>
            <button
              onClick={() =>
                window.open(
                  `https://${realtorSubdomain || "yourcompany"}.stayza.pro`,
                  "_blank"
                )
              }
              className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center space-x-2"
              style={{ backgroundColor: brandColors.primary }}
            >
              <Eye className="w-4 h-4" />
              <span>Preview Site</span>
            </button>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
            <p className="text-gray-600 mt-1">
              Manage your account and preferences
            </p>
          </div>

          <div className="flex gap-6">
            {/* Sidebar Tabs */}
            <div className="w-64 flex-shrink-0">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as SettingsTab)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">
                      Personal Information
                    </h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name
                          </label>
                          <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                firstName: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name
                          </label>
                          <input
                            type="text"
                            value={formData.lastName}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                lastName: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Branding Tab */}
                {activeTab === "branding" && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      White-Label Branding
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Customize your brand colors and logo to match your
                      business identity
                    </p>

                    <div className="space-y-8">
                      {/* Logo Upload Section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                          Brand Logo
                        </label>
                        <div className="flex items-start space-x-6">
                          {/* Logo Preview */}
                          <div className="flex-shrink-0">
                            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                              {logoPreview ? (
                                <img
                                  src={logoPreview}
                                  alt="Logo preview"
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <ImageIcon className="w-12 h-12 text-gray-400" />
                              )}
                            </div>
                          </div>

                          {/* Upload Controls */}
                          <div className="flex-1">
                            <div className="space-y-3">
                              <div className="flex items-center space-x-3">
                                <label className="cursor-pointer">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoUpload}
                                    className="hidden"
                                  />
                                  <div className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors inline-flex items-center space-x-2">
                                    <Upload className="w-4 h-4" />
                                    <span>Upload Logo</span>
                                  </div>
                                </label>
                                {logoPreview && (
                                  <button
                                    onClick={handleRemoveLogo}
                                    className="px-4 py-2 bg-red-50 border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-100 transition-colors inline-flex items-center space-x-2"
                                  >
                                    <X className="w-4 h-4" />
                                    <span>Remove</span>
                                  </button>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 space-y-1">
                                <p>• Recommended size: 200x200px or larger</p>
                                <p>
                                  • Formats: PNG, JPG, SVG (transparent
                                  background recommended)
                                </p>
                                <p>• Max file size: 2MB</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Brand Colors Section */}
                      <div className="pt-6 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-4">
                          Brand Color Palette
                        </label>
                        <p className="text-xs text-gray-600 mb-6">
                          These colors will be used throughout your white-label
                          website to maintain brand consistency
                        </p>

                        <div className="space-y-6">
                          {/* Primary Color */}
                          <div className="bg-gray-50 rounded-lg p-6">
                            <div className="flex items-start space-x-4">
                              <div className="flex-shrink-0">
                                <div className="relative">
                                  <input
                                    type="color"
                                    value={formData.primaryColor}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        primaryColor: e.target.value,
                                      })
                                    }
                                    className="w-20 h-20 rounded-lg cursor-pointer border-2 border-white shadow-md"
                                  />
                                </div>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-1">
                                  Primary Color
                                </h4>
                                <p className="text-sm text-gray-600 mb-3">
                                  Main brand color used for buttons, links, and
                                  key elements
                                </p>
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="text"
                                    value={formData.primaryColor}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        primaryColor: e.target.value,
                                      })
                                    }
                                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                                    placeholder="#3B82F6"
                                  />
                                  <div
                                    className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                                    style={{
                                      backgroundColor: formData.primaryColor,
                                    }}
                                  >
                                    Preview
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Secondary Color */}
                          <div className="bg-gray-50 rounded-lg p-6">
                            <div className="flex items-start space-x-4">
                              <div className="flex-shrink-0">
                                <div className="relative">
                                  <input
                                    type="color"
                                    value={formData.secondaryColor}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        secondaryColor: e.target.value,
                                      })
                                    }
                                    className="w-20 h-20 rounded-lg cursor-pointer border-2 border-white shadow-md"
                                  />
                                </div>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-1">
                                  Secondary Color
                                </h4>
                                <p className="text-sm text-gray-600 mb-3">
                                  Supporting color for accents and hover states
                                </p>
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="text"
                                    value={formData.secondaryColor}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        secondaryColor: e.target.value,
                                      })
                                    }
                                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                                    placeholder="#1E40AF"
                                  />
                                  <div
                                    className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                                    style={{
                                      backgroundColor: formData.secondaryColor,
                                    }}
                                  >
                                    Preview
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Accent Color */}
                          <div className="bg-gray-50 rounded-lg p-6">
                            <div className="flex items-start space-x-4">
                              <div className="flex-shrink-0">
                                <div className="relative">
                                  <input
                                    type="color"
                                    value={formData.accentColor}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        accentColor: e.target.value,
                                      })
                                    }
                                    className="w-20 h-20 rounded-lg cursor-pointer border-2 border-white shadow-md"
                                  />
                                </div>
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-1">
                                  Accent Color
                                </h4>
                                <p className="text-sm text-gray-600 mb-3">
                                  Highlight color for important elements and
                                  notifications
                                </p>
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="text"
                                    value={formData.accentColor}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,
                                        accentColor: e.target.value,
                                      })
                                    }
                                    className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                                    placeholder="#F59E0B"
                                  />
                                  <div
                                    className="px-4 py-2 rounded-lg text-white text-sm font-medium"
                                    style={{
                                      backgroundColor: formData.accentColor,
                                    }}
                                  >
                                    Preview
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Color Preview Card */}
                          <div className="bg-white border-2 border-gray-200 rounded-lg p-6">
                            <h4 className="font-medium text-gray-900 mb-4">
                              Live Preview
                            </h4>
                            <div className="flex items-center space-x-4">
                              <button
                                className="px-6 py-3 rounded-lg text-white font-medium shadow-sm"
                                style={{
                                  backgroundColor: formData.primaryColor,
                                }}
                              >
                                Primary Button
                              </button>
                              <button
                                className="px-6 py-3 rounded-lg text-white font-medium shadow-sm"
                                style={{
                                  backgroundColor: formData.secondaryColor,
                                }}
                              >
                                Secondary Button
                              </button>
                              <span
                                className="px-4 py-2 rounded-full text-sm font-semibold"
                                style={{
                                  backgroundColor: formData.accentColor + "20",
                                  color: formData.accentColor,
                                }}
                              >
                                Accent Badge
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notifications Tab */}
                {activeTab === "notifications" && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">
                      Notification Preferences
                    </h3>
                    <div className="space-y-4">
                      {[
                        {
                          id: "bookings",
                          label: "New Bookings",
                          description:
                            "Get notified when you receive a new booking",
                        },
                        {
                          id: "reviews",
                          label: "New Reviews",
                          description: "Get notified when guests leave reviews",
                        },
                        {
                          id: "payments",
                          label: "Payments",
                          description:
                            "Get notified about payment confirmations and payouts",
                        },
                        {
                          id: "messages",
                          label: "Messages",
                          description:
                            "Get notified when guests send you messages",
                        },
                      ].map((pref) => (
                        <div
                          key={pref.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900">
                              {pref.label}
                            </p>
                            <p className="text-sm text-gray-600">
                              {pref.description}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              defaultChecked
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Security Tab */}
                {activeTab === "security" && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">
                      Security Settings
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-4">
                          Change Password
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Current Password
                            </label>
                            <input
                              type="password"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              New Password
                            </label>
                            <input
                              type="password"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Confirm New Password
                            </label>
                            <input
                              type="password"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="pt-6 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Two-Factor Authentication
                        </h4>
                        <p className="text-sm text-gray-600 mb-4">
                          Add an extra layer of security to your account
                        </p>
                        <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                          Enable 2FA
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Business Info Tab */}
                {activeTab === "business" && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Business Information
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Manage your company details and legal information
                    </p>

                    <div className="space-y-6">
                      {/* Business Identity Section */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                        <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                          <Building2 className="w-5 h-5 mr-2 text-blue-600" />
                          Business Identity
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Business Name{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              value={formData.businessName}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  businessName: e.target.value,
                                })
                              }
                              placeholder="Your Real Estate Company"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              This will be displayed on your white-label website
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Tagline / Slogan
                            </label>
                            <input
                              type="text"
                              value={formData.tagline}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  tagline: e.target.value,
                                })
                              }
                              placeholder="Your trusted partner in property booking"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                              A catchy phrase that describes your business
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Legal Information Section */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-4">
                          Legal Information
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Company Registration Number
                            </label>
                            <input
                              type="text"
                              value={formData.registrationNumber}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  registrationNumber: e.target.value,
                                })
                              }
                              placeholder="RC1234567"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Tax ID / VAT Number
                            </label>
                            <input
                              type="text"
                              value={formData.taxId}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  taxId: e.target.value,
                                })
                              }
                              placeholder="Enter tax identification number"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Address Information Section */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-4">
                          Business Address
                        </h4>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Street Address
                            </label>
                            <textarea
                              rows={3}
                              value={formData.businessAddress}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  businessAddress: e.target.value,
                                })
                              }
                              placeholder="Enter your business address"
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                City
                              </label>
                              <input
                                type="text"
                                value={formData.city}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    city: e.target.value,
                                  })
                                }
                                placeholder="Lagos"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                State / Province
                              </label>
                              <input
                                type="text"
                                value={formData.state}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    state: e.target.value,
                                  })
                                }
                                placeholder="Lagos State"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
