import { DisputeStatus, AdminDisputeDecision } from "@prisma/client";
import { logger } from "@/utils/logger";
import { prisma } from "@/config/database";
import { adminResolveDispute } from "@/services/disputeService";

/**
 * Auto-resolve escalated disputes that have passed the 48-hour admin SLA.
 * When admin fails to act within the deadline, the dispute is auto-resolved
 * with a PARTIAL_REFUND (50/50 split) as a neutral fallback.
 */
export const runDisputeSlaJob = async (): Promise<void> => {
  const now = new Date();

  const overdueDisputes = await prisma.dispute.findMany({
    where: {
      status: DisputeStatus.ESCALATED,
      adminDeadlineAt: { lt: now },
    },
    select: { id: true, bookingId: true, adminDeadlineAt: true },
  });

  if (overdueDisputes.length === 0) {
    logger.info("[DisputeSLA] No overdue escalated disputes found.");
    return;
  }

  logger.warn(
    `[DisputeSLA] Found ${overdueDisputes.length} overdue dispute(s) — auto-resolving with PARTIAL_REFUND.`,
  );

  for (const dispute of overdueDisputes) {
    try {
      logger.warn(
        `[DisputeSLA] Auto-resolving dispute ${dispute.id} (bookingId=${dispute.bookingId}, deadline=${dispute.adminDeadlineAt?.toISOString()}).`,
      );

      await adminResolveDispute(
        dispute.id,
        "system",
        AdminDisputeDecision.PARTIAL_REFUND,
        "Auto-resolved by system: admin SLA of 48 hours exceeded. 50/50 split applied.",
        // adminClaimedAmount is undefined → defaults to 50% each side
      );

      logger.info(`[DisputeSLA] Dispute ${dispute.id} auto-resolved.`);
    } catch (err: any) {
      logger.error(
        `[DisputeSLA] Failed to auto-resolve dispute ${dispute.id}:`,
        err?.message ?? err,
      );
    }
  }
};
