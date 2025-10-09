"use client";

import React, { ReactNode, useMemo } from "react";
import { UseFormWatch } from "react-hook-form";
import { RealtorRegistrationFormData } from "./schema";

interface ConditionalFieldProps {
  children: ReactNode;
  watch: UseFormWatch<RealtorRegistrationFormData>;
  condition: (data: Partial<RealtorRegistrationFormData>) => boolean;
  fallback?: ReactNode;
  className?: string;
}

export const ConditionalField: React.FC<ConditionalFieldProps> = ({
  children,
  watch,
  condition,
  fallback = null,
  className = "",
}) => {
  const watchedData = watch();

  const shouldShow = useMemo(() => {
    return condition(watchedData);
  }, [watchedData, condition]);

  if (!shouldShow) {
    return fallback ? <div className={className}>{fallback}</div> : null;
  }

  return <div className={className}>{children}</div>;
};

// Specific business logic conditions
export const businessTypeConditions = {
  // Show company fields for agencies and brokerages
  isCompanyBusiness: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.agencyName),

  // Show license verification for licensed business types
  requiresLicense: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.agencyName || data.corporateRegNumber),

  // Show team size for agencies and brokerages
  hasTeam: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.agencyName),

  // Show property management fields for property managers
  isPropertyManager: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.agencyName && data.specialRequirements?.includes("property")),

  // Show consultation fields for consultants
  isConsultant: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.specialRequirements?.includes("consulting")),

  // Show investor-specific fields
  isInvestor: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.specialRequirements?.includes("investment")),

  // Show service areas for location-based services
  needsServiceAreas: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.businessAddress),

  // Show specialization fields
  needsSpecialization: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.agencyName),

  // Show portfolio fields for investors and property managers
  hasPortfolio: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(
      data.specialRequirements?.includes("investment") ||
        data.specialRequirements?.includes("property")
    ),

  // Show marketing preferences for all business types
  needsMarketing: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.agencyName),

  // Show social media fields if socials are provided
  usesSocialMedia: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.socials),

  // Show website field if socials include website
  hasWebsite: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.socials?.website),

  // Show referral fields based on referral source
  usesReferrals: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.referralSource),

  // Show advertising fields if marketing opt-in is enabled
  usesPaidAds: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.marketingOptIn),
};

// Geographic conditions
export const geographicConditions = {
  // Show state/province field for certain countries
  needsStateProvince: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.businessAddress),

  // Show postal code field for most countries
  needsPostalCode: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.businessAddress),

  // Show region-specific license fields
  needsUSLicense: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.businessAddress) &&
    businessTypeConditions.requiresLicense(data),

  needsCALicense: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.businessAddress) &&
    businessTypeConditions.requiresLicense(data),

  // Show local market knowledge fields
  isLocalExpert: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.businessAddress && data.agencyName),
};

// Experience-based conditions
export const experienceConditions = {
  // Show advanced fields for experienced professionals
  isExperienced: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.agencyName && data.corporateRegNumber),

  // Show beginner guidance for new professionals
  isNewProfessional: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.agencyName && !data.corporateRegNumber),

  // Show mentorship fields for new professionals
  needsMentorship: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.agencyName && !data.corporateRegNumber && !data.socials),

  // Show leadership fields for very experienced professionals
  isLeader: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(
      data.agencyName && data.corporateRegNumber && data.socials?.website
    ),
};

// Validation-based conditions
export const validationConditions = {
  // Show confirmation field when email is entered
  needsEmailConfirmation: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.businessEmail && data.businessEmail.length > 0),

  // Show phone verification when phone is entered
  needsPhoneVerification: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.phoneNumber && data.phoneNumber.length > 0),

  // Show password confirmation when password meets minimum requirements
  needsPasswordConfirmation: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.password && data.password.length >= 8),

  // Show terms acceptance for all users
  needsTermsAcceptance: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.businessEmail || data.phoneNumber),

  // Show marketing consent for business users
  needsMarketingConsent: (data: Partial<RealtorRegistrationFormData>) =>
    businessTypeConditions.isCompanyBusiness(data),
};

// Accessibility conditions
export const accessibilityConditions = {
  // Show alternative formats for users who might need them
  needsAlternativeFormats: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.specialRequirements?.includes("accessibility")),

  // Show screen reader specific fields
  usesScreenReader: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.specialRequirements?.includes("screen_reader")),

  // Show keyboard navigation preferences
  needsKeyboardNav: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.specialRequirements?.includes("keyboard_only")),

  // Show high contrast options
  needsHighContrast: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.specialRequirements?.includes("high_contrast")),
};

// Combined condition helpers
export const createComplexCondition = (
  ...conditions: Array<(data: Partial<RealtorRegistrationFormData>) => boolean>
) => {
  return (data: Partial<RealtorRegistrationFormData>) =>
    conditions.every((condition) => condition(data));
};

export const createOrCondition = (
  ...conditions: Array<(data: Partial<RealtorRegistrationFormData>) => boolean>
) => {
  return (data: Partial<RealtorRegistrationFormData>) =>
    conditions.some((condition) => condition(data));
};

// Multi-step navigation conditions
export const stepConditions = {
  // Can proceed to step 2 (business info)
  canProceedToStep2: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.businessEmail && data.password && data.fullName),

  // Can proceed to step 3 (professional info)
  canProceedToStep3: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.agencyName && data.businessAddress),

  // Can proceed to step 4 (additional info)
  canProceedToStep4: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.customSubdomain),

  // Can proceed to final step (review)
  canProceedToReview: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(data.termsAccepted),

  // Ready to submit
  canSubmit: (data: Partial<RealtorRegistrationFormData>) =>
    Boolean(
      data.businessEmail &&
        data.password &&
        data.fullName &&
        data.agencyName &&
        data.businessAddress &&
        data.customSubdomain &&
        data.termsAccepted
    ),
};

// Form section visibility
export const sectionConditions = {
  showPersonalInfo: () => true, // Always show personal info

  showBusinessInfo: (data: Partial<RealtorRegistrationFormData>) =>
    stepConditions.canProceedToStep2(data),

  showProfessionalInfo: (data: Partial<RealtorRegistrationFormData>) =>
    stepConditions.canProceedToStep3(data),

  showAdditionalInfo: (data: Partial<RealtorRegistrationFormData>) =>
    stepConditions.canProceedToStep4(data),

  showReviewSection: (data: Partial<RealtorRegistrationFormData>) =>
    stepConditions.canProceedToReview(data),
};

export default ConditionalField;
