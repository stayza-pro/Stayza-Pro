import { prisma } from "@/config/database";
import {
  DisputeSubject,
  DisputeCategory,
  DisputeStatus,
  DisputeResponseAction,
  AdminDisputeDecision,
  DisputeFinalOutcome,
  BookingStatus,
  PaymentStatus,
  EscrowStatus,
  Prisma,
  WalletOwnerType,
  WalletTransactionSource,
} from "@prisma/client";
import { logger } from "@/utils/logger";
import * as walletService from "./walletService";
import * as escrowService from "./escrowService";
import { processRefund } from "./paystack";

/**
 * DISPUTE V2 SYSTEM - SYSTEM-LEVEL, NON-VAGUE
 *
 * Key Rules:
 * 1. Dispute type determines MAX refund (100% or 30%)
 * 2. System auto-calculates ALL amounts (no custom inputs)
 * 3. Realtor/Guest response is BINARY (accept or reject+escalate)
 * 4. No negotiation, no counter-offers
 * 5. Admin decision is FINAL and LIMITED by dispute cap
 * 6. Deposit disputes capped at deposit amount
 * 7. No second disputes on same money
 */

/**
 * Get max refund percentage based on dispute category
 */
const getMaxRefundPercent = (category: DisputeCategory): number => {
  switch (category) {
    case DisputeCategory.SAFETY_UNINHABITABLE:
    case DisputeCategory.MAJOR_MISREPRESENTATION:
      return 100;
    case DisputeCategory.MISSING_AMENITIES_CLEANLINESS:
    case DisputeCategory.MINOR_INCONVENIENCE:
      return 30;
    // Deposit disputes don't use percentage
    case DisputeCategory.PROPERTY_DAMAGE:
    case DisputeCategory.MISSING_ITEMS:
    case DisputeCategory.CLEANING_REQUIRED:
    case DisputeCategory.OTHER_DEPOSIT_CLAIM:
      return 0; // Not applicable for deposit disputes
    default:
      throw new Error(`Unknown dispute category: ${category}`);
  }
};

const clampRate = (value: number): number => Math.min(Math.max(value, 0), 1);

const toNumericOrNull = (
  value: Prisma.Decimal | number | null | undefined
): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const numeric =
    value instanceof Prisma.Decimal ? value.toNumber() : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const deriveRateFromAmounts = (
  platformAmount: Prisma.Decimal | number | null | undefined,
  roomFeeAmount: Prisma.Decimal | number | null | undefined
): number | null => {
  const platform = toNumericOrNull(platformAmount);
  const roomFee = toNumericOrNull(roomFeeAmount);
  if (platform === null || roomFee === null || roomFee <= 0) {
    return null;
  }

  return clampRate(platform / roomFee);
};

const getEffectiveCommissionRate = (params: {
  payment?: {
    commissionEffectiveRate?: Prisma.Decimal | null;
    roomFeeAmount?: Prisma.Decimal | null;
    roomFeeSplitPlatformAmount?: Prisma.Decimal | null;
    platformFeeAmount?: Prisma.Decimal | null;
  } | null;
  booking?: {
    commissionEffectiveRate?: Prisma.Decimal | null;
    roomFee?: Prisma.Decimal | null;
    platformFee?: Prisma.Decimal | null;
  } | null;
}): number => {
  const directRate =
    toNumericOrNull(params.payment?.commissionEffectiveRate) ??
    toNumericOrNull(params.booking?.commissionEffectiveRate);
  if (directRate !== null) {
    return clampRate(directRate);
  }

  const paymentDerived =
    deriveRateFromAmounts(
      params.payment?.roomFeeSplitPlatformAmount,
      params.payment?.roomFeeAmount
    ) ??
    deriveRateFromAmounts(
      params.payment?.platformFeeAmount,
      params.payment?.roomFeeAmount
    );
  if (paymentDerived !== null) {
    return paymentDerived;
  }

  const bookingDerived = deriveRateFromAmounts(
    params.booking?.platformFee,
    params.booking?.roomFee
  );
  if (bookingDerived !== null) {
    return bookingDerived;
  }

  throw new Error(
    "Missing commission snapshot for dispute resolution. Backfill booking/payment commissionEffectiveRate."
  );
};

/**
 * Calculate dispute amounts for ROOM_FEE dispute
 */
const calculateRoomFeeDisputeAmounts = (
  roomFeeAmount: number,
  maxRefundPercent: number,
  effectiveCommissionRate: number
): {
  guestRefundAmount: number;
  realtorPayoutAmount: number;
  platformFeeAmount: number;
} => {
  const payoutRate = 1 - clampRate(effectiveCommissionRate);

  if (maxRefundPercent === 100) {
    // FULL REFUND: Guest gets 100%, realtor/platform get 0%
    return {
      guestRefundAmount: roomFeeAmount,
      realtorPayoutAmount: 0,
      platformFeeAmount: 0,
    };
  } else if (maxRefundPercent === 30) {
    // PARTIAL REFUND: Guest gets 30%, remainder split using effective commission snapshot
    const guestRefundAmount = roomFeeAmount * 0.3;
    const remainingAmount = roomFeeAmount * 0.7;
    const realtorPayoutAmount = remainingAmount * payoutRate;
    const platformFeeAmount = remainingAmount * (1 - payoutRate);

    return {
      guestRefundAmount,
      realtorPayoutAmount,
      platformFeeAmount,
    };
  } else {
    // NO REFUND: Normal split using effective commission snapshot
    return {
      guestRefundAmount: 0,
      realtorPayoutAmount: roomFeeAmount * payoutRate,
      platformFeeAmount: roomFeeAmount * (1 - payoutRate),
    };
  }
};

/**
 * Calculate deposit dispute amounts
 */
const calculateDepositDisputeAmounts = (
  depositAmount: number,
  claimedAmount: number
): {
  guestRefundAmount: number;
  realtorPayoutAmount: number;
} => {
  // Ensure claimed amount doesn't exceed deposit
  const cappedClaim = Math.min(claimedAmount, depositAmount);

  return {
    guestRefundAmount: depositAmount - cappedClaim,
    realtorPayoutAmount: cappedClaim,
  };
};

const mapIssueTypeToCategory = (issueType: string): DisputeCategory => {
  const normalized = issueType.trim().toUpperCase();

  if (
    Object.values(DisputeCategory).includes(normalized as DisputeCategory)
  ) {
    return normalized as DisputeCategory;
  }

  switch (normalized) {
    case "SAFETY_CONCERNS":
      return DisputeCategory.SAFETY_UNINHABITABLE;
    case "PROPERTY_CONDITION":
      return DisputeCategory.MAJOR_MISREPRESENTATION;
    case "CLEANLINESS":
    case "AMENITIES_MISSING":
      return DisputeCategory.MISSING_AMENITIES_CLEANLINESS;
    case "BOOKING_ISSUES":
    case "PAYMENT_DISPUTE":
    case "OTHER":
    default:
      return DisputeCategory.MINOR_INCONVENIENCE;
  }
};

const SECURITY_DEPOSIT_CATEGORIES = new Set<DisputeCategory>([
  DisputeCategory.PROPERTY_DAMAGE,
  DisputeCategory.MISSING_ITEMS,
  DisputeCategory.CLEANING_REQUIRED,
  DisputeCategory.OTHER_DEPOSIT_CLAIM,
]);

const mapCategoryToSubject = (category: DisputeCategory): DisputeSubject => {
  if (SECURITY_DEPOSIT_CATEGORIES.has(category)) {
    return DisputeSubject.SECURITY_DEPOSIT;
  }
  return DisputeSubject.ROOM_FEE;
};

/**
 * Open a ROOM_FEE dispute (Guest opens within 1hr of check-in)
 */
export const openRoomFeeDispute = async (
  bookingId: string,
  guestId: string,
  category: DisputeCategory,
  writeup: string,
  attachments?: string[]
) => {
  // Validate booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
      property: {
        include: { realtor: true },
      },
      escrow: true,
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.guestId !== guestId) {
    throw new Error("Only the guest can open room fee disputes");
  }

  if (booking.status !== BookingStatus.ACTIVE) {
    throw new Error("Can only dispute during ACTIVE booking");
  }

  const { canGuestOpenDispute } = await import("./checkinService");
  const disputeWindow = await canGuestOpenDispute(bookingId);
  if (!disputeWindow.canOpen) {
    throw new Error(disputeWindow.reason || "Guest dispute window is closed");
  }

  // Check if already disputed
  const existingDispute = await prisma.dispute.findFirst({
    where: {
      bookingId,
      disputeSubject: DisputeSubject.ROOM_FEE,
      status: {
        in: [
          DisputeStatus.OPEN,
          DisputeStatus.AWAITING_RESPONSE,
          DisputeStatus.ESCALATED,
        ],
      },
    },
  });

  if (existingDispute) {
    throw new Error("Room fee dispute already exists for this booking");
  }

  // Validate category is for room fee
  const validRoomFeeCategories: DisputeCategory[] = [
    DisputeCategory.SAFETY_UNINHABITABLE,
    DisputeCategory.MAJOR_MISREPRESENTATION,
    DisputeCategory.MISSING_AMENITIES_CLEANLINESS,
    DisputeCategory.MINOR_INCONVENIENCE,
  ];
  if (!validRoomFeeCategories.includes(category)) {
    throw new Error("Invalid category for room fee dispute");
  }

  const maxRefundPercent = getMaxRefundPercent(category);
  if (!booking.payment) {
    throw new Error("Payment not found for booking");
  }

  const roomFeeAmount = booking.payment.roomFeeAmount.toNumber();
  const effectiveCommissionRate = getEffectiveCommissionRate({
    payment: booking.payment,
    booking,
  });

  if (roomFeeAmount === 0) {
    throw new Error("No room fee to dispute");
  }

  const amounts = calculateRoomFeeDisputeAmounts(
    roomFeeAmount,
    maxRefundPercent,
    effectiveCommissionRate
  );

  // Create dispute
  const dispute = await prisma.$transaction(async (tx) => {
    const dispute = await tx.dispute.create({
      data: {
        bookingId,
        disputeSubject: DisputeSubject.ROOM_FEE,
        category,
        status: DisputeStatus.AWAITING_RESPONSE,
        openedBy: guestId,
        maxRefundPercent,
        claimedAmount: new Prisma.Decimal(roomFeeAmount),
        guestRefundAmount: new Prisma.Decimal(amounts.guestRefundAmount),
        realtorPayoutAmount: new Prisma.Decimal(amounts.realtorPayoutAmount),
        platformFeeAmount: new Prisma.Decimal(amounts.platformFeeAmount),
        writeup,
        attachments: attachments
          ? JSON.parse(JSON.stringify(attachments))
          : null,
      },
    });

    // Update booking status
    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.DISPUTED,
        userDisputeOpened: true,
      },
    });

    // Freeze escrow (prevent auto-release)
    if (booking.escrow) {
      await tx.escrow.update({
        where: { bookingId },
        data: {
          status: EscrowStatus.HOLDING, // Explicitly freeze
        },
      });
    }

    return dispute;
  });

  logger.info("Room fee dispute opened", {
    disputeId: dispute.id,
    bookingId,
    category,
    maxRefundPercent,
    guestRefund: amounts.guestRefundAmount,
  });

  return dispute;
};

/**
 * Open SECURITY_DEPOSIT dispute (Realtor opens within 2hr of checkout)
 */
export const openDepositDispute = async (
  bookingId: string,
  realtorId: string,
  category: DisputeCategory,
  claimedAmount: number,
  writeup: string,
  attachments?: string[]
) => {
  // Validate booking
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
      property: true,
      escrow: true,
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.property.realtorId !== realtorId) {
    throw new Error("Only the property owner can open deposit disputes");
  }

  const { canRealtorOpenDispute } = await import("./checkinService");
  const disputeWindow = await canRealtorOpenDispute(bookingId);
  if (!disputeWindow.canOpen) {
    throw new Error(disputeWindow.reason || "Realtor dispute window is closed");
  }

  // Check if already disputed
  const existingDispute = await prisma.dispute.findFirst({
    where: {
      bookingId,
      disputeSubject: DisputeSubject.SECURITY_DEPOSIT,
      status: {
        in: [
          DisputeStatus.OPEN,
          DisputeStatus.AWAITING_RESPONSE,
          DisputeStatus.ESCALATED,
        ],
      },
    },
  });

  if (existingDispute) {
    throw new Error("Deposit dispute already exists for this booking");
  }

  // Validate category is for deposit
  const validDepositCategories: DisputeCategory[] = [
    DisputeCategory.PROPERTY_DAMAGE,
    DisputeCategory.MISSING_ITEMS,
    DisputeCategory.CLEANING_REQUIRED,
    DisputeCategory.OTHER_DEPOSIT_CLAIM,
  ];
  if (!validDepositCategories.includes(category)) {
    throw new Error("Invalid category for deposit dispute");
  }

  if (!booking.payment) {
    throw new Error("Payment not found for booking");
  }

  const depositAmount = booking.payment.securityDepositAmount.toNumber();

  if (depositAmount === 0) {
    throw new Error("No security deposit to dispute");
  }

  // Cap claimed amount at deposit
  const cappedClaimedAmount = Math.min(claimedAmount, depositAmount);

  const amounts = calculateDepositDisputeAmounts(
    depositAmount,
    cappedClaimedAmount
  );

  // Get realtor user ID
  const realtor = await prisma.realtor.findUnique({
    where: { id: realtorId },
    select: { userId: true },
  });

  if (!realtor) {
    throw new Error("Realtor not found");
  }

  // Create dispute
  const dispute = await prisma.$transaction(async (tx) => {
    const dispute = await tx.dispute.create({
      data: {
        bookingId,
        disputeSubject: DisputeSubject.SECURITY_DEPOSIT,
        category,
        status: DisputeStatus.AWAITING_RESPONSE,
        openedBy: realtor.userId,
        maxRefundPercent: 0, // Not applicable for deposit disputes
        claimedAmount: new Prisma.Decimal(cappedClaimedAmount),
        guestRefundAmount: new Prisma.Decimal(amounts.guestRefundAmount),
        realtorPayoutAmount: new Prisma.Decimal(amounts.realtorPayoutAmount),
        platformFeeAmount: new Prisma.Decimal(0), // No platform fee on deposit
        writeup,
        attachments: attachments
          ? JSON.parse(JSON.stringify(attachments))
          : null,
      },
    });

    // Freeze deposit in escrow
    if (booking.escrow) {
      await tx.escrow.update({
        where: { bookingId },
        data: {
          status: EscrowStatus.HOLDING,
        },
      });
    }

    await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.DISPUTED,
        realtorDisputeOpened: true,
      },
    });

    return dispute;
  });

  logger.info("Deposit dispute opened", {
    disputeId: dispute.id,
    bookingId,
    category,
    claimedAmount: cappedClaimedAmount,
    guestRefund: amounts.guestRefundAmount,
    realtorPayout: amounts.realtorPayoutAmount,
  });

  return dispute;
};

/**
 * Counterparty responds to dispute (ACCEPT or REJECT_ESCALATE)
 */
export const respondToDispute = async (
  disputeId: string,
  responderId: string,
  responseAction: DisputeResponseAction,
  responseNotes?: string
) => {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      booking: {
        include: {
          payment: true,
          property: {
            include: { realtor: true },
          },
          guest: true,
          escrow: true,
        },
      },
    },
  });

  if (!dispute) {
    throw new Error("Dispute not found");
  }

  if (dispute.status !== DisputeStatus.AWAITING_RESPONSE) {
    throw new Error("Dispute is not awaiting response");
  }

  // Validate responder is the counterparty
  const isRoomFeeDispute = dispute.disputeSubject === DisputeSubject.ROOM_FEE;
  const expectedResponderId = isRoomFeeDispute
    ? dispute.booking.property.realtor.userId // Realtor responds to guest's room fee dispute
    : dispute.booking.guestId; // Guest responds to realtor's deposit dispute

  if (responderId !== expectedResponderId) {
    throw new Error("Only the counterparty can respond to this dispute");
  }

  if (responseAction === DisputeResponseAction.ACCEPT) {
    // Execute the dispute resolution
    return await executeDisputeResolution(disputeId, null, responseNotes);
  } else {
    // Escalate to admin
    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.ESCALATED,
        respondedBy: responderId,
        respondedAt: new Date(),
        responseAction,
        responseNotes,
        escalatedToAdmin: true,
      },
    });

    logger.info("Dispute escalated to admin", {
      disputeId,
      bookingId: dispute.bookingId,
      responderId,
    });

    return updatedDispute;
  }
};

/**
 * Admin resolves escalated dispute
 */
export const adminResolveDispute = async (
  disputeId: string,
  adminId: string,
  decision: AdminDisputeDecision,
  adminNotes: string
) => {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      booking: {
        include: {
          payment: true,
          property: { include: { realtor: true } },
          escrow: true,
        },
      },
    },
  });

  if (!dispute) {
    throw new Error("Dispute not found");
  }

  if (dispute.status !== DisputeStatus.ESCALATED) {
    throw new Error("Dispute is not escalated to admin");
  }

  // Validate decision doesn't exceed max refund cap
  if (dispute.disputeSubject === DisputeSubject.ROOM_FEE) {
    if (
      dispute.maxRefundPercent === 30 &&
      decision === AdminDisputeDecision.FULL_REFUND
    ) {
      throw new Error(
        "Cannot grant full refund - max refund is 30% for this category"
      );
    }
  }

  // Execute resolution with admin override
  return await executeDisputeResolution(
    disputeId,
    decision,
    adminNotes,
    adminId
  );
};

/**
 * Execute dispute resolution (called by accept or admin decision)
 */
const executeDisputeResolution = async (
  disputeId: string,
  adminDecision: AdminDisputeDecision | null,
  notes: string | undefined,
  adminId?: string
) => {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      booking: {
        include: {
          payment: true,
          property: { include: { realtor: true } },
          guest: true,
          escrow: true,
        },
      },
    },
  });

  if (!dispute) {
    throw new Error("Dispute not found");
  }

  const isRoomFeeDispute = dispute.disputeSubject === DisputeSubject.ROOM_FEE;
  const booking = dispute.booking;
  const payment = booking.payment;

  if (!payment) {
    throw new Error("Payment not found for booking");
  }

  // Determine final amounts based on admin decision or original claim
  let finalOutcome: DisputeFinalOutcome;
  let guestRefundAmount: number = 0;
  let realtorPayoutAmount: number = 0;
  let platformFeeAmount: number = 0;

  if (isRoomFeeDispute) {
    const effectiveCommissionRate = getEffectiveCommissionRate({
      payment,
      booking,
    });

    // Room fee dispute resolution
    if (adminDecision === AdminDisputeDecision.FULL_REFUND) {
      // Admin override: 100% refund
      const roomFee = payment.roomFeeAmount.toNumber();
      const amounts = calculateRoomFeeDisputeAmounts(
        roomFee,
        100,
        effectiveCommissionRate
      );
      guestRefundAmount = amounts.guestRefundAmount;
      realtorPayoutAmount = amounts.realtorPayoutAmount;
      platformFeeAmount = amounts.platformFeeAmount;
      finalOutcome = DisputeFinalOutcome.FULL_REFUND_EXECUTED;
    } else if (adminDecision === AdminDisputeDecision.PARTIAL_REFUND) {
      // Admin override: 30% refund
      const roomFee = payment.roomFeeAmount.toNumber();
      const amounts = calculateRoomFeeDisputeAmounts(
        roomFee,
        30,
        effectiveCommissionRate
      );
      guestRefundAmount = amounts.guestRefundAmount;
      realtorPayoutAmount = amounts.realtorPayoutAmount;
      platformFeeAmount = amounts.platformFeeAmount;
      finalOutcome = DisputeFinalOutcome.PARTIAL_REFUND_EXECUTED;
    } else if (adminDecision === AdminDisputeDecision.NO_REFUND) {
      // Admin override: No refund
      const roomFee = payment.roomFeeAmount.toNumber();
      const amounts = calculateRoomFeeDisputeAmounts(
        roomFee,
        0,
        effectiveCommissionRate
      );
      guestRefundAmount = amounts.guestRefundAmount;
      realtorPayoutAmount = amounts.realtorPayoutAmount;
      platformFeeAmount = amounts.platformFeeAmount;
      finalOutcome = DisputeFinalOutcome.NO_REFUND_EXECUTED;
    } else {
      // Use original dispute amounts (accepted by counterparty)
      guestRefundAmount = dispute.guestRefundAmount.toNumber();
      realtorPayoutAmount = dispute.realtorPayoutAmount.toNumber();
      platformFeeAmount = dispute.platformFeeAmount.toNumber();

      if (dispute.maxRefundPercent === 100) {
        finalOutcome = DisputeFinalOutcome.FULL_REFUND_EXECUTED;
      } else if (dispute.maxRefundPercent === 30) {
        finalOutcome = DisputeFinalOutcome.PARTIAL_REFUND_EXECUTED;
      } else {
        finalOutcome = DisputeFinalOutcome.NO_REFUND_EXECUTED;
      }
    }
  } else {
    // Deposit dispute resolution
    if (adminDecision === AdminDisputeDecision.FULL_REFUND) {
      // Admin: Full deposit to guest
      guestRefundAmount = payment.securityDepositAmount.toNumber();
      realtorPayoutAmount = 0;
      finalOutcome = DisputeFinalOutcome.DEPOSIT_RETURNED;
    } else if (adminDecision === AdminDisputeDecision.PARTIAL_REFUND) {
      // Admin: Partial (use 50% as default partial)
      const deposit = payment.securityDepositAmount.toNumber();
      realtorPayoutAmount = deposit * 0.5;
      guestRefundAmount = deposit * 0.5;
      finalOutcome = DisputeFinalOutcome.DEPOSIT_PARTIAL;
    } else if (adminDecision === AdminDisputeDecision.NO_REFUND) {
      // Admin: Full deposit to realtor
      guestRefundAmount = 0;
      realtorPayoutAmount = payment.securityDepositAmount.toNumber();
      finalOutcome = DisputeFinalOutcome.DEPOSIT_FORFEITED;
    } else {
      // Use original dispute amounts
      guestRefundAmount = dispute.guestRefundAmount.toNumber();
      realtorPayoutAmount = dispute.realtorPayoutAmount.toNumber();

      if (guestRefundAmount === 0) {
        finalOutcome = DisputeFinalOutcome.DEPOSIT_FORFEITED;
      } else if (realtorPayoutAmount === 0) {
        finalOutcome = DisputeFinalOutcome.DEPOSIT_RETURNED;
      } else {
        finalOutcome = DisputeFinalOutcome.DEPOSIT_PARTIAL;
      }
    }
    platformFeeAmount = 0; // No platform fee on deposit
  }

  // Execute money movements atomically
  return await prisma.$transaction(async (tx) => {
    if (isRoomFeeDispute) {
      // ROOM FEE DISPUTE EXECUTION
      if (finalOutcome === DisputeFinalOutcome.FULL_REFUND_EXECUTED) {
        // 100% refund: room fee + deposit to guest, booking cancelled
        const roomFee = payment.roomFeeAmount.toNumber();
        const deposit = payment.securityDepositAmount.toNumber();
        const totalRefund = roomFee + deposit;

        // Refund via Paystack
        const transactionId =
          payment.providerTransactionId || payment.reference;
        if (!transactionId) {
          throw new Error("Payment reference not found");
        }
        await processRefund(transactionId, totalRefund);

        // Update escrow
        await tx.escrow.update({
          where: { bookingId: booking.id },
          data: {
            roomFeeHeld: new Prisma.Decimal(0),
            depositHeld: new Prisma.Decimal(0),
            status: EscrowStatus.REFUNDED,
          },
        });

        // Cancel booking
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: BookingStatus.CANCELLED },
        });

        // Update payment
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.REFUNDED,
            roomFeeInEscrow: false,
            depositInEscrow: false,
          },
        });
      } else if (finalOutcome === DisputeFinalOutcome.PARTIAL_REFUND_EXECUTED) {
        // 30% refund: guest gets 30%, 70% split to wallets, booking continues
        // Refund 30% to guest
        const transactionId =
          payment.providerTransactionId || payment.reference;
        if (!transactionId) {
          throw new Error("Payment reference not found");
        }
        await processRefund(transactionId, guestRefundAmount);

        // Credit realtor wallet (60% of room fee)
        const realtorWallet = await walletService.getOrCreateWallet(
          WalletOwnerType.REALTOR,
          booking.property.realtorId
        );
        await walletService.creditWallet(
          realtorWallet.id,
          realtorPayoutAmount,
          WalletTransactionSource.ROOM_FEE,
          booking.id,
          { disputeId, partialRefund: true }
        );

        // Credit platform wallet (10% of room fee)
        const platformWallet = await walletService.getOrCreateWallet(
          WalletOwnerType.PLATFORM,
          "platform"
        );
        await walletService.creditWallet(
          platformWallet.id,
          platformFeeAmount,
          WalletTransactionSource.ROOM_FEE,
          booking.id,
          { disputeId, partialRefund: true }
        );

        // Update escrow - room fee released, deposit still held
        await tx.escrow.update({
          where: { bookingId: booking.id },
          data: {
            roomFeeHeld: new Prisma.Decimal(0),
            status: EscrowStatus.PARTIAL_RELEASED,
          },
        });

        // Update payment
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PARTIALLY_RELEASED, // Room fee split completed (partial refund case)
            roomFeeInEscrow: false,
            roomFeeSplitDone: true,
          },
        });

        // Booking continues (still ACTIVE)
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: BookingStatus.ACTIVE },
        });
      } else if (finalOutcome === DisputeFinalOutcome.NO_REFUND_EXECUTED) {
        // No refund: release based on effective commission snapshot
        // Credit realtor wallet
        const realtorWallet = await walletService.getOrCreateWallet(
          WalletOwnerType.REALTOR,
          booking.property.realtorId
        );
        await walletService.creditWallet(
          realtorWallet.id,
          realtorPayoutAmount,
          WalletTransactionSource.ROOM_FEE,
          booking.id,
          { disputeId, noRefund: true }
        );

        // Credit platform wallet
        const platformWallet = await walletService.getOrCreateWallet(
          WalletOwnerType.PLATFORM,
          "platform"
        );
        await walletService.creditWallet(
          platformWallet.id,
          platformFeeAmount,
          WalletTransactionSource.ROOM_FEE,
          booking.id,
          { disputeId, noRefund: true }
        );

        // Update escrow
        await tx.escrow.update({
          where: { bookingId: booking.id },
          data: {
            roomFeeHeld: new Prisma.Decimal(0),
            status: EscrowStatus.RELEASED,
          },
        });

        // Update payment
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.PARTIALLY_RELEASED, // Room fee split completed (no refund case)
            roomFeeInEscrow: false,
            roomFeeSplitDone: true,
          },
        });

        // Booking continues
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: BookingStatus.ACTIVE },
        });
      }
    } else {
      // DEPOSIT DISPUTE EXECUTION
      if (realtorPayoutAmount > 0) {
        // Credit realtor wallet with claimed deposit amount
        const realtorWallet = await walletService.getOrCreateWallet(
          WalletOwnerType.REALTOR,
          booking.property.realtorId
        );
        await walletService.creditWallet(
          realtorWallet.id,
          realtorPayoutAmount,
          WalletTransactionSource.ROOM_FEE, // Use ROOM_FEE source for deposit forfeit
          booking.id,
          { disputeId, depositClaim: true }
        );
      }

      if (guestRefundAmount > 0) {
        // Refund remainder to guest via Paystack
        const transactionId =
          payment.providerTransactionId || payment.reference;
        if (!transactionId) {
          throw new Error("Payment reference not found");
        }
        await processRefund(transactionId, guestRefundAmount);
      }

      // Update escrow
      await tx.escrow.update({
        where: { bookingId: booking.id },
        data: {
          depositHeld: new Prisma.Decimal(0),
          status: EscrowStatus.REFUNDED,
        },
      });

      // Update payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          depositInEscrow: false,
          depositRefunded: guestRefundAmount > 0,
        },
      });

      // Complete booking
      await tx.booking.update({
        where: { id: booking.id },
        data: { status: BookingStatus.COMPLETED },
      });
    }

    // Update dispute record
    const updatedDispute = await tx.dispute.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.RESOLVED,
        closedAt: new Date(),
        finalOutcome,
        executedAt: new Date(),
        executionReference: `dispute_${disputeId}_${Date.now()}`,
        ...(adminId && {
          adminId,
          adminDecision,
          adminNotes: notes,
          adminResolvedAt: new Date(),
        }),
        ...(!adminId && {
          respondedBy:
            dispute.disputeSubject === DisputeSubject.ROOM_FEE
              ? booking.property.realtor.userId
              : booking.guestId,
          respondedAt: new Date(),
          responseAction: DisputeResponseAction.ACCEPT,
          responseNotes: notes,
        }),
      },
    });

    logger.info("Dispute resolved and executed", {
      disputeId,
      bookingId: booking.id,
      finalOutcome,
      guestRefund: guestRefundAmount,
      realtorPayout: realtorPayoutAmount,
      platformFee: platformFeeAmount,
    });

    return updatedDispute;
  });
};

/**
 * Auto-release security deposit if no dispute within 2 hours of checkout
 */
export const autoReleaseDepositIfNoDispute = async (bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
      escrow: true,
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  // Check if there's an active deposit dispute
  const activeDispute = await prisma.dispute.findFirst({
    where: {
      bookingId,
      disputeSubject: DisputeSubject.SECURITY_DEPOSIT,
      status: {
        in: [DisputeStatus.AWAITING_RESPONSE, DisputeStatus.ESCALATED],
      },
    },
  });

  if (activeDispute) {
    logger.info("Deposit has active dispute, skipping auto-release", {
      bookingId,
    });
    return null;
  }

  // Auto-release deposit to guest
  if (booking.payment && booking.payment.depositInEscrow) {
    await escrowService.returnSecurityDeposit(
      bookingId,
      booking.payment.id,
      booking.guestId
    );

    logger.info("Security deposit auto-released to guest (no dispute)", {
      bookingId,
    });
    return true;
  }

  return false;
};

/**
 * Get dispute by ID with full details
 */
export const getDisputeById = async (disputeId: string) => {
  return await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      booking: {
        include: {
          payment: true,
          property: {
            include: { realtor: { include: { user: true } } },
          },
          guest: true,
        },
      },
      opener: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      responder: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      admin: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });
};

/**
 * Get all disputes for a booking
 */
export const getDisputesByBooking = async (bookingId: string) => {
  return await prisma.dispute.findMany({
    where: { bookingId },
    include: {
      opener: { select: { id: true, firstName: true, lastName: true } },
      responder: { select: { id: true, firstName: true, lastName: true } },
      admin: { select: { id: true, firstName: true, lastName: true } },
    },
    orderBy: { openedAt: "desc" },
  });
};

/**
 * Get all open/escalated disputes (admin view)
 */
export const getAllOpenDisputes = async () => {
  return await prisma.dispute.findMany({
    where: {
      status: {
        in: [DisputeStatus.AWAITING_RESPONSE, DisputeStatus.ESCALATED],
      },
    },
    include: {
      booking: {
        include: {
          property: { include: { realtor: { include: { user: true } } } },
          guest: true,
        },
      },
      opener: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
    orderBy: { openedAt: "desc" },
  });
};

/**
 * NEW DISPUTE SYSTEM - Conversation-based disputes
 */

/**
 * Create a new conversation-style dispute
 */
export const createNewDispute = async (
  bookingId: string,
  guestId: string,
  issueType: string,
  subject: string,
  description: string
) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      property: { include: { realtor: true } },
      guest: true,
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.guestId !== guestId) {
    throw new Error("You can only create disputes for your own bookings");
  }

  // Check if dispute already exists
  const existingDispute = await prisma.dispute.findFirst({
    where: {
      bookingId,
      status: { notIn: [DisputeStatus.RESOLVED] },
    },
  });

  if (existingDispute) {
    throw new Error("A dispute already exists for this booking");
  }

  const category = mapIssueTypeToCategory(issueType);

  const disputeSubject = mapCategoryToSubject(category);

  if (
    disputeSubject === DisputeSubject.SECURITY_DEPOSIT &&
    Number(booking.securityDeposit || 0) <= 0
  ) {
    throw new Error(
      "Security deposit disputes are unavailable for bookings without a deposit"
    );
  }

  // Store the conversation bootstrap in attachments as JSON
  const dispute = await prisma.dispute.create({
    data: {
      bookingId,
      disputeSubject,
      category,
      openedBy: guestId,
      writeup: `${subject}\n\n${description}`,
      maxRefundPercent: 0,
      claimedAmount: 0,
      guestRefundAmount: 0,
      realtorPayoutAmount: 0,
      platformFeeAmount: 0,
      attachments: {
        issueType,
        subject,
        description,
        messages: [
          {
            senderType: "GUEST",
            message: description,
            createdAt: new Date().toISOString(),
          },
        ],
        guestArgumentCount: 0,
        realtorArgumentCount: 0,
      },
      status: DisputeStatus.OPEN,
    },
    include: {
      booking: {
        include: {
          property: { include: { realtor: { include: { user: true } } } },
          guest: true,
        },
      },
      opener: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  // Transform to match frontend expectations
  const attachments = dispute.attachments as any;
  return {
    id: dispute.id,
    bookingId: dispute.bookingId,
    issueType: attachments.issueType,
    subject: attachments.subject,
    description: attachments.description,
    status: dispute.status,
    guestId: dispute.openedBy,
    realtorId: booking.property.realtorId,
    guestArgumentCount: attachments.guestArgumentCount || 0,
    realtorArgumentCount: attachments.realtorArgumentCount || 0,
    messages: attachments.messages || [],
    createdAt: dispute.createdAt,
    updatedAt: dispute.updatedAt,
    guest: dispute.opener,
    booking: {
      id: booking.id,
      property: {
        title: booking.property.title,
      },
    },
  };
};

/**
 * Get dispute by booking ID
 */
export const getDisputeByBookingId = async (bookingId: string) => {
  const dispute = await prisma.dispute.findFirst({
    where: { bookingId },
    include: {
      booking: {
        include: {
          property: { include: { realtor: { include: { user: true } } } },
          guest: true,
        },
      },
      opener: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!dispute) {
    return null;
  }

  const attachments = dispute.attachments as any;
  return {
    id: dispute.id,
    bookingId: dispute.bookingId,
    issueType: attachments.issueType,
    subject: attachments.subject,
    description: attachments.description,
    status: dispute.status,
    guestId: dispute.openedBy,
    realtorId: dispute.booking.property.realtorId,
    guestArgumentCount: attachments.guestArgumentCount || 0,
    realtorArgumentCount: attachments.realtorArgumentCount || 0,
    messages: attachments.messages || [],
    createdAt: dispute.createdAt,
    updatedAt: dispute.updatedAt,
    guest: dispute.opener,
    booking: {
      id: dispute.booking.id,
      property: {
        title: dispute.booking.property.title,
      },
    },
  };
};

/**
 * Respond to a dispute (both guest and realtor)
 */
export const respondToNewDispute = async (
  disputeId: string,
  userId: string,
  userRole: string,
  message: string
) => {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      booking: {
        include: {
          property: { include: { realtor: true } },
        },
      },
    },
  });

  if (!dispute) {
    throw new Error("Dispute not found");
  }

  const attachments = dispute.attachments as any;
  const isGuest = userId === dispute.booking.guestId;
  const isRealtor = userId === dispute.booking.property.realtorId;

  if (!isGuest && !isRealtor) {
    throw new Error("You are not authorized to respond to this dispute");
  }

  // Check argument limits
  const currentCount = isGuest
    ? attachments.guestArgumentCount || 0
    : attachments.realtorArgumentCount || 0;

  if (currentCount >= 2) {
    throw new Error("Maximum number of responses (2) reached");
  }

  // Add message to conversation
  const newMessage = {
    senderType: isGuest ? "GUEST" : "REALTOR",
    message,
    createdAt: new Date().toISOString(),
  };

  const updatedMessages = [...(attachments.messages || []), newMessage];

  // Increment argument count
  const updatedAttachments = {
    ...attachments,
    messages: updatedMessages,
    guestArgumentCount: isGuest
      ? currentCount + 1
      : attachments.guestArgumentCount || 0,
    realtorArgumentCount: isRealtor
      ? currentCount + 1
      : attachments.realtorArgumentCount || 0,
  };

  // Determine new status
  let newStatus = dispute.status;
  if (isGuest) {
    newStatus = DisputeStatus.AWAITING_RESPONSE; // Waiting for realtor
  } else if (isRealtor) {
    newStatus = DisputeStatus.OPEN; // Back to guest
  }

  // Update dispute
  const updatedDispute = await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      attachments: updatedAttachments,
      status: newStatus,
      respondedBy: userId,
      respondedAt: new Date(),
    },
    include: {
      booking: {
        include: {
          property: { include: { realtor: { include: { user: true } } } },
          guest: true,
        },
      },
      opener: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  const updatedData = updatedDispute.attachments as any;
  return {
    id: updatedDispute.id,
    bookingId: updatedDispute.bookingId,
    issueType: updatedData.issueType,
    subject: updatedData.subject,
    description: updatedData.description,
    status: updatedDispute.status,
    guestId: updatedDispute.openedBy,
    realtorId: updatedDispute.booking.property.realtorId,
    guestArgumentCount: updatedData.guestArgumentCount || 0,
    realtorArgumentCount: updatedData.realtorArgumentCount || 0,
    messages: updatedData.messages || [],
    createdAt: updatedDispute.createdAt,
    updatedAt: updatedDispute.updatedAt,
    guest: updatedDispute.opener,
    booking: {
      id: updatedDispute.booking.id,
      property: {
        title: updatedDispute.booking.property.title,
      },
    },
  };
};

/**
 * Get all disputes for a realtor
 */
export const getRealtorDisputes = async (
  realtorUserId: string,
  status?: string
) => {
  try {
    // First get realtor record
    const realtor = await prisma.realtor.findUnique({
      where: { userId: realtorUserId },
    });

    if (!realtor) {
      logger.error(`Realtor not found for userId: ${realtorUserId}`);
      throw new Error("Realtor not found");
    }

    logger.info(
      `Fetching disputes for realtor: ${realtor.id}, status: ${status}`
    );

    const whereClause: any = {
      booking: {
        property: {
          realtorId: realtor.id,
        },
      },
    };

    if (status && status !== "all") {
      whereClause.status = status;
    }

    const disputes = await prisma.dispute.findMany({
      where: whereClause,
      include: {
        booking: {
          include: {
            property: true,
            guest: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
        opener: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    logger.info(`Found ${disputes.length} disputes for realtor: ${realtor.id}`);

    return disputes.map((dispute) => {
      const attachments = dispute.attachments as any;
      return {
        id: dispute.id,
        bookingId: dispute.bookingId,
        issueType: attachments?.issueType || "OTHER",
        subject: attachments?.subject || dispute.writeup.substring(0, 50),
        description: attachments?.description || dispute.writeup,
        status: dispute.status,
        guestId: dispute.openedBy,
        realtorId: dispute.booking.property.realtorId,
        guestArgumentCount: attachments?.guestArgumentCount || 0,
        realtorArgumentCount: attachments?.realtorArgumentCount || 0,
        messages: attachments?.messages || [],
        createdAt: dispute.createdAt,
        updatedAt: dispute.updatedAt,
        guest: dispute.opener,
        booking: {
          id: dispute.booking.id,
          property: {
            title: dispute.booking.property.title,
          },
        },
      };
    });
  } catch (error) {
    logger.error("Error in getRealtorDisputes:", error);
    throw error;
  }
};

/**
 * Get dispute statistics for realtor
 */
export const getRealtorDisputeStats = async (realtorUserId: string) => {
  try {
    const realtor = await prisma.realtor.findUnique({
      where: { userId: realtorUserId },
    });

    if (!realtor) {
      logger.error(`Realtor not found for userId: ${realtorUserId}`);
      throw new Error("Realtor not found");
    }

    const disputes = await prisma.dispute.findMany({
      where: {
        booking: {
          property: {
            realtorId: realtor.id,
          },
        },
      },
    });

    const total = disputes.length;
    const open = disputes.filter((d) => d.status === DisputeStatus.OPEN).length;
    const pendingResponse = disputes.filter(
      (d) => d.status === DisputeStatus.AWAITING_RESPONSE
    ).length;
    const resolved = disputes.filter(
      (d) => d.status === DisputeStatus.RESOLVED
    ).length;

    return {
      total,
      open,
      pendingResponse,
      resolved,
    };
  } catch (error) {
    logger.error("Error in getRealtorDisputeStats:", error);
    throw error;
  }
};

/**
 * Accept and resolve a dispute (realtor only)
 */
export const acceptDispute = async (
  disputeId: string,
  realtorUserId: string,
  resolution: string
) => {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      booking: {
        include: {
          property: { include: { realtor: true } },
        },
      },
    },
  });

  if (!dispute) {
    throw new Error("Dispute not found");
  }

  if (dispute.booking.property.realtor.userId !== realtorUserId) {
    throw new Error("Only the realtor can accept this dispute");
  }

  const attachments = dispute.attachments as any;

  // Add resolution message
  const resolutionMessage = {
    senderType: "REALTOR",
    message: `ACCEPTED: ${resolution}`,
    createdAt: new Date().toISOString(),
  };

  const updatedMessages = [...(attachments.messages || []), resolutionMessage];

  const updatedDispute = await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      status: DisputeStatus.RESOLVED,
      attachments: {
        ...attachments,
        messages: updatedMessages,
        resolution,
      },
      closedAt: new Date(),
    },
    include: {
      booking: {
        include: {
          property: { include: { realtor: { include: { user: true } } } },
          guest: true,
        },
      },
      opener: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  const updatedData = updatedDispute.attachments as any;
  return {
    id: updatedDispute.id,
    bookingId: updatedDispute.bookingId,
    issueType: updatedData.issueType,
    subject: updatedData.subject,
    description: updatedData.description,
    status: updatedDispute.status,
    guestId: updatedDispute.openedBy,
    realtorId: updatedDispute.booking.property.realtorId,
    guestArgumentCount: updatedData.guestArgumentCount || 0,
    realtorArgumentCount: updatedData.realtorArgumentCount || 0,
    messages: updatedData.messages || [],
    createdAt: updatedDispute.createdAt,
    updatedAt: updatedDispute.updatedAt,
    guest: updatedDispute.opener,
    booking: {
      id: updatedDispute.booking.id,
      property: {
        title: updatedDispute.booking.property.title,
      },
    },
  };
};

export default {
  openRoomFeeDispute,
  openDepositDispute,
  respondToDispute,
  adminResolveDispute,
  autoReleaseDepositIfNoDispute,
  getDisputeById,
  getDisputesByBooking,
  getAllOpenDisputes,
  // New dispute system
  createNewDispute,
  getDisputeByBookingId,
  respondToNewDispute,
  getRealtorDisputes,
  getRealtorDisputeStats,
  acceptDispute,
};
