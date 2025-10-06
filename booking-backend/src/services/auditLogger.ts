import { prisma } from "@/config/database";
import { Request } from "express";

export type AuditAction =
  | "USER_REGISTER"
  | "USER_LOGIN"
  | "USER_LOGOUT"
  | "TOKEN_REFRESH"
  | "BOOKING_CREATE"
  | "BOOKING_CANCEL"
  | "BOOKING_STATUS_UPDATE"
  | "PAYMENT_INTENT_CREATED"
  | "PAYMENT_INITIALIZED"
  | "PAYMENT_COMPLETED"
  | "PAYMENT_FAILED"
  | "REFUND_PROCESSED"
  | "PAYOUT_PROCESSED"
  | "REALTOR_APPROVED"
  | "REALTOR_REJECTED"
  | "REALTOR_SUSPENDED"
  | "PROPERTY_APPROVED"
  | "PROPERTY_REJECTED"
  | "CAC_APPROVED"
  | "CAC_REJECTED"
  | "ADMIN_LOGIN"
  | "ADMIN_ACTION"
  | "SYSTEM_ERROR";

export type AuditEntity =
  | "USER"
  | "BOOKING"
  | "PAYMENT"
  | "REALTOR"
  | "PROPERTY"
  | "CAC_VERIFICATION"
  | "ADMIN";

interface LogOptions {
  entityId?: string;
  userId?: string | null;
  adminId?: string | null;
  details?: Record<string, any>;
  req?: Request;
  ipAddressOverride?: string;
  userAgentOverride?: string;
}

function extractIp(req?: Request): string | undefined {
  if (!req) return undefined;
  const fwd = (req.headers["x-forwarded-for"] as string) || "";
  return (
    fwd.split(",")[0].trim() || req.ip || (req.socket as any)?.remoteAddress
  );
}

function extractUA(req?: Request): string | undefined {
  if (!req) return undefined;
  return (req.headers["user-agent"] as string) || undefined;
}

export const auditLogger = {
  async log(action: AuditAction, entity: AuditEntity, opts: LogOptions = {}) {
    try {
      // Create audit log entry in database
      await prisma.auditLog.create({
        data: {
          action,
          entityType: entity,
          entityId: opts.entityId || "unknown",
          userId: opts.userId,
          adminId: opts.adminId,
          ipAddress: opts.ipAddressOverride || extractIp(opts.req),
          userAgent: opts.userAgentOverride || extractUA(opts.req),
          details: opts.details,
        },
      });

      // Also log to console for development
      console.log(`Audit: ${action} on ${entity}`, {
        entityId: opts.entityId,
        userId: opts.userId,
        adminId: opts.adminId,
        details: opts.details,
      });
    } catch (err) {
      // Silent fail to avoid impacting request lifecycle
      console.error("Audit log failure", action, entity, err);
    }
  },

  // Admin-specific logging helper
  async logAdminAction(
    adminId: string,
    action: AuditAction,
    entity: AuditEntity,
    entityId: string,
    details?: Record<string, any>,
    req?: Request
  ) {
    return this.log(action, entity, {
      entityId,
      adminId,
      details,
      req,
    });
  },
};

// Convenience helper wrappers
export const logUserRegister = (userId: string, email: string, req?: Request) =>
  auditLogger.log("USER_REGISTER", "USER", {
    entityId: userId,
    userId,
    details: { email },
    req,
  });

// Admin action helpers
export const logRealtorApproval = (
  adminId: string,
  realtorId: string,
  businessName: string,
  req?: Request
) =>
  auditLogger.logAdminAction(
    adminId,
    "REALTOR_APPROVED",
    "REALTOR",
    realtorId,
    { businessName },
    req
  );

export const logRealtorRejection = (
  adminId: string,
  realtorId: string,
  businessName: string,
  reason: string,
  req?: Request
) =>
  auditLogger.logAdminAction(
    adminId,
    "REALTOR_REJECTED",
    "REALTOR",
    realtorId,
    { businessName, reason },
    req
  );

export const logRealtorSuspension = (
  adminId: string,
  realtorId: string,
  businessName: string,
  reason: string,
  req?: Request
) =>
  auditLogger.logAdminAction(
    adminId,
    "REALTOR_SUSPENDED",
    "REALTOR",
    realtorId,
    { businessName, reason },
    req
  );

export const logPropertyApproval = (
  adminId: string,
  propertyId: string,
  propertyTitle: string,
  req?: Request
) =>
  auditLogger.logAdminAction(
    adminId,
    "PROPERTY_APPROVED",
    "PROPERTY",
    propertyId,
    { propertyTitle },
    req
  );

export const logPropertyRejection = (
  adminId: string,
  propertyId: string,
  propertyTitle: string,
  reason: string,
  req?: Request
) =>
  auditLogger.logAdminAction(
    adminId,
    "PROPERTY_REJECTED",
    "PROPERTY",
    propertyId,
    { propertyTitle, reason },
    req
  );

export const logPayoutProcessed = (
  adminId: string,
  paymentId: string,
  realtorId: string,
  amount: string,
  currency: string,
  req?: Request
) =>
  auditLogger.logAdminAction(
    adminId,
    "PAYOUT_PROCESSED",
    "PAYMENT",
    paymentId,
    { realtorId, amount, currency },
    req
  );
