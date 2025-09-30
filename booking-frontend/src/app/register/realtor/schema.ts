import { z } from "zod";

// Validation utilities
const phoneRegex = /^\+?[1-9]\d{1,14}$/;
const subdomainRegex = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;
const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const urlRegex =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// Business authorization validation
const businessEmailDomains = [
  "gmail.com",
  "yahoo.com",
  "hotmail.com",
  "outlook.com",
];
const isBusinessEmail = (email: string) => {
  const domain = email.split("@")[1];
  return !businessEmailDomains.includes(domain?.toLowerCase());
};

export const realtorRegistrationSchema = z
  .object({
    // Step 1: Account Details
    fullName: z
      .string()
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must be less than 100 characters")
      .regex(/^[a-zA-Z\s'-\.]+$/, "Invalid name format"),

    businessEmail: z
      .string()
      .email("Invalid email format")
      .refine(isBusinessEmail, "Please use a business email address"),

    phoneNumber: z
      .string()
      .regex(phoneRegex, "Invalid phone number format")
      .min(8, "Phone number too short")
      .max(20, "Phone number too long"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/(?=.*[a-z])/, "Password must contain a lowercase letter")
      .regex(/(?=.*[A-Z])/, "Password must contain an uppercase letter")
      .regex(/(?=.*\d)/, "Password must contain a number")
      .regex(/(?=.*[@$!%*?&])/, "Password must contain a special character"),

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
      .regex(subdomainRegex, "Invalid subdomain format")
      .refine(async (subdomain) => {
        // Simulate API check - replace with actual API call
        const forbidden = [
          "admin",
          "api",
          "www",
          "stayza",
          "app",
          "mail",
          "support",
        ];
        return !forbidden.includes(subdomain.toLowerCase());
      }, "Subdomain not available"),

    corporateRegNumber: z
      .string()
      .regex(/^[A-Z0-9-]+$/, "Invalid registration number format")
      .optional(),

    businessAddress: z
      .string()
      .min(10, "Business address must be at least 10 characters")
      .max(500, "Business address must be less than 500 characters"),

    // Step 3: Branding
    primaryColor: z.string().regex(hexColorRegex, "Invalid color format"),
    secondaryColor: z.string().regex(hexColorRegex, "Invalid color format"),
    accentColor: z
      .string()
      .regex(hexColorRegex, "Invalid color format")
      .optional(),
    customPrimaryColor: z
      .string()
      .regex(hexColorRegex, "Invalid color format")
      .optional(),
    customSecondaryColor: z
      .string()
      .regex(hexColorRegex, "Invalid color format")
      .optional(),
    customAccentColor: z
      .string()
      .regex(hexColorRegex, "Invalid color format")
      .optional(),

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

    // Step 4: Social & Media
    socials: z
      .record(
        z.string(),
        z.string().regex(urlRegex, "Invalid URL format").optional()
      )
      .optional(),
    whatsappType: z.enum(["personal", "business"]),

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
    fields: [
      "fullName",
      "businessEmail",
      "phoneNumber",
      "password",
      "confirmPassword",
    ],
  },
  {
    id: "business",
    title: "Business Information",
    description: "Tell us about your real estate business",
    fields: ["agencyName", "tagline", "customSubdomain", "corporateRegNumber"],
  },
  {
    id: "branding",
    title: "Brand Customization",
    description: "Design your property booking site",
    fields: [
      "primaryColor",
      "secondaryColor",
      "accentColor",
      "customPrimaryColor",
      "customSecondaryColor",
      "customAccentColor",
    ],
  },
  {
    id: "social",
    title: "Social Profiles",
    description: "Connect your social media accounts",
    fields: ["socials", "whatsappType"],
  },
  {
    id: "review",
    title: "Review & Confirm",
    description: "Complete your registration",
    fields: [
      "termsAccepted",
      "privacyAccepted",
      "businessAuthorized",
      "referralCode",
      "demoDataRequested",
    ],
  },
] as const;

export type FormStepId = (typeof formSteps)[number]["id"];
