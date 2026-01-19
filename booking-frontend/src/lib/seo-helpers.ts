// Internal links helper for better SEO
export const internalLinks = {
  home: { href: "/en", label: "Home" },
  joinWaitlist: { href: "/join-waitlist", label: "Join Waitlist" },
  howItWorks: { href: "/how-it-works", label: "How It Works" },
  getStarted: { href: "/get-started", label: "Get Started" },
  browse: { href: "/browse", label: "Browse Properties" },
  guestLanding: { href: "/guest-landing", label: "For Guests" },
  help: { href: "/help", label: "Help" },
  privacy: { href: "/legal/privacy", label: "Privacy Policy" },
  terms: { href: "/legal/terms", label: "Terms of Service" },
  bookingWebsite: {
    href: "/booking-website-for-realtors",
    label: "Booking Website",
  },
};

// Breadcrumb structured data helper
export function generateBreadcrumbStructuredData(
  items: Array<{ name: string; url: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `https://www.stayza.pro${item.url}`,
    })),
  };
}

// FAQ Page structured data helper
export function generateFAQStructuredData(
  faqs: Array<{ question: string; answer: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
