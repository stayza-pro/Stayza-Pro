import { GetStartedClient } from "@/app/(marketing)/get-started/GetStartedClient";

export const metadata = {
  title: "Get Started - Launch Your Booking Platform in Minutes",
  description:
    "Start accepting property bookings in 4 simple steps. Create your account, list properties, customize your branded site, and go live. No subscription fees, 10% commission only.",
  openGraph: {
    title: "Get Started - Launch Your Booking Platform in Minutes",
    description:
      "Start accepting property bookings in 4 simple steps. Create your account, list properties, and go live.",
    url: "/get-started",
  },
  alternates: {
    canonical: "/get-started",
  },
};

export default function GetStartedPage() {
  return <GetStartedClient />;
}
