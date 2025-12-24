import dotenv from "dotenv";

dotenv.config();

const toBoolean = (value: string | undefined, fallback: boolean): boolean => {
  return (value ?? String(fallback)).toLowerCase() === "true";
};

export const config = {
  // Server
  PORT: parseInt(process.env.PORT || "5050", 10),
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database
  DATABASE_URL: process.env.DATABASE_URL!,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "30d",

  // Paystack
  PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY!,
  PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY!,
  PAYSTACK_WEBHOOK_SECRET: process.env.PAYSTACK_WEBHOOK_SECRET!,

  // Cloudinary
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME!,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY!,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET!,

  // Email
  SMTP_HOST: process.env.SMTP_HOST!,
  SMTP_PORT: parseInt(process.env.SMTP_PORT || "587", 10),
  SMTP_USER: process.env.SMTP_USER!,
  SMTP_PASS: process.env.SMTP_PASS!,
  SMTP_SECURE: toBoolean(
    process.env.SMTP_SECURE,
    (process.env.SMTP_PORT || "587") === "465"
  ),

  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",

  // Domain Configuration
  MAIN_DOMAIN: process.env.MAIN_DOMAIN || "stayza.pro",
  DEV_DOMAIN: process.env.DEV_DOMAIN || "localhost:3000",
  NODE_ENV_DOMAIN: process.env.NODE_ENV_DOMAIN || "development",

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(
    process.env.RATE_LIMIT_WINDOW_MS || "900000",
    1000000
  ),
  RATE_LIMIT_MAX_REQUESTS: parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || "100",
    10
  ),

  // Booking
  REFUND_WINDOW_HOURS: parseInt(process.env.REFUND_WINDOW_HOURS || "24", 10),
  BOOKING_PAYMENT_TIMEOUT_MINUTES: parseInt(
    process.env.BOOKING_PAYMENT_TIMEOUT_MINUTES || "30",
    10
  ),

  // Financial (platform economics)
  SERVICE_FEE_RATE: parseFloat(process.env.SERVICE_FEE_RATE || "0.12"), // 12% of property price (visible service fee)
  DEFAULT_PLATFORM_COMMISSION_RATE: parseFloat(
    process.env.DEFAULT_PLATFORM_COMMISSION_RATE || "0.05"
  ), // 5% of property price (taken from property price portion)
  ESCROW_RELEASE_OFFSET_HOURS: parseInt(
    process.env.ESCROW_RELEASE_OFFSET_HOURS || "0",
    10
  ), // If >0, delay payout release this many hours after check-in
};

// Validate required environment variables
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
