"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Globe,
  Award,
  Calendar,
  Star,
  Building,
  Camera,
  Eye,
  EyeOff,
  Share2,
  Download,
  Edit,
  CheckCircle,
  AlertCircle,
  Clock,
} from "lucide-react";
import { RealtorRegistrationFormData } from "./schema";

interface PreviewComponentProps {
  formData: Partial<RealtorRegistrationFormData>;
  currentStep: number;
  onEditSection?: (section: string) => void;
  isVisible?: boolean;
  onToggleVisibility?: (visible: boolean) => void;
  className?: string;
}

export const PreviewComponent: React.FC<PreviewComponentProps> = ({
  formData,
  currentStep,
  onEditSection,
  isVisible = true,
  onToggleVisibility,
  className = "",
}) => {
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop"
  );
  const [showMissingFields, setShowMissingFields] = useState(false);

  // Calculate completion percentage
  const completionData = useMemo(() => {
    const requiredFields = [
      "fullName",
      "businessEmail",
      "phone",
      "businessType",
      "yearsExperience",
      "address",
      "agreeToTerms",
    ];

    const optionalFields = [
      "profilePhoto",
      "website",
      "socialMedia",
      "specializations",
      "serviceAreas",
      "companyName",
      "licenseNumber",
      "bio",
    ];

    const completedRequired = requiredFields.filter((field) => {
      const value = formData[field as keyof RealtorRegistrationFormData];
      return value !== undefined && value !== null && value !== "";
    }).length;

    const completedOptional = optionalFields.filter((field) => {
      const value = formData[field as keyof RealtorRegistrationFormData];
      return value !== undefined && value !== null && value !== "";
    }).length;

    const requiredPercentage =
      (completedRequired / requiredFields.length) * 100;
    const optionalPercentage =
      (completedOptional / optionalFields.length) * 100;
    const overallPercentage =
      ((completedRequired + completedOptional) /
        (requiredFields.length + optionalFields.length)) *
      100;

    return {
      required: requiredPercentage,
      optional: optionalPercentage,
      overall: overallPercentage,
      completedRequired,
      totalRequired: requiredFields.length,
      completedOptional,
      totalOptional: optionalFields.length,
    };
  }, [formData]);

  // Get missing required fields
  const missingFields = useMemo(() => {
    const required = [
      { key: "fullName", label: "Full Name" },
      { key: "businessEmail", label: "Business Email" },
      { key: "phone", label: "Phone" },
      { key: "businessType", label: "Business Type" },
      { key: "yearsExperience", label: "Years of Experience" },
      { key: "address", label: "Address" },
    ];

    return required.filter((field) => {
      const value = formData[field.key as keyof RealtorRegistrationFormData];
      return !value || value === "";
    });
  }, [formData]);

  // Format display values
  const formatBusinessType = (type: string) => {
    return (
      type?.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) || ""
    );
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone) return "";
    // Simple formatting for display
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
        6
      )}`;
    }
    return phone;
  };

  const getProfileCompleteness = () => {
    if (completionData.required < 100) return "incomplete";
    if (completionData.optional < 50) return "basic";
    if (completionData.optional < 80) return "good";
    return "excellent";
  };

  const getCompletenessColor = () => {
    const status = getProfileCompleteness();
    switch (status) {
      case "incomplete":
        return "text-red-600 bg-red-50 border-red-200";
      case "basic":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      case "good":
        return "text-blue-600 bg-blue-50 border-blue-200";
      case "excellent":
        return "text-green-600 bg-green-50 border-green-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Eye className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-900">Profile Preview</h3>
              <p className="text-sm text-gray-500">
                See how your profile will look to clients
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setPreviewMode("desktop")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  previewMode === "desktop"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Desktop
              </button>
              <button
                onClick={() => setPreviewMode("mobile")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  previewMode === "mobile"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Mobile
              </button>
            </div>

            {/* Hide/Show Toggle */}
            {onToggleVisibility && (
              <button
                onClick={() => onToggleVisibility(false)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-50"
                title="Hide preview"
              >
                <EyeOff className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Completion Status */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Profile Completeness
            </span>
            <span className="text-sm text-gray-600">
              {Math.round(completionData.overall)}%
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <motion.div
              className="bg-blue-600 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${completionData.overall}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>
              Required: {completionData.completedRequired}/
              {completionData.totalRequired}
            </span>
            <span>
              Optional: {completionData.completedOptional}/
              {completionData.totalOptional}
            </span>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className={`mt-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCompletenessColor()}`}
        >
          {getProfileCompleteness() === "incomplete" && (
            <AlertCircle className="w-3 h-3 mr-1" />
          )}
          {getProfileCompleteness() === "excellent" && (
            <CheckCircle className="w-3 h-3 mr-1" />
          )}
          {getProfileCompleteness() === "basic" && (
            <Clock className="w-3 h-3 mr-1" />
          )}
          {getProfileCompleteness() === "good" && (
            <Star className="w-3 h-3 mr-1" />
          )}
          Profile {getProfileCompleteness()}
        </div>
      </div>

      {/* Preview Content */}
      <div className="p-6">
        <div
          className={`mx-auto transition-all duration-300 ${
            previewMode === "mobile" ? "max-w-sm" : "max-w-2xl"
          }`}
        >
          {/* Profile Card */}
          <motion.div
            layout
            className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-6 border border-blue-200"
          >
            {/* Header Section */}
            <div className="flex items-start space-x-4 mb-6">
              {/* Profile Photo */}
              <div className="relative">
                {formData.logo ? (
                  <img
                    src={
                      typeof formData.logo === "string"
                        ? formData.logo
                        : URL.createObjectURL(formData.logo)
                    }
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-4 border-white shadow-sm">
                    {formData.fullName ? (
                      <span className="text-white font-semibold text-xl">
                        {formData.fullName.split(" ")[0]?.[0] || ""}
                        {formData.fullName.split(" ")[1]?.[0] || ""}
                      </span>
                    ) : (
                      <Camera className="w-8 h-8 text-white" />
                    )}
                  </div>
                )}

                {!formData.logo && onEditSection && (
                  <button
                    onClick={() => onEditSection("photo")}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
                    title="Add photo"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Basic Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      {formData.fullName || "Your Name"}
                    </h2>

                    {formData.tagline && (
                      <p className="text-blue-700 font-medium">
                        {formData.tagline}
                      </p>
                    )}

                    {formData.agencyName && (
                      <p className="text-gray-600 flex items-center space-x-1 mt-1">
                        <Building className="w-4 h-4" />
                        <span>{formData.agencyName}</span>
                      </p>
                    )}
                  </div>

                  {onEditSection && (
                    <button
                      onClick={() => onEditSection("basic")}
                      className="p-1 text-gray-500 hover:text-gray-700 rounded"
                      title="Edit basic info"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Experience */}
                {formData.corporateRegNumber && (
                  <div className="flex items-center space-x-1 mt-2 text-gray-600">
                    <Award className="w-4 h-4" />
                    <span className="text-sm">Registered Business</span>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {formData.businessEmail && (
                <div className="flex items-center space-x-2 text-gray-700">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">{formData.businessEmail}</span>
                </div>
              )}

              {formData.phoneNumber && (
                <div className="flex items-center space-x-2 text-gray-700">
                  <Phone className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">
                    {formatPhoneNumber(formData.phoneNumber)}
                  </span>
                </div>
              )}

              {formData.businessAddress && (
                <div className="flex items-center space-x-2 text-gray-700">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <span className="text-sm">{formData.businessAddress}</span>
                </div>
              )}

              {formData.socials?.website && (
                <div className="flex items-center space-x-2 text-gray-700">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <a
                    href={formData.socials.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    {formData.socials.website.replace(/^https?:\/\//, "")}
                  </a>
                </div>
              )}
            </div>

            {/* Special Requirements */}
            {formData.specialRequirements && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">About</h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {formData.specialRequirements}
                </p>
              </div>
            )}

            {/* Referral Source */}
            {formData.referralSource && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  How did you hear about us?
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                    {formData.referralSource}
                  </span>
                </div>
              </div>
            )}

            {/* Social Media */}
            {formData.socials &&
              Object.keys(formData.socials).some(
                (key) =>
                  formData.socials?.[key as keyof typeof formData.socials]
              ) && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Connect</h3>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(formData.socials).map(
                      ([platform, url]) =>
                        url && (
                          <a
                            key={platform}
                            href={typeof url === "string" ? url : "#"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full hover:bg-gray-200 transition-colors"
                          >
                            {platform.charAt(0).toUpperCase() +
                              platform.slice(1)}
                          </a>
                        )
                    )}
                  </div>
                </div>
              )}

            {/* Registration Information */}
            {formData.corporateRegNumber && (
              <div className="text-center pt-4 border-t border-blue-200">
                <p className="text-xs text-gray-600">
                  Registration #{formData.corporateRegNumber}
                </p>
              </div>
            )}
          </motion.div>

          {/* Missing Fields Alert */}
          {missingFields.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg"
            >
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-800">
                    Complete Your Profile
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Add the following required information to activate your
                    profile:
                  </p>

                  <button
                    onClick={() => setShowMissingFields(!showMissingFields)}
                    className="text-sm text-yellow-600 hover:text-yellow-800 underline mt-2"
                  >
                    {showMissingFields ? "Hide" : "Show"} missing fields (
                    {missingFields.length})
                  </button>

                  <AnimatePresence>
                    {showMissingFields && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2"
                      >
                        <ul className="space-y-1">
                          {missingFields.map((field) => (
                            <li
                              key={field.key}
                              className="text-sm text-yellow-700 flex items-center space-x-2"
                            >
                              <span className="w-1 h-1 bg-yellow-500 rounded-full" />
                              <span>{field.label}</span>
                              {onEditSection && (
                                <button
                                  onClick={() => onEditSection(field.key)}
                                  className="text-yellow-600 hover:text-yellow-800 underline ml-auto"
                                >
                                  Add
                                </button>
                              )}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Preview updates automatically as you complete the form
          </p>

          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                navigator.share?.({
                  title: "My Realtor Profile",
                  text: `Check out ${
                    formData.fullName || "this"
                  }'s realtor profile`,
                  url: window.location.href,
                })
              }
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-white transition-colors"
              title="Share preview"
            >
              <Share2 className="w-4 h-4" />
            </button>

            <button
              onClick={() => window.print()}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-white transition-colors"
              title="Print preview"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewComponent;
