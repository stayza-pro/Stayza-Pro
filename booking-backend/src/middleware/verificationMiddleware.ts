import { Request, Response, NextFunction } from "express";
import { AppError } from "@/middleware/errorHandler";
import { config } from "@/config";

/**
 * Middleware to validate email verification requests
 * Ensures proper token format and email format
 */
export const validateVerificationRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { token, email } = req.query;

  // Log verification attempt
  console.log("🔍 Email verification request validation:", {
    token: token ? `${String(token).substring(0, 10)}...` : "missing",
    email: email,
    origin: req.headers.origin,
    host: req.headers.host,
    userAgent: req.headers["user-agent"]?.substring(0, 50),
    ip: req.ip,
  });

  // Validate token presence and format
  if (!token) {
    throw new AppError("Verification token is required", 400);
  }

  if (typeof token !== "string" || token.length < 20) {
    console.log("❌ Invalid token format:", {
      type: typeof token,
      length: String(token).length,
    });
    throw new AppError("Invalid token format", 400);
  }

  // Validate email presence and basic format
  if (!email) {
    throw new AppError("Email address is required", 400);
  }

  if (typeof email !== "string" || !email.includes("@")) {
    console.log("❌ Invalid email format:", email);
    throw new AppError("Invalid email format", 400);
  }

  // Validate email format with regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email as string)) {
    console.log("❌ Email fails regex validation:", email);
    throw new AppError("Invalid email address format", 400);
  }

  // Rate limiting for verification attempts
  const userAttempts = (req as any).rateLimit;
  if (userAttempts && userAttempts.remaining < 1) {
    console.log("❌ Rate limit exceeded for verification attempts");
    throw new AppError(
      "Too many verification attempts. Please try again later.",
      429
    );
  }

  console.log("✅ Verification request validation passed");
  next();
};

/**
 * Middleware to handle cross-domain verification requests
 * Ensures subdomain verification works properly
 */
export const handleCrossDomainVerification = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const origin = req.headers.origin;
  const host = req.headers.host;

  console.log("🌐 Cross-domain verification check:", {
    origin,
    host,
    referer: req.headers.referer,
  });

  // Set additional CORS headers for verification endpoint
  if (origin) {
    const isValidOrigin =
      origin.includes("localhost") ||
      origin.includes("stayza.pro") ||
      origin.includes("127.0.0.1");

    if (isValidOrigin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      console.log("✅ Cross-domain headers set for origin:", origin);
    }
  }

  // Add cache control for verification responses
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");

  next();
};

/**
 * Middleware to log successful verification attempts
 */
export const logVerificationSuccess = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Override res.json to log successful verifications
  const originalJson = res.json;
  res.json = function (data: any) {
    if (data && data.success) {
      console.log("🎉 Email verification successful:", {
        email: req.query.email,
        timestamp: new Date().toISOString(),
        userAgent: req.headers["user-agent"]?.substring(0, 100),
        ip: req.ip,
        redirectUrl: data.redirectUrl,
        hasTokens: !!data.authTokens,
      });
    }
    return originalJson.call(this, data);
  };

  next();
};
