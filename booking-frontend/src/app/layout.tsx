import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { AuthProvider } from "../context/AuthContext";
import { QueryProvider } from "../context/QueryProvider";
import { AlertProvider } from "../context/AlertContext";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "optional",
  preload: true,
  adjustFontFallback: true,
});

export const metadata = {
  title: "Stayza - Property Booking Platform for Nigerian Realtors",
  description:
    "Your branded booking site. Live in minutes. Every realtor gets a branded booking website where clients book, pay, and receive receipts instantly.",
  metadataBase: new URL("https://www.stayza.pro"),
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_NG",
    url: "https://www.stayza.pro",
    siteName: "Stayza Pro",
    title: "Stayza Pro - Property Booking Platform for Nigerian Realtors",
    description:
      "Your branded booking site. Live in minutes. Every realtor gets a branded booking website where clients book, pay, and receive receipts instantly.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://stayza-pro.onrender.com" />
        <link rel="dns-prefetch" href="https://stayza-pro.onrender.com" />

        {/* Structured Data for Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Stayza Pro",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              url: "https://www.stayza.pro",
              description:
                "Property booking management platform for Nigerian realtors with branded guest portals, automated payments, and escrow protection.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "NGN",
                description:
                  "No subscription fees with transparent, booking-level commission and payout previews",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "127",
              },
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <PerformanceMonitor />
        <QueryProvider>
          <AuthProvider>
            <AlertProvider>
              <NotificationProvider>
                <AnalyticsProvider>{children}</AnalyticsProvider>
              </NotificationProvider>
            </AlertProvider>
          </AuthProvider>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
