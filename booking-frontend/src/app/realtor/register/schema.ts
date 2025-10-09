import { z } from "zod";
import { CountryCode, parsePhoneNumber } from "libphonenumber-js";

// Subdomain normalization helper
export const normalizeSubdomain = (subdomain: string): string => {
  return subdomain.toLowerCase().replace(/[^a-z0-9]/g, "");
};

// Phone number validation helper
export const validatePhoneNumber = (
  phone: string,
  defaultCountry: CountryCode = "NG"
): {
  isValid: boolean;
  formatted: string;
  country: string;
  errorMessage?: string;
} => {
  try {
    if (!phone) {
      return {
        isValid: false,
        formatted: "",
        country: "",
        errorMessage: "Phone number is required",
      };
    }

    // Try parsing with default country first
    let phoneNumber;
    try {
      phoneNumber = parsePhoneNumber(phone, defaultCountry);
    } catch {
      // If parsing with default country fails, try without country
      phoneNumber = parsePhoneNumber(phone);
    }

    if (!phoneNumber) {
      return {
        isValid: false,
        formatted: phone,
        country: "",
        errorMessage: "Invalid phone number format",
      };
    }

    const isValid = phoneNumber.isValid();
    const formatted = phoneNumber.formatInternational();
    const country = phoneNumber.country || "";

    return {
      isValid,
      formatted,
      country,
      errorMessage: isValid ? undefined : "Phone number is not valid",
    };
  } catch (error) {
    return {
      isValid: false,
      formatted: phone,
      country: "",
      errorMessage: "Unable to validate phone number",
    };
  }
};

// Phone number normalization helper
export const normalizePhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, "");
};

// Email validation with business domain preference
export const validateBusinessEmail = (email: string) => {
  if (!email) return { isValid: false, message: "" };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: "Invalid email format" };
  }

  // Check for common personal email domains
  const personalDomains = [
    "gmail.com",
    "yahoo.com",
    "hotmail.com",
    "outlook.com",
    "icloud.com",
    "aol.com",
    "live.com",
    "msn.com",
  ];
  const domain = email.split("@")[1]?.toLowerCase();

  if (personalDomains.includes(domain)) {
    return {
      isValid: true,
      message: "Consider using a business email for better credibility",
      warning: true,
    };
  }

  return { isValid: true, message: "Business email looks good!" };
};

// Password strength validation
export const validatePasswordStrength = (password: string) => {
  if (!password) return { score: 0, feedback: [] };

  let score = 0;
  const feedback = [];

  // Length check
  if (password.length >= 8) score += 1;
  else feedback.push("At least 8 characters");

  // Uppercase check
  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push("One uppercase letter");

  // Lowercase check
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push("One lowercase letter");

  // Number check
  if (/\d/.test(password)) score += 1;
  else feedback.push("One number");

  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
  else feedback.push("One special character");

  return { score, feedback };
};

// Comprehensive registration schema
export const realtorRegistrationSchema = z
  .object({
    // Personal Information
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name is too long")
      .regex(/^[a-zA-Z\s'-]+$/, "Full name contains invalid characters"),

    businessEmail: z
      .string()
      .email("Please enter a valid email address")
      .refine((email) => validateBusinessEmail(email).isValid, {
        message: "Please enter a valid business email address",
      }),

    phoneNumber: z
      .string()
      .min(7, "Phone number is required")
      .refine((phone) => validatePhoneNumber(phone).isValid, {
        message: "Please enter a valid phone number",
      }),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/\d/, "Password must contain at least one number")
      .regex(
        /[!@#$%^&*(),.?":{}|<>]/,
        "Password must contain at least one special character"
      ),

    confirmPassword: z.string(),

    // Business Information
    agencyName: z
      .string()
      .min(2, "Agency name is required")
      .max(100, "Agency name is too long")
      .regex(/^[a-zA-Z0-9\s&'.-]+$/, "Agency name contains invalid characters"),

    tagline: z.string().max(150, "Tagline is too long").optional(),

    customSubdomain: z
      .string()
      .min(3, "Subdomain must be at least 3 characters")
      .max(30, "Subdomain is too long")
      .regex(
        /^[a-z0-9]+$/,
        "Subdomain must contain only lowercase letters and numbers"
      )
      .transform(normalizeSubdomain),

    corporateRegNumber: z
      .string()
      .max(50, "Registration number is too long")
      .optional(),

    businessAddress: z
      .string()
      .min(5, "Business address is required")
      .max(200, "Business address is too long"),

    // Branding & Customization
    primaryColor: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, "Primary color must be a valid hex color")
      .default("#1E3A8A"),

    secondaryColor: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, "Secondary color must be a valid hex color")
      .default("#047857"),

    accentColor: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, "Accent color must be a valid hex color")
      .default("#F97316"),

    customPrimaryColor: z
      .string()
      .regex(
        /^#[0-9A-F]{6}$/i,
        "Custom primary color must be a valid hex color"
      )
      .optional(),

    customSecondaryColor: z
      .string()
      .regex(
        /^#[0-9A-F]{6}$/i,
        "Custom secondary color must be a valid hex color"
      )
      .optional(),

    customAccentColor: z
      .string()
      .regex(/^#[0-9A-F]{6}$/i, "Custom accent color must be a valid hex color")
      .optional(),

    logo: z.any().optional(), // File upload

    // Social Media (optional)
    socials: z
      .object({
        instagram: z
          .string()
          .url("Instagram URL must be valid")
          .regex(
            /^https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9._-]+\/?$/,
            "Invalid Instagram URL format"
          )
          .optional()
          .or(z.literal("")),

        twitter: z
          .string()
          .url("Twitter URL must be valid")
          .regex(
            /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$/,
            "Invalid Twitter URL format"
          )
          .optional()
          .or(z.literal("")),

        facebook: z
          .string()
          .url("Facebook URL must be valid")
          .regex(
            /^https?:\/\/(www\.)?facebook\.com\/[a-zA-Z0-9._-]+\/?$/,
            "Invalid Facebook URL format"
          )
          .optional()
          .or(z.literal("")),

        tiktok: z
          .string()
          .url("TikTok URL must be valid")
          .regex(
            /^https?:\/\/(www\.)?tiktok\.com\/@[a-zA-Z0-9._-]+\/?$/,
            "Invalid TikTok URL format"
          )
          .optional()
          .or(z.literal("")),

        whatsapp: z
          .string()
          .regex(
            /^\+[1-9]\d{1,14}$/,
            "WhatsApp number must be in international format"
          )
          .optional()
          .or(z.literal("")),

        website: z
          .string()
          .url("Website URL must be valid")
          .optional()
          .or(z.literal("")),
      })
      .optional(),

    whatsappType: z.enum(["personal", "business"]).default("personal"),

    // Legal & Compliance
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: "You must accept the terms and conditions",
    }),

    privacyAccepted: z.boolean().refine((val) => val === true, {
      message: "You must accept the privacy policy",
    }),

    marketingOptIn: z.boolean().default(false),

    dataProcessingConsent: z.boolean().refine((val) => val === true, {
      message: "You must consent to data processing for account creation",
    }),

    // Additional metadata
    referralSource: z.string().optional(),

    specialRequirements: z
      .string()
      .max(500, "Special requirements text is too long")
      .optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      // Ensure subdomain doesn't conflict with reserved words
      const reservedSubdomains = [
        "admin",
        "api",
        "app",
        "blog",
        "dashboard",
        "dev",
        "help",
        "mail",
        "staging",
        "support",
        "test",
        "www",
      ];
      return !reservedSubdomains.includes(data.customSubdomain.toLowerCase());
    },
    {
      message: "This subdomain is reserved and cannot be used",
      path: ["customSubdomain"],
    }
  );

// Type inference from schema
export type RealtorRegistrationFormData = z.infer<
  typeof realtorRegistrationSchema
>;

// Step validation schemas for multi-step form
export const personalInfoSchema = realtorRegistrationSchema.pick({
  fullName: true,
  businessEmail: true,
  phoneNumber: true,
});

export const securitySchema = realtorRegistrationSchema.pick({
  password: true,
  confirmPassword: true,
});

export const businessInfoSchema = realtorRegistrationSchema.pick({
  agencyName: true,
  tagline: true,
  customSubdomain: true,
  corporateRegNumber: true,
  businessAddress: true,
});

export const brandingSchema = realtorRegistrationSchema.pick({
  primaryColor: true,
  secondaryColor: true,
  accentColor: true,
  customPrimaryColor: true,
  customSecondaryColor: true,
  customAccentColor: true,
  logo: true,
});

export const socialMediaSchema = realtorRegistrationSchema.pick({
  socials: true,
  whatsappType: true,
});

export const legalSchema = realtorRegistrationSchema.pick({
  termsAccepted: true,
  privacyAccepted: true,
  marketingOptIn: true,
  dataProcessingConsent: true,
});

// Validation helpers for specific steps
export const validateStep = (
  step: number,
  data: Partial<RealtorRegistrationFormData>
): { isValid: boolean; errors: string[] } => {
  const schemas = [
    personalInfoSchema,
    securitySchema,
    businessInfoSchema,
    brandingSchema,
    socialMediaSchema,
    legalSchema,
  ];

  if (step < 0 || step >= schemas.length) {
    return { isValid: false, errors: ["Invalid step"] };
  }

  try {
    schemas[step].parse(data);
    return { isValid: true, errors: [] };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        isValid: false,
        errors: error.issues.map((issue) => issue.message),
      };
    }
    return { isValid: false, errors: ["Validation failed"] };
  }
};

// Form data transformation for API submission
export const transformFormDataForAPI = (
  data: RealtorRegistrationFormData
): FormData => {
  const formData = new FormData();

  // Basic fields
  formData.append("email", data.businessEmail);
  formData.append("password", data.password);
  formData.append("firstName", data.fullName.split(" ")[0] || data.fullName);
  formData.append(
    "lastName",
    data.fullName.split(" ").slice(1).join(" ") || ""
  );
  formData.append("phone", data.phoneNumber);
  formData.append("role", "REALTOR");

  // Business information
  formData.append("agencyName", data.agencyName);
  formData.append("businessAddress", data.businessAddress);
  formData.append("customSubdomain", data.customSubdomain);

  if (data.tagline) formData.append("tagline", data.tagline);
  if (data.corporateRegNumber) {
    formData.append("corporateRegNumber", data.corporateRegNumber);
  }

  // Branding
  formData.append("primaryColor", data.customPrimaryColor || data.primaryColor);
  formData.append(
    "secondaryColor",
    data.customSecondaryColor || data.secondaryColor
  );
  formData.append("accentColor", data.customAccentColor || data.accentColor);

  // Logo file
  if (data.logo) {
    formData.append("logo", data.logo);
  }

  // Social media
  if (data.socials) {
    Object.entries(data.socials).forEach(([platform, url]) => {
      if (url) {
        formData.append(`social_${platform}`, url);
      }
    });
  }

  if (data.whatsappType) {
    formData.append("whatsappType", data.whatsappType);
  }

  // Legal
  formData.append("termsAccepted", data.termsAccepted.toString());
  formData.append("privacyAccepted", data.privacyAccepted.toString());
  formData.append("marketingOptIn", data.marketingOptIn.toString());
  formData.append(
    "dataProcessingConsent",
    data.dataProcessingConsent.toString()
  );

  // Additional metadata
  if (data.referralSource) {
    formData.append("referralSource", data.referralSource);
  }
  if (data.specialRequirements) {
    formData.append("specialRequirements", data.specialRequirements);
  }

  return formData;
};
