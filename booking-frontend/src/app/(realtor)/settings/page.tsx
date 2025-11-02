"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Palette,
  Building2,
  CreditCard,
  Bell,
  Shield,
  Camera,
  Upload,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  FileText,
  ExternalLink,
  Copy,
  Eye,
  Save,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import { useBrand } from "@/context/BrandContext";
import { getRealtorSubdomain } from "@/lib/utils";
import type { Realtor, CacStatus } from "@/types";

type TabId = "profile" | "branding" | "business" | "payout" | "notifications" | "security";

interface Tab {
  id: TabId;
  label: string;
  icon: React.ElementType;
}

const tabs: Tab[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "branding", label: "Branding", icon: Palette },
  { id: "business", label: "Business & CAC", icon: Building2 },
  { id: "payout", label: "Payout Settings", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
];

export default function SettingsPage() {
  const { user, realtor, refreshUser } = useAuth();
  const { showSuccess, showError, showConfirm } = useAlert();
  const { brandColor } = useBrand();
  
  const [activeTab, setActiveTab] = useState<TabId>("profile");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // CAC State
  const [cacStatus, setCacStatus] = useState<{
    cacStatus: CacStatus;
    cacNumber?: string;
    cacDocumentUrl?: string;
    cacVerifiedAt?: string;
    cacRejectedAt?: string;
    cacRejectionReason?: string;
    canAppeal: boolean;
  } | null>(null);
  const [cacFormData, setCacFormData] = useState({
    cacNumber: "",
    cacDocumentUrl: "",
  });

  // Profile State
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
    businessPhone: realtor?.businessPhone || "",
    businessEmail: realtor?.businessEmail || "",
    businessAddress: realtor?.businessAddress || "",
    description: realtor?.description || "",
    website: realtor?.website || "",
  });

  // Branding State
  const [brandingData, setBrandingData] = useState({
    logoUrl: realtor?.logoUrl || "",
    brandColorHex: realtor?.brandColorHex || "#3B82F6",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");

  // Payout State
  const [payoutData, setPayoutData] = useState({
    bankName: "",
    accountNumber: "",
    accountName: "",
    bankCode: "",
  });

  // Notification Preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailBookings: true,
    emailReviews: true,
    emailPayments: true,
    emailPromotions: false,
    smsBookings: false,
    smsPayments: false,
  });

  // Security State
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Check for appeal success from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    const appeal = params.get("appeal");

    if (tab) {
      setActiveTab(tab as TabId);
    }

    if (appeal === "success") {
      showSuccess("Appeal processed! You can now resubmit your CAC documentation.");
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [showSuccess]);

  // Fetch CAC status
  useEffect(() => {
    if (activeTab === "business") {
      fetchCacStatus();
    }
  }, [activeTab]);

  const fetchCacStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/realtors/cac/status", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        setCacStatus(result.data);
        if (result.data.cacNumber) {
          setCacFormData((prev) => ({
            ...prev,
            cacNumber: result.data.cacNumber,
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching CAC status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showError("Logo file size must be less than 10MB");
        return;
      }
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return null;

    const formData = new FormData();
    formData.append("logo", logoFile);

    try {
      const response = await fetch("/api/realtors/upload-logo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        return result.data.realtor.logoUrl;
      } else {
        const error = await response.json();
        showError(error.message || "Failed to upload logo");
        return null;
      }
    } catch (error) {
      showError("Error uploading logo");
      return null;
    }
  };

  const uploadCacDocument = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append("cacCertificate", file);

    try {
      const response = await fetch("/api/realtors/upload-temp-cac", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        return result.data.url;
      } else {
        const error = await response.json();
        showError(error.message || "Failed to upload CAC document");
        return null;
      }
    } catch (error) {
      showError("Error uploading CAC document");
      return null;
    }
  };

  const handleCacDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showError("File size must be less than 10MB");
      return;
    }

    setIsLoading(true);
    const url = await uploadCacDocument(file);
    if (url) {
      setCacFormData((prev) => ({ ...prev, cacDocumentUrl: url }));
      showSuccess("CAC document uploaded successfully");
    }
    setIsLoading(false);
  };

  const handleCacSubmit = async () => {
    if (!cacFormData.cacNumber || !cacFormData.cacDocumentUrl) {
      showError("Please provide both CAC number and document");
      return;
    }

    setIsSaving(true);
    try {
      const isResubmission = cacStatus?.cacStatus === "REJECTED" && cacStatus?.canAppeal;
      const endpoint = isResubmission ? "/api/realtors/cac/resubmit" : "/api/realtors/cac";
      const method = isResubmission ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(cacFormData),
      });

      if (response.ok) {
        showSuccess(
          isResubmission
            ? "CAC verification resubmitted successfully"
            : "CAC verification submitted successfully"
        );
        await fetchCacStatus();
      } else {
        const error = await response.json();
        showError(error.message || "Failed to submit CAC verification");
      }
    } catch (error) {
      showError("Error submitting CAC verification");
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfileSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/realtors/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          businessName: realtor?.businessName,
          businessPhone: profileData.businessPhone,
          businessEmail: profileData.businessEmail,
          businessAddress: profileData.businessAddress,
          description: profileData.description,
          website: profileData.website,
        }),
      });

      if (response.ok) {
        showSuccess("Profile updated successfully");
        await refreshUser();
      } else {
        const error = await response.json();
        showError(error.message || "Failed to update profile");
      }
    } catch (error) {
      showError("Error updating profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBrandingSave = async () => {
    setIsSaving(true);
    try {
      let logoUrl = brandingData.logoUrl;
      
      // Upload new logo if selected
      if (logoFile) {
        const uploadedUrl = await uploadLogo();
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
        } else {
          setIsSaving(false);
          return;
        }
      }

      const response = await fetch("/api/realtors/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          brandColorHex: brandingData.brandColorHex,
          logoUrl: logoUrl,
        }),
      });

      if (response.ok) {
        showSuccess("Branding updated successfully");
        await refreshUser();
        setLogoFile(null);
        setLogoPreview("");
      } else {
        const error = await response.json();
        showError(error.message || "Failed to update branding");
      }
    } catch (error) {
      showError("Error updating branding");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSecuritySave = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      showError("New passwords do not match");
      return;
    }

    if (securityData.newPassword && securityData.newPassword.length < 8) {
      showError("Password must be at least 8 characters long");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          currentPassword: securityData.currentPassword,
          newPassword: securityData.newPassword,
        }),
      });

      if (response.ok) {
        showSuccess("Password updated successfully");
        setSecurityData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const error = await response.json();
        showError(error.message || "Failed to update password");
      }
    } catch (error) {
      showError("Error updating password");
    } finally {
      setIsSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess("Copied to clipboard!");
  };

  const renderCacStatusBadge = () => {
    if (!cacStatus) return null;

    const statusConfig = {
      PENDING: {
        icon: Clock,
        color: "text-yellow-600",
        bg: "bg-yellow-50",
        border: "border-yellow-200",
        label: "Pending Review",
      },
      APPROVED: {
        icon: CheckCircle,
        color: "text-green-600",
        bg: "bg-green-50",
        border: "border-green-200",
        label: "Verified",
      },
      REJECTED: {
        icon: XCircle,
        color: "text-red-600",
        bg: "bg-red-50",
        border: "border-red-200",
        label: "Rejected",
      },
      SUSPENDED: {
        icon: AlertTriangle,
        color: "text-orange-600",
        bg: "bg-orange-50",
        border: "border-orange-200",
        label: "Suspended",
      },
    };

    const config = statusConfig[cacStatus.cacStatus];
    const Icon = config.icon;

    return (
      <div
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${config.bg} ${config.border}`}
      >
        <Icon className={`w-5 h-5 ${config.color}`} />
        <span className={`font-semibold ${config.color}`}>{config.label}</span>
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Information</h2>
              <p className="text-gray-600">
                Update your business details and contact information
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={profileData.firstName}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={profileData.lastName}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={profileData.email}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Personal Phone
                </label>
                <input
                  type="tel"
                  value={profileData.phone}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Phone
                </label>
                <input
                  type="tel"
                  value={profileData.businessPhone}
                  onChange={(e) =>
                    setProfileData({ ...profileData, businessPhone: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Email
                </label>
                <input
                  type="email"
                  value={profileData.businessEmail}
                  onChange={(e) =>
                    setProfileData({ ...profileData, businessEmail: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Address
                </label>
                <input
                  type="text"
                  value={profileData.businessAddress}
                  onChange={(e) =>
                    setProfileData({ ...profileData, businessAddress: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  value={profileData.website}
                  onChange={(e) =>
                    setProfileData({ ...profileData, website: e.target.value })
                  }
                  placeholder="https://your-website.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Description
                </label>
                <textarea
                  value={profileData.description}
                  onChange={(e) =>
                    setProfileData({ ...profileData, description: e.target.value })
                  }
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell guests about your business..."
                />
              </div>
            </div>

            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleProfileSave}
                disabled={isSaving}
                style={{ backgroundColor: brandColor }}
                className="px-6 py-3 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </motion.button>
            </div>
          </div>
        );

      case "branding":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Branding</h2>
              <p className="text-gray-600">
                Customize your brand identity across the platform
              </p>
            </div>

            <div className="space-y-6">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Logo
                </label>
                <div className="flex items-center gap-6">
                  <div className="w-32 h-32 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                    {logoPreview || brandingData.logoUrl ? (
                      <img
                        src={logoPreview || brandingData.logoUrl}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-12 h-12 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <Upload className="w-5 h-5" />
                      Upload Logo
                    </label>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                    />
                    <p className="text-sm text-gray-500 mt-2">
                      Recommended: Square image, at least 512x512px
                    </p>
                    <p className="text-xs text-gray-400">
                      Max file size: 10MB. Formats: JPG, PNG, WebP
                    </p>
                  </div>
                </div>
              </div>

              {/* Brand Color */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Color
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="color"
                    value={brandingData.brandColorHex}
                    onChange={(e) =>
                      setBrandingData({ ...brandingData, brandColorHex: e.target.value })
                    }
                    className="w-16 h-16 rounded-lg cursor-pointer"
                  />
                  <div>
                    <input
                      type="text"
                      value={brandingData.brandColorHex}
                      onChange={(e) =>
                        setBrandingData({ ...brandingData, brandColorHex: e.target.value })
                      }
                      className="px-4 py-2 border border-gray-300 rounded-lg font-mono uppercase"
                      placeholder="#3B82F6"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      This color will be used for buttons, links, and highlights
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div
                      style={{ backgroundColor: brandingData.brandColorHex }}
                      className="px-6 py-2 text-white rounded-lg font-medium"
                    >
                      Button Example
                    </div>
                    <div
                      style={{ color: brandingData.brandColorHex }}
                      className="font-semibold"
                    >
                      Link Example
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBrandingSave}
                disabled={isSaving}
                style={{ backgroundColor: brandColor }}
                className="px-6 py-3 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Changes
                  </>
                )}
              </motion.button>
            </div>
          </div>
        );

      case "business":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Business & CAC Verification
              </h2>
              <p className="text-gray-600">
                Corporate Affairs Commission (CAC) verification is required to list properties
              </p>
            </div>

            {/* Current Status */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Verification Status
              </h3>
              {isLoading ? (
                <div className="flex items-center gap-3 text-gray-600">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading CAC status...
                </div>
              ) : cacStatus ? (
                <div className="space-y-4">
                  {renderCacStatusBadge()}

                  {cacStatus.cacVerifiedAt && (
                    <p className="text-sm text-gray-600">
                      Verified on {new Date(cacStatus.cacVerifiedAt).toLocaleDateString()}
                    </p>
                  )}

                  {cacStatus.cacStatus === "REJECTED" && cacStatus.cacRejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-red-900 mb-1">
                            Rejection Reason:
                          </p>
                          <p className="text-red-800">{cacStatus.cacRejectionReason}</p>
                          {!cacStatus.canAppeal && (
                            <p className="text-sm text-red-700 mt-3">
                              Please check your email for instructions on how to appeal this
                              decision.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {cacStatus.cacStatus === "PENDING" && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-yellow-900 mb-1">
                            Under Review
                          </p>
                          <p className="text-yellow-800">
                            Your CAC verification is being reviewed by our team. This typically
                            takes 24-48 hours.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {cacStatus.cacStatus === "APPROVED" && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-green-900 mb-1">
                            Verification Complete
                          </p>
                          <p className="text-green-800">
                            Your business has been verified. You can now list and manage
                            properties on the platform.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">No CAC information found</p>
              )}
            </div>

            {/* CAC Form - Show if not approved or if rejected and can appeal */}
            {cacStatus?.cacStatus !== "APPROVED" &&
              cacStatus?.cacStatus !== "PENDING" &&
              (cacStatus?.cacStatus !== "REJECTED" || cacStatus?.canAppeal) && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {cacStatus?.cacStatus === "REJECTED"
                      ? "Resubmit CAC Verification"
                      : "Submit CAC Verification"}
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CAC Registration Number *
                      </label>
                      <input
                        type="text"
                        value={cacFormData.cacNumber}
                        onChange={(e) =>
                          setCacFormData({ ...cacFormData, cacNumber: e.target.value })
                        }
                        placeholder="RC123456"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CAC Certificate Document *
                      </label>
                      <div className="flex items-center gap-4">
                        <label
                          htmlFor="cac-upload"
                          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Upload className="w-5 h-5" />
                          {cacFormData.cacDocumentUrl ? "Change Document" : "Upload Document"}
                        </label>
                        <input
                          id="cac-upload"
                          type="file"
                          accept="image/*,.pdf"
                          onChange={handleCacDocumentUpload}
                          className="hidden"
                        />
                        {cacFormData.cacDocumentUrl && (
                          <a
                            href={cacFormData.cacDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
                          >
                            <Eye className="w-5 h-5" />
                            View Document
                          </a>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Upload a clear scan or photo of your CAC certificate (PDF, JPG, PNG)
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCacSubmit}
                        disabled={
                          isSaving || !cacFormData.cacNumber || !cacFormData.cacDocumentUrl
                        }
                        style={{ backgroundColor: brandColor }}
                        className="px-6 py-3 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <FileText className="w-5 h-5" />
                            {cacStatus?.cacStatus === "REJECTED"
                              ? "Resubmit Verification"
                              : "Submit for Verification"}
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>
              )}
          </div>
        );

      case "payout":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payout Settings</h2>
              <p className="text-gray-600">
                Configure your bank account to receive payments from bookings
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-yellow-900 mb-1">
                    Paystack Integration Required
                  </p>
                  <p className="text-yellow-800">
                    Bank account details will be integrated with Paystack for automatic split
                    payments. This feature is currently under development.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name
                </label>
                <select
                  value={payoutData.bankName}
                  onChange={(e) => setPayoutData({ ...payoutData, bankName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                >
                  <option value="">Select your bank</option>
                  <option value="access">Access Bank</option>
                  <option value="gtbank">GTBank</option>
                  <option value="zenith">Zenith Bank</option>
                  <option value="uba">UBA</option>
                  <option value="first">First Bank</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number
                </label>
                <input
                  type="text"
                  value={payoutData.accountNumber}
                  onChange={(e) =>
                    setPayoutData({ ...payoutData, accountNumber: e.target.value })
                  }
                  placeholder="0123456789"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Name
                </label>
                <input
                  type="text"
                  value={payoutData.accountName}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  placeholder="Will be auto-filled after account number is entered"
                  disabled
                />
              </div>
            </div>

            <div className="flex justify-end opacity-50">
              <button
                disabled
                className="px-6 py-3 bg-gray-400 text-white rounded-lg font-medium cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Notification Preferences
              </h2>
              <p className="text-gray-600">
                Manage how you receive updates about your bookings and account
              </p>
            </div>

            <div className="space-y-6">
              {/* Email Notifications */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Email Notifications
                </h3>
                <div className="space-y-4">
                  {[
                    { id: "emailBookings", label: "Booking Updates", description: "New bookings, cancellations, and modifications" },
                    { id: "emailReviews", label: "Reviews & Ratings", description: "When guests leave reviews for your properties" },
                    { id: "emailPayments", label: "Payments & Payouts", description: "Payment receipts and payout notifications" },
                    { id: "emailPromotions", label: "Promotions & Tips", description: "Marketing updates and tips to improve your listings" },
                  ].map((item) => (
                    <label key={item.id} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs[item.id as keyof typeof notificationPrefs]}
                        onChange={(e) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            [item.id]: e.target.checked,
                          })
                        }
                        className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* SMS Notifications */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  SMS Notifications
                </h3>
                <div className="space-y-4">
                  {[
                    { id: "smsBookings", label: "Urgent Booking Alerts", description: "Critical booking notifications via SMS" },
                    { id: "smsPayments", label: "Payment Confirmations", description: "Instant payment and payout confirmations" },
                  ].map((item) => (
                    <label key={item.id} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationPrefs[item.id as keyof typeof notificationPrefs]}
                        onChange={(e) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            [item.id]: e.target.checked,
                          })
                        }
                        className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <div>
                        <p className="font-medium text-gray-900">{item.label}</p>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => showSuccess("Notification preferences saved")}
                style={{ backgroundColor: brandColor }}
                className="px-6 py-3 text-white rounded-lg font-medium flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Save Preferences
              </motion.button>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Settings</h2>
              <p className="text-gray-600">
                Update your password and manage account security
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Change Password</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={securityData.currentPassword}
                    onChange={(e) =>
                      setSecurityData({ ...securityData, currentPassword: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={securityData.newPassword}
                    onChange={(e) =>
                      setSecurityData({ ...securityData, newPassword: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Must be at least 8 characters long
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={securityData.confirmPassword}
                    onChange={(e) =>
                      setSecurityData({ ...securityData, confirmPassword: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSecuritySave}
                  disabled={isSaving}
                  style={{ backgroundColor: brandColor }}
                  className="px-6 py-3 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Update Password
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            {/* Two-Factor Authentication (Coming Soon) */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 opacity-60">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Two-Factor Authentication
              </h3>
              <p className="text-gray-600 mb-4">
                Add an extra layer of security to your account (Coming Soon)
              </p>
              <button
                disabled
                className="px-4 py-2 bg-gray-400 text-white rounded-lg font-medium cursor-not-allowed"
              >
                Enable 2FA
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with Subdomain */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow-sm p-6 mb-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 mt-1">
                Manage your account and business preferences
              </p>
            </div>
            {realtor && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Your Booking Site</p>
                  <p className="font-mono text-sm font-medium text-gray-900">
                    {getRealtorSubdomain(realtor.slug)}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => copyToClipboard(getRealtorSubdomain(realtor.slug))}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Copy URL"
                >
                  <Copy className="w-5 h-5 text-gray-600" />
                </motion.button>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href={`https://${getRealtorSubdomain(realtor.slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Preview site"
                >
                  <ExternalLink className="w-5 h-5 text-gray-600" />
                </motion.a>
              </div>
            )}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-4 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    whileHover={{ x: 4 }}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-lg shadow-sm p-6"
            >
              {renderTabContent()}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
