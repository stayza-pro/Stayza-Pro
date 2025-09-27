import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  CalendarCheck,
  CreditCard,
  Globe,
  Megaphone,
  MessageSquare,
  MonitorSmartphone,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
  Wallet,
} from "lucide-react";

export const palette = {
  primary: "var(--marketing-primary, #1E3A8A)",
  secondary: "var(--marketing-secondary, #047857)",
  accent: "var(--marketing-accent, #F97316)",
  neutralLight: "var(--marketing-surface, #F3F4F6)",
  neutralDark: "var(--marketing-foreground, #111827)",
} as const;

export const brand = {
  name: "Stayza Pro",
  tagline: "Branded booking microsites with automatic split payouts.",
  logoIcon: Sparkles,
} as const;

export const navLinks = [
  { label: "Why Stayza", href: "#why" },
  { label: "Capabilities", href: "#capabilities" },
  { label: "Workflow", href: "#workflow" },
  { label: "Signals", href: "#signals" },
  { label: "FAQ", href: "#faq" },
] as const;

export const heroHighlights: Array<{
  title: string;
  description: string;
  Icon: LucideIcon;
}> = [
  {
    title: "Custom-branded microsites",
    description:
      "Upload your logo, pick colours, and share your ourapp.com/agency link in minutes.",
    Icon: MonitorSmartphone,
  },
  {
    title: "Automatic split payouts",
    description:
      "Stripe Connect or Paystack Split routes every payment between you and your agents automatically.",
    Icon: CreditCard,
  },
  {
    title: "Numbers that drive action",
    description:
      "Dashboards surface bookings, revenue, and cancellations without spreadsheet gymnastics.",
    Icon: BarChart3,
  },
];

export const painPoints: Array<{
  title: string;
  description: string;
  Icon: LucideIcon;
}> = [
  {
    title: "Generic portals dilute trust",
    description:
      "Marketplace listings bury your brand and scatter enquiries across inboxes.",
    Icon: Megaphone,
  },
  {
    title: "Manual payout gymnastics",
    description:
      "Chasing transfers, calculating commissions, and logging refunds eats into selling time.",
    Icon: RotateCcw,
  },
  {
    title: "Fragmented guest experience",
    description:
      "Guests can’t filter, favourite, or checkout without endless back-and-forth.",
    Icon: MessageSquare,
  },
  {
    title: "Zero audit trail",
    description:
      "Approvals, disputes, and actions vanish without a system-level log.",
    Icon: ShieldCheck,
  },
];

export const featurePillars: Array<{
  title: string;
  copy: string;
  Icon: LucideIcon;
}> = [
  {
    title: "Build once, brand everywhere",
    copy: "Spin up microsites, emails, and receipts that match your logo, colours, and custom URL.",
    Icon: Globe,
  },
  {
    title: "Automate money movement",
    copy: "Stripe Connect and Paystack Split route payouts, refunds, and fees without manual work.",
    Icon: Wallet,
  },
  {
    title: "Delight every guest journey",
    copy: "Wishlists, maps, reviews, and PDF agreements keep guests confident from browse to stay.",
    Icon: Users,
  },
];

export const workflowSteps: Array<{
  title: string;
  description: string;
  Icon: LucideIcon;
}> = [
  {
    title: "Sign up and claim your link",
    description:
      "Choose your colours, upload your logo, and launch a branded ourapp.com/agency microsite.",
    Icon: UploadCloud,
  },
  {
    title: "List properties and pricing",
    description:
      "Bulk upload photos, set weekend or seasonal rules, and keep calendars in sync.",
    Icon: CalendarCheck,
  },
  {
    title: "Connect payouts and go live",
    description:
      "Authenticate Stripe or Paystack once, share your link, and let automated receipts handle the rest.",
    Icon: ShieldCheck,
  },
];

export const capabilityColumns = [
  {
    heading: "Portfolio & pricing",
    bullets: [
      "Bulk import listings with rich media and amenities",
      "Smart availability calendar with conflict prevention",
      "Weekend, seasonal, and channel-specific rate rules",
    ],
  },
  {
    heading: "Payments & compliance",
    bullets: [
      "Instant split payouts with transparent ledger visibility",
      "Refund and dispute workflows backed by audit logs",
      "Automatic PDF receipts and lease agreements per booking",
    ],
  },
  {
    heading: "Guest experience",
    bullets: [
      "Filters by location, price, and amenities with map view",
      "Wishlists and booking history for returning guests",
      "Photo reviews and verified realtor badges for trust",
    ],
  },
] as const;

export const operationsSnapshots = [
  {
    title: "Live performance dashboard",
    description:
      "Bookings, revenue, cancellations, and occupancy trends update in real time for every realtor.",
  },
  {
    title: "Availability control centre",
    description:
      "Drag-and-drop calendars highlight gaps, blocked dates, and overbook risks instantly.",
  },
  {
    title: "Admin oversight & logs",
    description:
      "Approvals, disputes, and moderation actions are recorded with a full audit trail.",
  },
] as const;

export const operationsMetrics = [
  {
    label: "Average payout time",
    value: "Same day",
    hint: "Stripe Connect and Paystack Split transfer funds as soon as bookings clear.",
  },
  {
    label: "Listings launched week one",
    value: "12",
    hint: "Bulk uploads and reusable templates accelerate onboarding for new realtors.",
  },
  {
    label: "Guest satisfaction",
    value: "4.9 / 5",
    hint: "Wishlists, maps, and photo reviews keep guests engaged and confident.",
  },
] as const;

export const integrationBadges = [
  { name: "Stripe Connect", colour: palette.neutralDark },
  { name: "Paystack Split", colour: palette.secondary },
  { name: "Google Maps", colour: palette.primary },
  { name: "Zapier", colour: palette.accent },
] as const;

export const caseStudies = [
  {
    company: "Harbor & Keys Realty",
    industry: "Independent brokerage",
    result: "2× more direct bookings in 45 days",
    delta:
      "by launching branded microsites with automated Stripe Connect payouts",
  },
  {
    company: "PalmStay Apartments",
    industry: "Serviced apartment collective",
    result: "Weekend revenue up 34%",
    delta:
      "after rolling out seasonal pricing rules and automated PDF lease agreements",
  },
  {
    company: "MetroHost Partners",
    industry: "Urban vacation rentals",
    result: "Chargebacks down 72%",
    delta:
      "thanks to verified realtor badges and mapped dispute workflows",
  },
] as const;

export const waitlistDetails = {
  headline: "Stayza Pro launch cohort",
  subcopy:
    "We activate a limited number of realtor teams each month to keep migrations hands-on and fast.",
  bulletPoints: [
    "Guided branding and property import in week one",
    "Stripe Connect or Paystack Split configured with compliance checks",
    "Reporting and automation playbooks tailored to your portfolio",
  ],
  buttonLabel: "Apply for early access",
} as const;

export const faqItems = [
  {
    question: "Do I need a developer to launch my microsite?",
    answer:
      "No. Upload your assets, choose colours, and pick your custom URL with guided steps and live previews.",
  },
  {
    question: "Can I stay on my own domain?",
    answer:
      "Yes. Point any subdomain or use ourapp.com/your-name — both keep the experience fully branded.",
  },
  {
    question: "How are payouts and fees handled?",
    answer:
      "Connect Stripe Connect or Paystack Split once. We route commissions, refunds, and receipts automatically.",
  },
  {
    question: "What about plans and limits?",
    answer:
      "Start free with two live listings. Upgrade to Pro for unlimited properties, analytics, and custom branding.",
  },
] as const;
