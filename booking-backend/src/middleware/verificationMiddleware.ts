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
  

  // Validate token presence and format
  if (!token) {
    throw new AppError("Verification token is required", 400);
  }

  if (typeof token !== "string" || token.length < 20) {
    
    throw new AppError("Invalid token format", 400);
  }

  // Validate email presence and basic format
  if (!email) {
    throw new AppError("Email address is required", 400);
  }

  if (typeof email !== "string" || !email.includes("@")) {
    
    throw new AppError("Invalid email format", 400);
  }

  // Validate email format with regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email as string)) {
    
    throw new AppError("Invalid email address format", 400);
  }

  // Rate limiting for verification attempts
  const userAttempts = (req as any).rateLimit;
  if (userAttempts && userAttempts.remaining < 1) {
    
    throw new AppError(
      "Too many verification attempts. Please try again later.",
      429
    );
  }

  
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

  

  // Set additional CORS headers for verification endpoint
  if (origin) {
    const isValidOrigin =
      origin.includes("localhost") ||
      origin.includes("stayza.pro") ||
      origin.includes("127.0.0.1");

    if (isValidOrigin) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
      
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
      void data;
    }
    return originalJson.call(this, data);
  };

  next();
};
