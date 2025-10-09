import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "../context/AuthContext";
import { QueryProvider } from "../context/QueryProvider";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stayza Pro – Smart Booking for Realtors and Guests",
  description:
    "Stayza Pro lets realtors create branded mini booking sites with Flutterwave/Paystack payouts, property management, guest reviews, maps, and more — all in one seamless platform.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <QueryProvider>
          <AuthProvider>
            <NotificationProvider>
              <AnalyticsProvider>{children}</AnalyticsProvider>
            </NotificationProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
