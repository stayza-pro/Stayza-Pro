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
  primaryForeground: "var(--marketing-primary-foreground, #f1f5f9)",
} as const;

export const brand = {
  name: "Stayza Pro",
  tagline: "Your booking site. Branded. Live in minutes.",
  logoIcon: {
    src: "/images/stayza.png",
    alt: "Stayza Pro Logo",
    width: 150,
    height: 150,
  },
} as const;

export const navLinks = [
  { label: "Why Stayza", href: "/why-stayza" },
  { label: "Capabilities", href: "/capabilities" },
  { label: "Workflow", href: "/workflow" },
  { label: "Signals", href: "/signals" },
  { label: "FAQ", href: "/faq" },
] as const;

export const heroHighlights: Array<{
  title: string;
  description: string;
  Icon: LucideIcon;
}> = [
  {
    title: "Your brand, your site",
    description:
      "Logo, colours, and style—make your booking link feel like your business, not ours.",
    Icon: MonitorSmartphone,
  },
  {
    title: "Money flows instantly",
    description:
      "Split payouts handled automatically. Guests pay online, funds clear straight to your account.",
    Icon: CreditCard,
  },
  {
    title: "See what matters",
    description:
      "Bookings, revenue, and refunds—everything in one dashboard. No chasing, no spreadsheets.",
    Icon: BarChart3,
  },
];

export const painPoints: Array<{
  title: string;
  description: string;
  Icon: LucideIcon;
}> = [
  {
    title: "Your brand gets buried",
    description:
      "Marketplaces push THEIR logo, not yours. Guests barely remember who you are.",
    Icon: Megaphone,
  },
  {
    title: "Payout chaos every month",
    description:
      "Spreadsheet math, late transfers, and missing commissions drain your time and trust.",
    Icon: RotateCcw,
  },
  {
    title: "Guests hate friction",
    description:
      "No favorites, clunky checkout, endless back-and-forth. Frustrated guests don’t return.",
    Icon: MessageSquare,
  },
  {
    title: "No proof when things go wrong",
    description:
      "Disputes, cancellations, and approvals vanish without a clear audit trail. You lose leverage.",
    Icon: ShieldCheck,
  },
];

export const featurePillars: Array<{
  title: string;
  copy: string;
  Icon: LucideIcon;
}> = [
  {
    title: "Branded microsites in minutes",
    copy: "Launch polished booking pages that carry your logo, colours, and URL—no more being lost in generic portals.",
    Icon: Globe,
  },
  {
    title: "Hands-free payouts & refunds",
    copy: "Flutterwave and Paystack integration move money instantly, track fees, and issue refunds without you touching a calculator.",
    Icon: Wallet,
  },
  {
    title: "A guest journey that sells itself",
    copy: "Interactive maps, wishlists, reviews, and auto-generated agreements keep guests confident and converting.",
    Icon: Users,
  },
  {
    title: "Compliance built in",
    copy: "Every approval, edit, and dispute is logged—giving you an audit trail banks, partners, and regulators trust.",
    Icon: ShieldCheck,
  },
];

export const workflowSteps: Array<{
  title: string;
  description: string;
  Icon: LucideIcon;
}> = [
  {
    title: "Claim your branded hub",
    description:
      "Pick your colours, drop in your logo, and instantly launch a custom ourapp.com/agency page that feels 100% yours.",
    Icon: UploadCloud,
  },
  {
    title: "Showcase listings that sell",
    description:
      "Upload photos in bulk, set smart pricing rules, and sync calendars so every enquiry is accurate and ready to book.",
    Icon: CalendarCheck,
  },
  {
    title: "Switch on payments & go live",
    description:
      "Connect Flutterwave or Paystack once. From that moment, payouts, receipts, and refunds just run automatically.",
    Icon: ShieldCheck,
  },
];

export const capabilityColumns = [
  {
    heading: "Portfolio & pricing",
    bullets: [
      "Upload once — photos, videos, amenities all in one place",
      "Smart calendar that prevents double-bookings automatically",
      "Flexible pricing rules for weekends, seasons, or channels",
    ],
  },
  {
    heading: "Payments & compliance",
    bullets: [
      "Split payouts hit every wallet instantly, no chasing transfers",
      "Refunds and disputes tracked with full audit history",
      "Auto-generated PDF receipts and contracts on every booking",
    ],
  },
  {
    heading: "Guest experience",
    bullets: [
      "Search and filter with map view for instant clarity",
      "Wishlists and booking history keep loyal guests coming back",
      "Photo reviews and verified badges build trust at a glance",
    ],
  },
] as const;

export const operationsSnapshots = [
  {
    title: "Real-time performance dashboard",
    description:
      "Track bookings, revenue, and cancellations at a glance — no spreadsheets, no waiting.",
  },
  {
    title: "Smart availability calendar",
    description:
      "Spot gaps, block dates, and prevent double-bookings with simple drag-and-drop control.",
  },
  {
    title: "Full accountability log",
    description:
      "Every approval, dispute, and admin action recorded automatically for total transparency.",
  },
] as const;

export const operationsMetrics = [
  {
    label: "Average payout time",
    value: "Same day",
    hint: "Funds land in your account as soon as bookings clear — no chasing transfers.",
  },
  {
    label: "Listings live in week one",
    value: "12",
    hint: "Bulk uploads and templates help new realtors launch fast without friction.",
  },
  {
    label: "Guest satisfaction",
    value: "4.9 / 5",
    hint: "Smooth search, wishlists, and trusted reviews keep guests coming back.",
  },
] as const;

export const integrationBadges = [
  { name: "Paystack Split", colour: palette.secondary },
  { name: "Google Maps", colour: palette.primary },
  { name: "Zapier", colour: palette.accent },
] as const;

export const caseStudies = [
  {
    company: "Harbor & Keys Realty",
    industry: "Independent brokerage",
    result: "2× direct bookings in 6 weeks",
    delta:
      "by replacing portal listings with their own branded microsite and automated payouts",
  },
  {
    company: "PalmStay Apartments",
    industry: "Serviced apartment collective",
    result: "+34% weekend revenue",
    delta:
      "after rolling out dynamic seasonal pricing and instant PDF lease agreements",
  },
  {
    company: "MetroHost Partners",
    industry: "Urban vacation rentals",
    result: "72% fewer chargebacks",
    delta: "thanks to verified realtor badges and built-in dispute workflows",
  },
] as const;

export const waitlistDetails = {
  headline: "Secure your onboarding slot",
  subcopy:
    "We open a limited number of white-glove engagements each month to keep migrations fast, personal, and hands-on.",
  bulletPoints: [
    "Your logo, colours, and listings live in week one",
    "Flutterwave or Paystack integration configured with compliance built in",
    "Custom reporting and automation playbooks tailored to your team",
  ],
  buttonLabel: "Book a discovery call",
} as const;

export const faqItems = [
  {
    question: "Do I need a developer to launch my microsite?",
    answer:
      "No. The setup is guided — upload your logo, choose your colours, and your branded hub is live in minutes.",
  },
  {
    question: "Can I use my own domain?",
    answer:
      "Yes. Point a subdomain like bookings.youragency.com, or use your ourapp.com/agency link — both keep your brand front and centre.",
  },
  {
    question: "How are payouts and fees handled?",
    answer:
      "Flutterwave or Paystack handle everything: commissions, refunds, receipts. Money flows automatically — no spreadsheets.",
  },
  {
    question: "What if I’m already using Airbnb or a marketplace?",
    answer:
      "You can keep them. Stayza Pro runs in parallel, giving you direct bookings you own while marketplaces stay as overflow.",
  },
  {
    question: "What about pricing and limits?",
    answer:
      "Start free with two listings and 5% commission. Upgrade to Pro for unlimited properties, analytics, and lower fees.",
  },
] as const;
