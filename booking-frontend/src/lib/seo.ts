import { Metadata } from "next";

export const baseMetadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://stayza.pro"
  ),
  title: {
    default: "Stayza Pro - Property Booking & Guest Management for Realtors",
    template: "%s | Stayza Pro",
  },
  description:
    "Complete booking management system for short-let and serviced apartment businesses. Branded guest portals, automated payments with escrow protection, real-time availability calendars, and integrated communication. Accept payments via Paystack with transparent commission tracking.",
  keywords: [
    "property booking management system",
    "short-let management software",
    "serviced apartment booking platform",
    "vacation rental management system",
    "realtor booking software",
    "direct booking platform",
    "property management with escrow",
    "automated guest management",
    "booking calendar system",
    "paystack booking integration",
    "commission-based booking platform",
    "multi-property management",
    "guest communication platform",
    "booking dispute resolution",
    "property rental automation",
  ],
  authors: [{ name: "Stayza Pro" }],
  creator: "Stayza Pro",
  publisher: "Stayza Pro",
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png" }],
    shortcut: ["/favicon.ico"],
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Stayza Pro",
    title: "Property Booking & Guest Management for Realtors | Stayza Pro",
    description:
      "Branded booking system with automated payments, escrow protection, and real-time guest communication. Manage unlimited properties with transparent commission tracking.",
    images: [
      {
        url: "https://res.cloudinary.com/dpffxy2bo/image/upload/v1768516276/stayza-branding/stayza-logo.png",
        width: 1200,
        height: 630,
        alt: "Stayza Pro - Property Booking Management System",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Property Booking & Guest Management System | Stayza Pro",
    description:
      "Branded guest portals, automated payments with escrow, real-time calendars. Transparent commission tracking.",
    images: [
      "https://res.cloudinary.com/dpffxy2bo/image/upload/v1768516276/stayza-branding/stayza-logo.png",
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    // yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
    // bing: process.env.NEXT_PUBLIC_BING_VERIFICATION,
  },
  alternates: {
    canonical: "/",
  },
};

export const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Stayza Pro",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    description:
      "Commission-based property booking management platform with Paystack payment integration",
    availability: "https://schema.org/InStock",
  },
  description:
    "Multi-tenant booking management platform for short-let properties and serviced apartments. Features branded guest portals, automated payment processing with escrow protection, real-time availability calendars, integrated guest communication, dispute resolution, and review management.",
  featureList: [
    "Branded guest booking portals",
    "Automated payment processing via Paystack",
    "Escrow payment protection",
    "Real-time booking calendars",
    "Multi-property management",
    "Integrated guest messaging",
    "Review and rating system",
    "Dispute resolution workflow",
    "Automated email notifications",
    "Commission tracking and payouts",
  ],
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Stayza Pro",
  url: "https://stayza.pro",
  logo: "https://res.cloudinary.com/dpffxy2bo/image/upload/v1768516276/stayza-branding/stayza-logo.png",
  description:
    "Multi-tenant property booking management platform for realtors and property managers",
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Customer Support",
    email: "support@stayza.pro",
    availableLanguage: ["English"],
  },
};
