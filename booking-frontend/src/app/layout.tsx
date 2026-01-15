import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "../context/AuthContext";
import { QueryProvider } from "../context/QueryProvider";
import { AlertProvider } from "../context/AlertContext";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Stayza Pro – Smart Booking for Realtors and Guests",
  description:
    "Stayza Pro lets realtors create branded mini booking sites with Paystack payouts, property management, guest reviews, maps, and more — all in one seamless platform.",
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon.png", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png" }],
    shortcut: ["/favicon.ico"],
  },
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
            <AlertProvider>
              <NotificationProvider>
                <AnalyticsProvider>{children}</AnalyticsProvider>
              </NotificationProvider>
            </AlertProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
