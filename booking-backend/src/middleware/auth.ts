import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { prisma } from "@/config/database";
import { config } from "@/config";
import { AuthenticatedRequest, JWTPayload } from "@/types";

export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({
        success: false,
        message: "Access token required",
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Invalid token - user not found",
      });
      return;
    }

    req.user = user as any;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: "Token expired",
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: "Invalid token",
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Authentication error",
    });
    return;
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
      return;
    }

    next();
  };
};

// Helper function for single role requirements
export const requireRole = (role: UserRole) => {
  return authorize(role);
};

export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.JWT_SECRET) as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (user) {
      req.user = user as any;
    }
  } catch (error) {
    // Ignore authentication errors in optional auth
  }

  next();
};
