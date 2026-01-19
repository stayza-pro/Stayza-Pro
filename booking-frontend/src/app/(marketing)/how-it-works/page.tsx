import { HowItWorksClient } from "@/app/(marketing)/how-it-works/HowItWorksClient";

export const metadata = {
  title: "How It Works - Property Booking System for Realtors",
  description:
    "Learn how Stayza works for realtors and guests. Branded booking sites, automated payments with escrow, real-time calendars. Simple 4-step process to start accepting bookings.",
  openGraph: {
    title: "How It Works - Property Booking System for Realtors",
    description:
      "Learn how Stayza works for realtors and guests. Branded booking sites, automated payments with escrow, real-time calendars.",
    url: "/how-it-works",
  },
  alternates: {
    canonical: "/how-it-works",
  },
};

export default function HowItWorksPage() {
  return <HowItWorksClient />;
}
