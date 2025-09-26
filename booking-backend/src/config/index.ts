import dotenv from "dotenv";

dotenv.config();

export const config = {
  // Server
  PORT: parseInt(process.env.PORT || "5000", 10),
  NODE_ENV: process.env.NODE_ENV || "development",

  // Database
  DATABASE_URL: process.env.DATABASE_URL!,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET!,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || "30d",

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY!,
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET!,
  STRIPE_MANUAL_CAPTURE:
    (process.env.STRIPE_MANUAL_CAPTURE || "true").toLowerCase() === "true", // Control manual vs automatic capture

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

  // Frontend
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(
    process.env.RATE_LIMIT_WINDOW_MS || "900000",
    10
  ),
  RATE_LIMIT_MAX_REQUESTS: parseInt(
    process.env.RATE_LIMIT_MAX_REQUESTS || "100",
    10
  ),

  // Booking
  REFUND_WINDOW_HOURS: parseInt(process.env.REFUND_WINDOW_HOURS || "24", 10),

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
