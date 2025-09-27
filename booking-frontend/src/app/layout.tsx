import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "../context/AuthContext";
import { QueryProvider } from "../context/QueryProvider";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import "../styles/globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "BookingApp - Find Your Perfect Stay",
  description: "Discover and book amazing accommodations worldwide",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AnalyticsProvider>
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
