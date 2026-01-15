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
  { label: "Why Stayza", href: "/#why" },
  { label: "Capabilities", href: "/#capabilities" },
  { label: "Workflow", href: "/#workflow" },
  { label: "Signals", href: "/#signals" },
  { label: "FAQ", href: "/#faq" },
] as const;

export const heroHighlights: Array<{
  title: string;
  description: string;
  Icon: LucideIcon;
}> = [
  {
    title: "Your brand. Fully owned.",
    description:
      "Get your own branded subdomain (yourbusiness.stayza.pro) with your logo and colours—no marketplace interference.",
    Icon: MonitorSmartphone,
  },
  {
    title: "Secure payouts with escrow",
    description:
      "All payments held in escrow. You get 90% after checkout, platform takes 10%—fully automated, fully transparent.",
    Icon: CreditCard,
  },
  {
    title: "CAC-verified trust badges",
    description:
      "Submit your Corporate Affairs Commission registration to get verified and build instant credibility with guests.",
    Icon: BarChart3,
  },
];

export const painPoints: Array<{
  title: string;
  description: string;
  Icon: LucideIcon;
}> = [
  {
    title: "Brand buried",
    description: "Marketplaces push their logo, not yours. Guests forget you.",
    Icon: Megaphone,
  },
  {
    title: "Payout chaos",
    description: "Late transfers, missing commissions, endless spreadsheets.",
    Icon: RotateCcw,
  },
  {
    title: "Guest friction",
    description: "Clunky checkout, no favorites, constant back-and-forth.",
    Icon: MessageSquare,
  },
  {
    title: "No proof",
    description: "Disputes and cancellations vanish without an audit trail.",
    Icon: ShieldCheck,
  },
];

export const featurePillars: Array<{
  title: string;
  copy: string;
  Icon: LucideIcon;
}> = [
  {
    title: "Branded subdomain websites",
    copy: "Get yourbusiness.stayza.pro with your logo and brand colors—no marketplace interference, just your brand.",
    Icon: Globe,
  },
  {
    title: "Escrow-protected payments",
    copy: "Paystack escrow holds funds securely. You get 90% after checkout, platform takes 10%—all automatic with full transparency.",
    Icon: Wallet,
  },
  {
    title: "CAC verification for trust",
    copy: "Submit your Corporate Affairs Commission certificate, get verified by admins, and display trust badges to increase bookings.",
    Icon: Users,
  },
  {
    title: "Complete audit trail",
    copy: "Every booking, payment, dispute, and admin action logged permanently for compliance, disputes, and financial reconciliation.",
    Icon: ShieldCheck,
  },
];

export const workflowSteps: Array<{
  title: string;
  description: string;
  Icon: LucideIcon;
}> = [
  {
    title: "Claim your branded subdomain",
    description:
      "Choose your subdomain (yourbusiness.stayza.pro), upload logo, and go live with your booking site instantly.",
    Icon: UploadCloud,
  },
  {
    title: "Get CAC verified",
    description:
      "Submit your Corporate Affairs Commission certificate for verification and unlock your trust badge.",
    Icon: CalendarCheck,
  },
  {
    title: "Connect Paystack for payouts",
    description:
      "Link your bank account once. Escrow system handles 90/10 splits automatically after every booking.",
    Icon: ShieldCheck,
  },
];

export const capabilityColumns = [
  {
    heading: "Portfolio & pricing",
    bullets: [
      "Unlimited property listings with photos, amenities, and pricing",
      "Smart calendar with drag-and-drop date blocking prevents double bookings",
      "Flexible pricing with optional cleaning and service fees",
    ],
  },
  {
    heading: "Payments & compliance",
    bullets: [
      "Escrow protection: 90% to realtor, 10% platform fee on room fees only",
      "CAC verification system with trust badges for verified businesses",
      "Full audit trail tracks every action, dispute, and payout for compliance",
    ],
  },
  {
    heading: "Guest experience",
    bullets: [
      "Branded booking sites at yourbusiness.stayza.pro with custom colors",
      "Wishlists, reviews with photos, and rating system for social proof",
      "Real-time notifications via email (Resend) for booking updates",
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
    label: "Payout timing",
    value: "1hr After checkin",
    hint: "90% of room fees released automatically when guests checks in — secure escrow protection.",
  },
  {
    label: "Property photos",
    value: "Up to 10",
    hint: "Upload up to 10 high-quality photos per property with drag-and-drop interface.",
  },
  {
    label: "Subdomain setup",
    value: "Instant",
    hint: "Your branded booking site at yourbusiness.stayza.pro goes live immediately after signup.",
  },
] as const;

export const integrationBadges = [
  { name: "Paystack", colour: palette.secondary },
  { name: "Cloudinary", colour: palette.primary },
  { name: "Resend", colour: palette.accent },
] as const;

export const caseStudies = [
  {
    company: "Pre-Launch Platform",
    industry: "Coming Soon",
    result: "500+ Realtors on Waitlist",
    delta:
      "Join early and be among the first to launch your branded booking site with escrow-protected payments",
  },
  {
    company: "Built for Nigerian Realtors",
    industry: "Local-First Features",
    result: "CAC Verification System",
    delta:
      "Submit your Corporate Affairs Commission certificate for admin review and get verified trust badges",
  },
  {
    company: "Unlimited Properties",
    industry: "No Subscription Fees",
    result: "10% Commission Only",
    delta:
      "Free platform access with unlimited property listings—earn 90% of every booking after checkout",
  },
] as const;

export const waitlistDetails = {
  headline: "Join the waitlist",
  subcopy:
    "Be among the first to launch when we go live. Get priority access to all platform features.",
  bulletPoints: [
    "Custom subdomain (yourbusiness.stayza.pro) with your logo and brand colors",
    "Paystack escrow system: earn 90% of bookings, platform takes 10% commission",
    "CAC verification for trust badges and unlimited property listings",
  ],
  buttonLabel: "Join the waitlist",
} as const;

export const faqItems = [
  {
    question: "Do I need a developer to launch my booking site?",
    answer:
      "No. Choose your subdomain, upload your logo, pick your brand colors, and your yourbusiness.stayza.pro site goes live instantly.",
  },
  {
    question: "Can I use my own custom domain?",
    answer:
      "Currently, all realtors get a stayza.pro subdomain (e.g., yourbusiness.stayza.pro). Custom domain pointing will be available in future updates.",
  },
  {
    question: "How do commissions and payouts work?",
    answer:
      "Guests pay via Paystack. Platform takes 10% of room fees only. You get 90% + 100% of cleaning fees automatically after 1 hour of check in. Guests also pay a 2% service fee.",
  },
  {
    question: "What is CAC verification?",
    answer:
      "Submit your Corporate Affairs Commission (CAC) registration certificate for admin review. Once approved, you get a verified trust badge displayed on your booking site.",
  },
  {
    question: "Are there property limits or subscription fees?",
    answer:
      "Currently free for all realtors with unlimited property listings. Platform earns only through the 10% commission on completed bookings. Paid plans with lower commission rates coming soon.",
  },
] as const;
