import { Inter } from "next/font/google";
import { AuthProvider } from "../context/AuthContext";
import { QueryProvider } from "../context/QueryProvider";
import { AlertProvider } from "../context/AlertContext";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { NotificationProvider } from "@/providers/NotificationProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
