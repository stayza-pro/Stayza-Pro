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
  | "PAYOUT_RELEASED"
  | "DISPUTE_CREATED"
  | "RECEIPT_GENERATED";

export type AuditEntity =
  | "User"
  | "Booking"
  | "Payment"
  | "Refund"
  | "Payout"
  | "Dispute";

interface LogOptions {
  entityId?: string;
  userId?: string | null;
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
      // Audit logging disabled in simplified schema
      // TODO: Re-implement with external logging service if needed
      console.log(`Audit: ${action} on ${entity}`, {
        entityId: opts.entityId,
        userId: opts.userId,
        details: opts.details,
      });
    } catch (err) {
      // Silent fail to avoid impacting request lifecycle
      console.error("Audit log failure", action, entity, err);
    }
  },
};

// Convenience helper wrappers (optional export for future granular imports)
export const logUserRegister = (userId: string, email: string, req?: Request) =>
  auditLogger.log("USER_REGISTER", "User", {
    entityId: userId,
    userId,
    details: { email },
    req,
  });
