"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  User,
  Palette,
  Building2,
  CreditCard,
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
  Trash2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAuthStore } from "@/store/authStore";
import { useAlert } from "@/context/AlertContext";
import { useBranding } from "@/hooks/useBranding";
import { getRealtorSubdomain, buildSubdomainUrl } from "@/utils/subdomain";
import { buildMainDomainUrl } from "@/utils/domains";
import { payoutService, Bank } from "@/services/payout";
import type { CacStatus } from "@/types";

// API URL for direct backend calls
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

type TabId = "profile" | "branding" | "business" | "payout" | "security";

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
  { id: "security", label: "Security", icon: Shield },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { checkAuth } = useAuthStore();
  const { showSuccess, showError, showConfirm } = useAlert();
  const { branding } = useBranding();
  const realtorSubdomain = getRealtorSubdomain();
  const brandColor = branding?.primaryColor || "#3B82F6";
  const previewSiteUrl = user?.realtor?.slug
    ? realtorSubdomain
      ? buildSubdomainUrl(user.realtor.slug)
      : buildMainDomainUrl(`/guest-landing`)
    : null;

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
    businessName: user?.realtor?.businessName || "",
    tagline: user?.realtor?.tagline || "",
    slug: user?.realtor?.slug || "",
  });

  // Branding State
  const [brandingData, setBrandingData] = useState({
    logoUrl: user?.realtor?.logoUrl || "",
    primaryColor: user?.realtor?.primaryColor || "#3B82F6",
    secondaryColor: user?.realtor?.secondaryColor || "#1E40AF",
    accentColor: user?.realtor?.accentColor || "#F59E0B",
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
  const [banks, setBanks] = useState<Bank[]>([]);
  const [isVerifyingAccount, setIsVerifyingAccount] = useState(false);
  const [hasPayoutAccount, setHasPayoutAccount] = useState(false);
  const [otpRequiredForPayoutEdit, setOtpRequiredForPayoutEdit] = useState(false);
  const [isEditingPayoutAccount, setIsEditingPayoutAccount] = useState(false);
  const [isRequestingPayoutOtp, setIsRequestingPayoutOtp] = useState(false);
  const [payoutOtpSent, setPayoutOtpSent] = useState(false);
  const [payoutOtp, setPayoutOtp] = useState("");
  const [payoutOtpDestination, setPayoutOtpDestination] = useState("");

  // Security State
  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const getErrorMessage = (error: unknown, fallback: string): string => {
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      typeof (error as { response?: { data?: { message?: string } } }).response
        ?.data?.message === "string"
    ) {
      return (error as { response?: { data?: { message?: string } } }).response
        ?.data?.message as string;
    }
    if (error instanceof Error && error.message.trim().length > 0) {
      return error.message;
    }
    return fallback;
  };

  // Check for appeal success from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    const appeal = params.get("appeal");

    if (tab) {
      setActiveTab(tab as TabId);
    }

    if (appeal === "success") {
      showSuccess(
        "Appeal processed! You can now resubmit your CAC documentation."
      );
      // Clean URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [showSuccess]);

  // Fetch CAC status for business and payout tabs
  useEffect(() => {
    if (activeTab === "business" || activeTab === "payout") {
      fetchCacStatus();
    }
  }, [activeTab]);

  // Update branding data when user data changes
  useEffect(() => {
    if (user?.realtor) {
      setBrandingData({
        logoUrl: user.realtor.logoUrl || "",
        primaryColor: user.realtor.primaryColor || "#3B82F6",
        secondaryColor: user.realtor.secondaryColor || "#1E40AF",
        accentColor: user.realtor.accentColor || "#F59E0B",
      });
    }
  }, [user]);

  const fetchBanksAndPayoutSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      const [banksData, payoutSettings] = await Promise.all([
        payoutService.getBanks(),
        payoutService.getPayoutSettings(),
      ]);

      setBanks(banksData);
      setHasPayoutAccount(payoutSettings.hasPayoutAccount);
      setOtpRequiredForPayoutEdit(Boolean(payoutSettings.otpRequiredForEdit));
      setIsEditingPayoutAccount(false);
      setPayoutOtpSent(false);
      setPayoutOtp("");
      setPayoutOtpDestination("");

      if (payoutSettings.bankCode) {
        setPayoutData({
          bankCode: payoutSettings.bankCode,
          bankName: payoutSettings.bankName || "",
          accountNumber:
            payoutSettings.accountNumber || payoutSettings.maskedAccountNumber || "",
          accountName: payoutSettings.accountName || "",
        });
      } else {
        setPayoutData({
          bankCode: "",
          bankName: "",
          accountNumber: "",
          accountName: "",
        });
      }
    } catch (error) {
      
      showError("Failed to load payout settings");
    } finally {
      setIsLoading(false);
    }
  }, [showError]);

  // Fetch banks and payout settings
  useEffect(() => {
    if (activeTab === "payout") {
      void fetchBanksAndPayoutSettings();
    }
  }, [activeTab, fetchBanksAndPayoutSettings]);

  const fetchCacStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/realtors/cac/status`, {
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
      const response = await fetch(`${API_URL}/realtors/upload?type=logo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        return result.data.url;
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
      const response = await fetch(`${API_URL}/realtors/upload-temp-cac`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
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

  const handleVerifyBankAccount = async () => {
    if (!payoutData.accountNumber || !payoutData.bankCode) {
      showError("Please select a bank and enter account number");
      return;
    }

    if (payoutData.accountNumber.length !== 10) {
      showError("Account number must be 10 digits");
      return;
    }

    try {
      setIsVerifyingAccount(true);
      const result = await payoutService.verifyBankAccount(
        payoutData.accountNumber,
        payoutData.bankCode
      );

      setPayoutData((prev) => ({
        ...prev,
        accountName: result.account_name,
      }));

      showSuccess(`Account verified: ${result.account_name}`);
    } catch (error: unknown) {
      showError(getErrorMessage(error, "Failed to verify account"));
      setPayoutData((prev) => ({
        ...prev,
        accountName: "",
      }));
    } finally {
      setIsVerifyingAccount(false);
    }
  };

  const handleStartEditPayoutAccount = () => {
    setIsEditingPayoutAccount(true);
    setPayoutOtp("");
    setPayoutOtpSent(false);
    setPayoutOtpDestination("");
    if (payoutData.accountNumber.includes("*")) {
      setPayoutData((prev) => ({
        ...prev,
        accountNumber: "",
        accountName: "",
      }));
    }
  };

  const handleCancelEditPayoutAccount = async () => {
    setIsEditingPayoutAccount(false);
    setPayoutOtp("");
    setPayoutOtpSent(false);
    setPayoutOtpDestination("");
    await fetchBanksAndPayoutSettings();
  };

  const handleRequestPayoutUpdateOtp = async () => {
    if (!payoutData.accountName) {
      showError("Please verify your account number first");
      return;
    }

    try {
      setIsRequestingPayoutOtp(true);
      const otpChallenge = await payoutService.requestPayoutAccountOtp({
        bankCode: payoutData.bankCode,
        bankName: payoutData.bankName,
        accountNumber: payoutData.accountNumber,
        accountName: payoutData.accountName,
      });

      if (!otpChallenge.otpRequired) {
        setOtpRequiredForPayoutEdit(false);
        showSuccess("OTP not required for this payout setup");
        return;
      }

      setPayoutOtpSent(true);
      setPayoutOtp("");
      setPayoutOtpDestination(otpChallenge.maskedEmail || "");
      showSuccess("A 4-digit OTP has been sent to your email");
    } catch (error: unknown) {
      showError(getErrorMessage(error, "Failed to send OTP"));
    } finally {
      setIsRequestingPayoutOtp(false);
    }
  };

  const handleSaveBankAccount = async () => {
    if (!payoutData.accountName) {
      showError("Please verify your account number first");
      return;
    }

    if (cacStatus?.cacStatus !== "APPROVED") {
      showError(
        "CAC verification must be approved before setting up payout account"
      );
      return;
    }

    if (
      hasPayoutAccount &&
      isEditingPayoutAccount &&
      otpRequiredForPayoutEdit
    ) {
      if (!payoutOtpSent) {
        showError("Please request OTP before updating your payout account");
        return;
      }

      if (!/^\d{4}$/.test(payoutOtp.trim())) {
        showError("Please enter the 4-digit OTP sent to your email");
        return;
      }
    }

    try {
      setIsSaving(true);
      await payoutService.saveBankAccount({
        ...payoutData,
        otp:
          hasPayoutAccount && isEditingPayoutAccount && otpRequiredForPayoutEdit
            ? payoutOtp.trim()
            : undefined,
      });
      showSuccess(
        hasPayoutAccount
          ? "Payout account updated successfully!"
          : "Bank account set up successfully!"
      );
      setHasPayoutAccount(true);
      setIsEditingPayoutAccount(false);
      setPayoutOtp("");
      setPayoutOtpSent(false);
      setPayoutOtpDestination("");
      await fetchBanksAndPayoutSettings();
    } catch (error: unknown) {
      showError(getErrorMessage(error, "Failed to save bank account"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCacDocumentUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
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
      const isResubmission =
        cacStatus?.cacStatus === "REJECTED" && cacStatus?.canAppeal;
      const endpoint = isResubmission
        ? `${API_URL}/realtors/cac/resubmit`
        : `${API_URL}/realtors/cac`;
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
    if (!profileData.slug || profileData.slug.length < 3) {
      showError("Subdomain must be at least 3 characters long");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`${API_URL}/realtors/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          businessName: profileData.businessName,
          tagline: profileData.tagline,
        }),
      });

      if (response.ok) {
        showSuccess("Profile updated successfully");
        await checkAuth();
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

      // Only include fields that should be updated
      const updatePayload: {
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
        logoUrl?: string;
      } = {
        primaryColor: brandingData.primaryColor,
        secondaryColor: brandingData.secondaryColor,
        accentColor: brandingData.accentColor,
      };

      // Only include logoUrl if it was changed (new upload) or if it exists
      if (logoFile || logoUrl) {
        updatePayload.logoUrl = logoUrl;
      }

      const response = await fetch(`${API_URL}/realtors/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(updatePayload),
      });

      if (response.ok) {
        showSuccess("Branding updated successfully");
        await checkAuth();
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
      const response = await fetch(`${API_URL}/auth/change-password`, {
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

  const handleDeleteAccount = async () => {
    showConfirm(
      "⚠️ WARNING: This action is irreversible!\n\nDeleting your account will permanently remove:\n\n• Your realtor profile and business information\n• All your properties and listings\n• All bookings and booking history\n• All reviews and ratings\n• All payment records and transactions\n• All associated data\n\nAre you absolutely sure you want to continue?",
      async () => {
        // First confirmation passed, show second confirmation
        showConfirm(
          "🚨 FINAL CONFIRMATION\n\nThis is your last chance to cancel. Once deleted, your data CANNOT be recovered.\n\nClick Confirm to permanently delete your account.",
          async () => {
            setIsSaving(true);
            try {
              const response = await fetch(`${API_URL}/realtors/profile`, {
                method: "DELETE",
                headers: {
                  Authorization: `Bearer ${localStorage.getItem(
                    "accessToken"
                  )}`,
                },
              });

              if (response.ok) {
                showSuccess("Account deleted successfully. Redirecting...");
                // Clear auth and redirect to home page after 2 seconds
                setTimeout(() => {
                  localStorage.clear();
                  window.location.href = "/";
                }, 2000);
              } else {
                const error = await response.json();
                showError(error.message || "Failed to delete account");
              }
            } catch (error) {
              showError("Error deleting account");
            } finally {
              setIsSaving(false);
            }
          },
          "Final Confirmation Required"
        );
      },
      "Delete Account Confirmation"
    );
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Profile Information
              </h2>
              <p className="text-gray-600">
                Update your business details and contact information
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Editable Business Information */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={profileData.businessName}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      businessName: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Your Agency Name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tagline
                </label>
                <input
                  type="text"
                  value={profileData.tagline}
                  onChange={(e) =>
                    setProfileData({
                      ...profileData,
                      tagline: e.target.value,
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="A short description of your business (max 80 characters)"
                  maxLength={80}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {profileData.tagline.length}/80 characters
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Booking Subdomain
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={profileData.slug}
                    disabled
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed font-mono"
                    placeholder="your-agency-name"
                  />
                  <span className="text-gray-600 font-mono">.stayza.pro</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Your subdomain cannot be changed after registration.
                </p>
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Branding
              </h2>
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
                      <Image
                        src={logoPreview || brandingData.logoUrl}
                        alt="Logo"
                        width={128}
                        height={128}
                        unoptimized
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

              {/* Brand Colors */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Brand Colors
                </h3>

                {/* Primary Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={brandingData.primaryColor}
                      onChange={(e) =>
                        setBrandingData({
                          ...brandingData,
                          primaryColor: e.target.value,
                        })
                      }
                      className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={brandingData.primaryColor}
                        onChange={(e) =>
                          setBrandingData({
                            ...brandingData,
                            primaryColor: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono uppercase"
                        placeholder="#000000"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Main brand color used for primary buttons and key
                        elements
                      </p>
                    </div>
                  </div>
                </div>

                {/* Secondary Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={brandingData.secondaryColor}
                      onChange={(e) =>
                        setBrandingData({
                          ...brandingData,
                          secondaryColor: e.target.value,
                        })
                      }
                      className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={brandingData.secondaryColor}
                        onChange={(e) =>
                          setBrandingData({
                            ...brandingData,
                            secondaryColor: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono uppercase"
                        placeholder="#10B981"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Supporting color for secondary actions and highlights
                      </p>
                    </div>
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Accent Color
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="color"
                      value={brandingData.accentColor}
                      onChange={(e) =>
                        setBrandingData({
                          ...brandingData,
                          accentColor: e.target.value,
                        })
                      }
                      className="w-16 h-16 rounded-lg cursor-pointer border-2 border-gray-300"
                    />
                    <div className="flex-1">
                      <input
                        type="text"
                        value={brandingData.accentColor}
                        onChange={(e) =>
                          setBrandingData({
                            ...brandingData,
                            accentColor: e.target.value,
                          })
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono uppercase"
                        placeholder="#F59E0B"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        Accent color for alerts, badges, and special emphasis
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Color Preview
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div
                      style={{ backgroundColor: brandingData.primaryColor }}
                      className="px-6 py-3 text-white rounded-lg font-medium shadow-sm"
                    >
                      Primary Button
                    </div>
                    <div
                      style={{ backgroundColor: brandingData.secondaryColor }}
                      className="px-6 py-3 text-white rounded-lg font-medium shadow-sm"
                    >
                      Secondary Button
                    </div>
                    <div
                      style={{ backgroundColor: brandingData.accentColor }}
                      className="px-6 py-3 text-white rounded-lg font-medium shadow-sm"
                    >
                      Accent Button
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      style={{ color: brandingData.primaryColor }}
                      className="font-semibold text-lg"
                    >
                      Primary Link
                    </div>
                    <div
                      style={{ color: brandingData.secondaryColor }}
                      className="font-semibold text-lg"
                    >
                      Secondary Link
                    </div>
                    <div
                      style={{ color: brandingData.accentColor }}
                      className="font-semibold text-lg"
                    >
                      Accent Link
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
                Corporate Affairs Commission (CAC) verification is required to
                list properties
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
                      Verified on{" "}
                      {new Date(cacStatus.cacVerifiedAt).toLocaleDateString()}
                    </p>
                  )}

                  {cacStatus.cacStatus === "REJECTED" &&
                    cacStatus.cacRejectionReason && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-semibold text-red-900 mb-1">
                              Rejection Reason:
                            </p>
                            <p className="text-red-800">
                              {cacStatus.cacRejectionReason}
                            </p>
                            {!cacStatus.canAppeal && (
                              <p className="text-sm text-red-700 mt-3">
                                Please check your email for instructions on how
                                to appeal this decision.
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
                            Your CAC verification is being reviewed by our team.
                            This typically takes 24-48 hours.
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
                            Your business has been verified. You can now list
                            and manage properties on the platform.
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
                          setCacFormData({
                            ...cacFormData,
                            cacNumber: e.target.value,
                          })
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
                          {cacFormData.cacDocumentUrl
                            ? "Change Document"
                            : "Upload Document"}
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
                        Upload a clear scan or photo of your CAC certificate
                        (PDF, JPG, PNG)
                      </p>
                    </div>

                    <div className="flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleCacSubmit}
                        disabled={
                          isSaving ||
                          !cacFormData.cacNumber ||
                          !cacFormData.cacDocumentUrl
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
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Payout Settings
              </h2>
              <p className="text-gray-600">
                Configure your bank account to receive payments from bookings
              </p>
            </div>

            {cacStatus?.cacStatus !== "APPROVED" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-yellow-900 mb-1">
                      CAC Verification Required
                    </p>
                    <p className="text-yellow-800">
                      You need to complete and approve your CAC verification
                      before you can set up payout accounts.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {hasPayoutAccount && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-green-900 mb-1">
                      Payout Account Active
                    </p>
                    <p className="text-green-800">
                      Your bank account is connected and ready to receive
                      payments from bookings.
                    </p>
                    <div className="mt-3">
                      {isEditingPayoutAccount ? (
                        <button
                          type="button"
                          onClick={handleCancelEditPayoutAccount}
                          className="text-sm font-medium text-green-800 hover:text-green-900 underline"
                        >
                          Cancel account change
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleStartEditPayoutAccount}
                          className="text-sm font-medium text-green-800 hover:text-green-900 underline"
                        >
                          Change payout account
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Name *
                </label>
                <select
                  value={payoutData.bankCode}
                  onChange={(e) => {
                    const bank = banks.find((b) => b.code === e.target.value);
                    setPayoutData({
                      ...payoutData,
                      bankCode: e.target.value,
                      bankName: bank?.name || "",
                      accountName: "", // Reset account name when bank changes
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={
                    (hasPayoutAccount && !isEditingPayoutAccount) ||
                    cacStatus?.cacStatus !== "APPROVED"
                  }
                >
                  <option value="">Select your bank</option>
                  {banks.map((bank) => (
                    <option key={bank.code} value={bank.code}>
                      {bank.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Account Number *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={payoutData.accountNumber}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 10);
                      setPayoutData({
                        ...payoutData,
                        accountNumber: value,
                        accountName: "",
                      });
                    }}
                    placeholder="0123456789"
                    maxLength={10}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={
                      (hasPayoutAccount && !isEditingPayoutAccount) ||
                      cacStatus?.cacStatus !== "APPROVED"
                    }
                  />
                  <motion.button
                    type="button"
                    onClick={handleVerifyBankAccount}
                    disabled={
                      !payoutData.bankCode ||
                      payoutData.accountNumber.length !== 10 ||
                      isVerifyingAccount ||
                      (hasPayoutAccount && !isEditingPayoutAccount) ||
                      cacStatus?.cacStatus !== "APPROVED"
                    }
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isVerifyingAccount && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    {isVerifyingAccount ? "Verifying..." : "Verify"}
                  </motion.button>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Enter a 10-digit account number
                </p>
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
                  placeholder="Will be auto-filled after account verification"
                />
              </div>

              {hasPayoutAccount &&
                isEditingPayoutAccount &&
                otpRequiredForPayoutEdit && (
                  <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-blue-900">
                          OTP Required for Account Change
                        </p>
                        <p className="text-sm text-blue-800">
                          Send a 4-digit OTP to your email, then enter it below
                          to confirm this update.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRequestPayoutUpdateOtp}
                        disabled={
                          isRequestingPayoutOtp ||
                          !payoutData.accountName ||
                          cacStatus?.cacStatus !== "APPROVED"
                        }
                        className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isRequestingPayoutOtp
                          ? "Sending OTP..."
                          : payoutOtpSent
                          ? "Resend OTP"
                          : "Send OTP"}
                      </button>
                    </div>

                    {payoutOtpSent && (
                      <div className="space-y-2">
                        <p className="text-xs text-blue-800">
                          OTP sent to {payoutOtpDestination || "your email"}.
                        </p>
                        <input
                          type="text"
                          value={payoutOtp}
                          onChange={(e) =>
                            setPayoutOtp(
                              e.target.value.replace(/\D/g, "").slice(0, 4)
                            )
                          }
                          inputMode="numeric"
                          maxLength={4}
                          placeholder="Enter 4-digit OTP"
                          className="w-full px-4 py-2 border border-blue-300 rounded-lg text-center tracking-[0.5em] font-semibold focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                )}
            </div>

            <div className="flex justify-end">
              <motion.button
                type="button"
                onClick={handleSaveBankAccount}
                disabled={
                  !payoutData.accountName ||
                  isSaving ||
                  cacStatus?.cacStatus !== "APPROVED" ||
                  (hasPayoutAccount && !isEditingPayoutAccount) ||
                  (hasPayoutAccount &&
                    isEditingPayoutAccount &&
                    otpRequiredForPayoutEdit &&
                    (!payoutOtpSent || payoutOtp.length !== 4))
                }
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                <Save className="w-4 h-4" />
                {isSaving
                  ? "Saving..."
                  : hasPayoutAccount && !isEditingPayoutAccount
                  ? "Account Already Set Up"
                  : hasPayoutAccount && isEditingPayoutAccount
                  ? otpRequiredForPayoutEdit
                    ? "Verify OTP & Update Account"
                    : "Update Bank Account"
                  : "Save Bank Account"}
              </motion.button>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Security Settings
              </h2>
              <p className="text-gray-600">
                Update your password and manage account security
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Change Password
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={securityData.currentPassword}
                    onChange={(e) =>
                      setSecurityData({
                        ...securityData,
                        currentPassword: e.target.value,
                      })
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
                      setSecurityData({
                        ...securityData,
                        newPassword: e.target.value,
                      })
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
                      setSecurityData({
                        ...securityData,
                        confirmPassword: e.target.value,
                      })
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

            {/* Delete Account */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-1">
                    Delete Account
                  </h3>
                  <p className="text-sm text-gray-600">
                    Permanently delete your account and all associated data
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDeleteAccount}
                  disabled={isSaving}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </motion.button>
              </div>
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
            {user?.realtor && (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Your Booking Site</p>
                  <p className="font-mono text-sm font-medium text-gray-900">
                    {user.realtor.slug}.stayza.com
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (previewSiteUrl) {
                      copyToClipboard(previewSiteUrl);
                    }
                  }}
                  className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  title="Copy URL"
                >
                  <Copy className="w-5 h-5 text-gray-600" />
                </motion.button>
                <motion.a
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  href={previewSiteUrl || "#"}
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
