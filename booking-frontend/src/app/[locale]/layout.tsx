import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AuthProvider } from "../../context/AuthContext";
import { QueryProvider } from "../../context/QueryProvider";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = {
  title: "Stayza Pro - Smart Booking for Realtors and Guests",
  description:
    "Stayza Pro lets realtors create branded mini booking sites with Paystack payouts, property management, guest reviews, maps, and more - all in one seamless platform.",
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png" }],
    shortcut: ["/favicon.ico"],
  },
};

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!routing.locales.includes(locale)) {
    notFound();
  }

  return (
    <QueryProvider>
      <AuthProvider>
        <NotificationProvider>
          <AnalyticsProvider>{children}</AnalyticsProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryProvider>
  );
}
