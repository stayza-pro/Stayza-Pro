import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { AuthProvider } from "../../context/AuthContext";
import { QueryProvider } from "../../context/QueryProvider";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";

export const metadata: Metadata = {
  title: "Stayza Pro – Smart Booking for Realtors and Guests",
  description:
    "Stayza Pro lets realtors create branded mini booking sites with Paystack payouts, property management, guest reviews, maps, and more — all in one seamless platform.",
};

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <QueryProvider>
        <AuthProvider>
          <NotificationProvider>
            <AnalyticsProvider>{children}</AnalyticsProvider>
          </NotificationProvider>
        </AuthProvider>
      </QueryProvider>
    </NextIntlClientProvider>
  );
}
