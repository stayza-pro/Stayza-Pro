import { z } from "zod";

// Validation utilities
// Allow mixed case in subdomain input - will be normalized to lowercase
const subdomainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?$/;
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

// Subdomain normalization helper
export const normalizeSubdomain = (subdomain: string): string => {
  return subdomain.toLowerCase().trim();
};

const urlRegex =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// Business authorization validation

export const realtorRegistrationSchema = z
  .object({
    // Step 1: Account Details
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must be less than 100 characters")
      .regex(/^[a-zA-Z\s'-\.]+$/, "Invalid name format"),

    businessEmail: z.string().email("Invalid email format"),

    // Phone number removed for MVP

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/(?=.*[a-z])/, "Password must contain a lowercase letter")
      .regex(/(?=.*[A-Z])/, "Password must contain an uppercase letter")
      .regex(/(?=.*\d)/, "Password must contain a number")
      .regex(
        /(?=.*[!@#$%^&*()_+={}|[\]\\:";'<>?,./])/,
        "Password must contain a special character"
      ),

    confirmPassword: z.string(),

    // Step 2: Business Details
    agencyName: z
      .string()
      .min(2, "Agency name must be at least 2 characters")
      .max(100, "Agency name must be less than 100 characters"),

    tagline: z
      .string()
      .max(80, "Tagline must be less than 80 characters")
      .optional(),

    customSubdomain: z
      .string()
      .min(3, "Subdomain must be at least 3 characters")
      .max(63, "Subdomain must be less than 63 characters")
      .regex(
        subdomainRegex,
        "Use only letters, numbers, and hyphens. Must start and end with a letter or number."
      )
      .refine(async (subdomain) => {
        // Normalize subdomain for validation
        const normalized = normalizeSubdomain(subdomain);
        const forbidden = [
          "admin",
          "api",
          "www",
          "stayza",
          "app",
          "mail",
          "support",
        ];
        return !forbidden.includes(normalized);
      }, "Subdomain not available"),

    corporateRegNumber: z
      .string()
      .min(1, "Corporate registration number is required")
      .regex(/^[A-Z0-9-]+$/, "Invalid registration number format"),

    cacCertificate: z
      .instanceof(File)
      .refine(
        (file) => file && file.size <= 10 * 1024 * 1024,
        "CAC certificate file size must be less than 10MB"
      )
      .refine(
        (file) =>
          file &&
          (file.type === "application/pdf" || file.type.startsWith("image/")),
        "CAC certificate must be a PDF or image file"
      )
      .refine(
        (file) => file !== undefined && file !== null,
        "CAC certificate is required"
      )
      .nullable(),

    businessAddress: z
      .string()
      .min(10, "Business address must be at least 10 characters")
      .max(500, "Business address must be less than 500 characters"),

    // Step 3: Branding
    brandColor: z.string().regex(hexColorRegex, "Invalid color format"),
    primaryColor: z.string().regex(hexColorRegex, "Invalid color format"),
    secondaryColor: z.string().regex(hexColorRegex, "Invalid color format"),
    accentColor: z
      .string()
      .regex(hexColorRegex, "Invalid color format")
      .optional(),
    customPrimaryColor: z
      .string()
      .optional()
      .refine(
        (val) => !val || val === "" || hexColorRegex.test(val),
        "Invalid color format - use hex format like #FF0000"
      ),
    customSecondaryColor: z
      .string()
      .optional()
      .refine(
        (val) => !val || val === "" || hexColorRegex.test(val),
        "Invalid color format - use hex format like #FF0000"
      ),
    customAccentColor: z
      .string()
      .optional()
      .refine(
        (val) => !val || val === "" || hexColorRegex.test(val),
        "Invalid color format - use hex format like #FF0000"
      ),

    logo: z
      .instanceof(File)
      .refine(
        (file) => file.size <= 5 * 1024 * 1024,
        "Logo file size must be less than 5MB"
      )
      .refine(
        (file) => file.type.startsWith("image/"),
        "Logo must be an image file"
      )
      .nullable()
      .optional(),

    // Social media & WhatsApp removed for MVP

    // Step 5: Compliance & Review
    termsAccepted: z
      .boolean()
      .refine((val) => val === true, "You must accept the terms"),
    privacyAccepted: z
      .boolean()
      .refine((val) => val === true, "You must accept the privacy policy"),
    dataProcessingConsent: z
      .boolean()
      .refine((val) => val === true, "You must consent to data processing"),
    marketingOptIn: z.boolean().optional(),

    // Optional metadata
    referralCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RealtorRegistrationFormData = z.infer<
  typeof realtorRegistrationSchema
>;

// Step definitions for multi-step form
export const formSteps = [
  {
    id: "account",
    title: "Account Details",
    description: "Create your login credentials",
    fields: ["fullName", "businessEmail", "password", "confirmPassword"],
  },
  {
    id: "business",
    title: "Business Information",
    description: "Tell us about your real estate business",
    fields: [
      "agencyName",
      "tagline",
      "customSubdomain",
      "corporateRegNumber",
      "cacCertificate",
      "businessAddress",
    ],
  },
  {
    id: "branding",
    title: "Brand Customization",
    description: "Design your property booking site",
    fields: [
      "brandColor",
      "primaryColor",
      "secondaryColor",
      "accentColor",
      "customPrimaryColor",
      "customSecondaryColor",
      "customAccentColor",
    ],
  },
  {
    id: "review",
    title: "Review & Confirm",
    description: "Complete your registration",
    fields: [
      "termsAccepted",
      "privacyAccepted",
      "dataProcessingConsent",
      "marketingOptIn",
      "referralCode",
    ],
  },
] as const;

export type FormStepId = (typeof formSteps)[number]["id"];
