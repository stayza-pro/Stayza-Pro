import { JoinWaitlistClient } from "@/app/(marketing)/join-waitlist/JoinWaitlistClient";

export const metadata = {
  title: "Join the Waitlist - Get Early Access to Stayza Pro",
  description:
    "Be among the first realtors to launch your branded booking platform. Join 100+ property managers on the waitlist. No subscription fees and transparent, booking-level payout previews.",
  openGraph: {
    title: "Join the Waitlist - Get Early Access to Stayza Pro",
    description:
      "Be among the first realtors to launch your branded booking platform. Join 100+ property managers on the waitlist.",
    url: "/join-waitlist",
  },
  alternates: {
    canonical: "/join-waitlist",
  },
};

export default function JoinWaitlistPage() {
  return <JoinWaitlistClient />;
}
