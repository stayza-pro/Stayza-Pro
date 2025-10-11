import rateLimit from "express-rate-limit";
import { config } from "@/config";

// General API rate limiting
export const apiLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS, // 15 minutes
  max: config.RATE_LIMIT_MAX_REQUESTS, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiting for auth routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000000, // limit each IP to 1000000 requests per windowMs
  message: {
    success: false,
    message: "Too many authentication attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset rate limiting
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset requests per hour
  message: {
    success: false,
    message: "Too many password reset attempts, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Booking rate limiting
export const bookingLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 booking requests per minute
  message: {
    success: false,
    message: "Too many booking requests, please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
