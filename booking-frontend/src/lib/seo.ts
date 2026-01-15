import { Metadata } from "next";

export const baseMetadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://stayza.pro"
  ),
  title: {
    default: "Stayza Pro - Property Booking Platform for Modern Realtors",
    template: "%s | Stayza Pro",
  },
  description:
    "Launch your branded property booking website in minutes. Direct payments with Paystack & Stripe, automated guest management, and zero commission. Perfect for realtors, property managers, and vacation rental businesses.",
  keywords: [
    "property booking platform",
    "realtor booking system",
    "vacation rental software",
    "property management software",
    "short-term rental platform",
    "booking website builder",
    "direct booking platform",
    "property rental software",
    "airbnb alternative",
    "commission-free booking",
    "paystack integration",
    "stripe payments",
    "automated booking system",
    "property management platform",
    "real estate booking",
  ],
  authors: [{ name: "Stayza Pro" }],
  creator: "Stayza Pro",
  publisher: "Stayza Pro",
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
    title: "Stayza Pro - Property Booking Platform for Modern Realtors",
    description:
      "Launch your branded property booking website in minutes. Direct payments, automated management, zero commission.",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Stayza Pro - Property Booking Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Stayza Pro - Property Booking Platform",
    description:
      "Launch your branded property booking website in minutes. Zero commission, direct payments.",
    images: ["/images/twitter-image.png"],
    creator: "@stayzapro",
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
    price: "0",
    priceCurrency: "USD",
    description: "Zero commission property booking platform",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    ratingCount: "150",
  },
  description:
    "Property booking platform for realtors and property managers. Launch branded booking websites with direct payments and automated management.",
  featureList: [
    "Branded booking websites",
    "Direct payment processing",
    "Automated guest management",
    "Zero commission platform",
    "Multi-property management",
    "Paystack & Stripe integration",
  ],
};

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Stayza Pro",
  url: "https://stayza.pro",
  logo: "https://stayza.pro/images/stayza.png",
  description: "Property booking platform for modern realtors",
  sameAs: [
    "https://twitter.com/stayzapro",
    "https://linkedin.com/company/stayzapro",
    // Add other social profiles
  ],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "Customer Support",
    email: "support@stayza.pro",
  },
};
