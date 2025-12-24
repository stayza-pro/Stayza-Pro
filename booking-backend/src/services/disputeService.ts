import { DisputeType, DisputeStatus, BookingStatus } from "@prisma/client";
import { prisma } from "@/config/database";
import { logger } from "@/utils/logger";
import {
  isUserDisputeWindowOpen,
  isRealtorDisputeWindowOpen,
  payRealtorFromDeposit,
  refundRoomFeeToCustomer,
} from "./escrowService";

interface OpenDisputeInput {
  bookingId: string;
  userId: string;
  disputeType: DisputeType;
  evidence?: string[]; // Array of photo/video URLs
  initialMessage: string;
}

interface DisputeMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
  attachments?: string[];
}

interface EvidenceItem {
  url: string;
  type: "photo" | "video";
  uploadedAt: string;
  uploadedBy: string;
  description?: string;
}

/**
 * Open a new dispute
 */
export const openDispute = async (input: OpenDisputeInput) => {
  const {
    bookingId,
    userId,
    disputeType,
    evidence = [],
    initialMessage,
  } = input;

  // Fetch booking with relations
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      guest: true,
      property: {
        include: {
          realtor: {
            include: {
              user: true,
            },
          },
        },
      },
      payment: true,
      disputes: true,
    },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  // Validate dispute type and window
  if (disputeType === DisputeType.USER_DISPUTE) {
    // User dispute validation
    if (userId !== booking.guestId) {
      throw new Error("Only the guest can open a user dispute");
    }

    if (booking.status !== BookingStatus.CHECKED_IN) {
      throw new Error("User disputes can only be opened after check-in");
    }

    if (!booking.checkInTime) {
      throw new Error("Check-in time not recorded");
    }

    if (!isUserDisputeWindowOpen(booking.checkInTime)) {
      throw new Error(
        "User dispute window has closed (must be within 1 hour of check-in)"
      );
    }

    if (booking.userDisputeOpened) {
      throw new Error("User dispute already opened for this booking");
    }
  } else if (disputeType === DisputeType.REALTOR_DISPUTE) {
    // Realtor dispute validation
    if (userId !== booking.property.realtor.userId) {
      throw new Error("Only the property realtor can open a realtor dispute");
    }

    if (booking.status !== BookingStatus.CHECKED_OUT) {
      throw new Error("Realtor disputes can only be opened after check-out");
    }

    if (!booking.checkOutTime) {
      throw new Error("Check-out time not recorded");
    }

    if (!isRealtorDisputeWindowOpen(booking.checkOutTime)) {
      throw new Error(
        "Realtor dispute window has closed (must be within 2 hours of check-out)"
      );
    }

    if (booking.realtorDisputeOpened) {
      throw new Error("Realtor dispute already opened for this booking");
    }
  }

  // Check if evidence is provided (required)
  if (!evidence || evidence.length === 0) {
    throw new Error("Photo or video evidence is required to open a dispute");
  }

  // Format evidence
  const evidenceItems: EvidenceItem[] = evidence.map((url) => ({
    url,
    type: url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? "photo" : "video",
    uploadedAt: new Date().toISOString(),
    uploadedBy: userId,
    description: "",
  }));

  // Format initial message
  const messages: DisputeMessage[] = [
    {
      id: `msg_${Date.now()}`,
      userId,
      userName:
        disputeType === DisputeType.USER_DISPUTE
          ? `${booking.guest.firstName} ${booking.guest.lastName}`
          : booking.property.realtor.businessName,
      message: initialMessage,
      timestamp: new Date().toISOString(),
      attachments: evidence,
    },
  ];

  // Create dispute
  const dispute = await prisma.dispute.create({
    data: {
      bookingId,
      disputeType,
      status: DisputeStatus.OPEN,
      openedBy: userId,
      evidence: evidenceItems as any,
      messages: messages as any,
    },
  });

  // Update booking status and dispute flags
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: BookingStatus.DISPUTE_OPENED,
      userDisputeOpened:
        disputeType === DisputeType.USER_DISPUTE ? true : undefined,
      realtorDisputeOpened:
        disputeType === DisputeType.REALTOR_DISPUTE ? true : undefined,
    },
  });

  // TODO: Send notification to other party
  // - If user dispute: notify realtor
  // - If realtor dispute: notify customer

  logger.info(
    `Dispute opened: ${disputeType} for booking ${bookingId} by user ${userId}`
  );

  return dispute;
};

/**
 * Add a message to an existing dispute
 */
export const sendDisputeMessage = async (
  disputeId: string,
  userId: string,
  message: string,
  attachments: string[] = []
) => {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      booking: {
        include: {
          guest: true,
          property: {
            include: {
              realtor: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!dispute) {
    throw new Error("Dispute not found");
  }

  if (
    dispute.status === DisputeStatus.RESOLVED ||
    dispute.status === DisputeStatus.REJECTED
  ) {
    throw new Error("Cannot send messages to a closed dispute");
  }

  // Verify user is involved in the dispute
  const isGuest = userId === dispute.booking.guestId;
  const isRealtor = userId === dispute.booking.property.realtor.userId;
  const isAdmin = await prisma.user.findFirst({
    where: { id: userId, role: "ADMIN" },
  });

  if (!isGuest && !isRealtor && !isAdmin) {
    throw new Error("You are not authorized to participate in this dispute");
  }

  // Get user name
  let userName = "Admin";
  if (isGuest) {
    userName = `${dispute.booking.guest.firstName} ${dispute.booking.guest.lastName}`;
  } else if (isRealtor) {
    userName = dispute.booking.property.realtor.businessName;
  }

  // Get existing messages
  const existingMessages = (dispute.messages as any as DisputeMessage[]) || [];

  // Add new message
  const newMessage: DisputeMessage = {
    id: `msg_${Date.now()}`,
    userId,
    userName,
    message,
    timestamp: new Date().toISOString(),
    attachments: attachments.length > 0 ? attachments : undefined,
  };

  existingMessages.push(newMessage);

  // Update dispute
  const updatedDispute = await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      messages: existingMessages as any,
      status:
        dispute.status === DisputeStatus.OPEN
          ? DisputeStatus.NEGOTIATION
          : dispute.status,
    },
  });

  // TODO: Send notification to other party

  return updatedDispute;
};

/**
 * Add evidence to an existing dispute
 */
export const addDisputeEvidence = async (
  disputeId: string,
  userId: string,
  evidenceUrls: string[],
  description?: string
) => {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      booking: {
        include: {
          property: {
            include: {
              realtor: true,
            },
          },
        },
      },
    },
  });

  if (!dispute) {
    throw new Error("Dispute not found");
  }

  // Verify user is involved
  const isGuest = userId === dispute.booking.guestId;
  const isRealtor = userId === dispute.booking.property.realtor.userId;

  if (!isGuest && !isRealtor) {
    throw new Error("You are not authorized to add evidence to this dispute");
  }

  // Get existing evidence
  const existingEvidence = (dispute.evidence as any as EvidenceItem[]) || [];

  // Add new evidence
  const newEvidence: EvidenceItem[] = evidenceUrls.map((url) => ({
    url,
    type: url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? "photo" : "video",
    uploadedAt: new Date().toISOString(),
    uploadedBy: userId,
    description: description || "",
  }));

  existingEvidence.push(...newEvidence);

  // Update dispute
  const updatedDispute = await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      evidence: existingEvidence as any,
    },
  });

  return updatedDispute;
};

/**
 * Agree to a settlement amount
 */
export const agreeToSettlement = async (
  disputeId: string,
  userId: string,
  agreedAmount: number,
  notes: string
) => {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      booking: {
        include: {
          property: {
            include: {
              realtor: true,
            },
          },
        },
      },
    },
  });

  if (!dispute) {
    throw new Error("Dispute not found");
  }

  if (
    dispute.status !== DisputeStatus.NEGOTIATION &&
    dispute.status !== DisputeStatus.OPEN
  ) {
    throw new Error("Dispute is not in negotiation phase");
  }

  // Verify user is involved
  const isGuest = userId === dispute.booking.guestId;
  const isRealtor = userId === dispute.booking.property.realtor.userId;

  if (!isGuest && !isRealtor) {
    throw new Error(
      "You are not authorized to agree to settlement for this dispute"
    );
  }

  // Execute settlement in transaction
  const updatedDispute = await prisma.$transaction(async (tx) => {
    // Update dispute
    const dispute = await tx.dispute.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.AGREED,
        agreedAmount,
        outcome: notes,
        closedAt: new Date(),
      },
      include: {
        booking: {
          include: {
            payment: true,
            property: {
              include: {
                realtor: true,
              },
            },
          },
        },
      },
    });

    return dispute;
  });

  // Execute the agreed settlement based on dispute type
  try {
    if (updatedDispute.disputeType === DisputeType.USER_DISPUTE) {
      // User dispute: refund agreed amount to customer, remaining to realtor
      logger.info("Executing user dispute settlement", {
        disputeId,
        bookingId: updatedDispute.bookingId,
        refundAmount: agreedAmount,
      });

      await refundRoomFeeToCustomer(
        updatedDispute.bookingId,
        updatedDispute.booking.payment!.id,
        agreedAmount,
        `User dispute settlement: ${notes}`
      );

      // Update booking status
      await prisma.booking.update({
        where: { id: updatedDispute.bookingId },
        data: {
          status: BookingStatus.CANCELLED,
        },
      });
    } else if (updatedDispute.disputeType === DisputeType.REALTOR_DISPUTE) {
      // Realtor dispute: pay agreed amount to realtor from deposit, rest to customer
      logger.info("Executing realtor dispute settlement", {
        disputeId,
        bookingId: updatedDispute.bookingId,
        realtorAmount: agreedAmount,
      });

      await payRealtorFromDeposit(
        updatedDispute.bookingId,
        updatedDispute.booking.payment!.id,
        agreedAmount,
        `Realtor dispute settlement: ${notes}`
      );

      // Update booking status
      await prisma.booking.update({
        where: { id: updatedDispute.bookingId },
        data: {
          status: BookingStatus.COMPLETED,
        },
      });
    }

    logger.info("Settlement executed successfully", {
      disputeId,
      disputeType: updatedDispute.disputeType,
      agreedAmount,
    });
  } catch (settlementError: any) {
    logger.error("Settlement execution failed", {
      disputeId,
      error: settlementError.message,
      stack: settlementError.stack,
    });

    // Update dispute with error information - revert to ADMIN_REVIEW for manual intervention
    await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.ADMIN_REVIEW,
        outcome: `Settlement execution failed: ${settlementError.message}. Requires admin intervention.`,
      },
    });

    throw new Error(`Settlement execution failed: ${settlementError.message}`);
  }

  return updatedDispute;
};

/**
 * Escalate dispute to admin
 */
export const escalateToAdmin = async (
  disputeId: string,
  userId: string,
  reason: string
) => {
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      booking: {
        include: {
          property: {
            include: {
              realtor: true,
            },
          },
        },
      },
    },
  });

  if (!dispute) {
    throw new Error("Dispute not found");
  }

  // Verify user is involved
  const isGuest = userId === dispute.booking.guestId;
  const isRealtor = userId === dispute.booking.property.realtor.userId;

  if (!isGuest && !isRealtor) {
    throw new Error("You are not authorized to escalate this dispute");
  }

  // Update dispute
  const updatedDispute = await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      status: DisputeStatus.ADMIN_REVIEW,
      escalatedToAdmin: true,
    },
  });

  // Add escalation message
  await sendDisputeMessage(
    disputeId,
    userId,
    `Dispute escalated to admin review. Reason: ${reason}`
  );

  // TODO: Send notification to admin team

  logger.info(`Dispute ${disputeId} escalated to admin by user ${userId}`);

  return updatedDispute;
};

/**
 * Admin resolves a dispute
 */
export const adminResolveDispute = async (
  disputeId: string,
  adminId: string,
  resolutionAmount: number,
  adminNotes: string
) => {
  // Verify user is admin
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
  });

  if (!admin || admin.role !== "ADMIN") {
    throw new Error("Only admins can resolve disputes");
  }

  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      booking: {
        include: {
          payment: true,
          property: {
            include: {
              realtor: true,
            },
          },
        },
      },
    },
  });

  if (!dispute) {
    throw new Error("Dispute not found");
  }

  // Execute admin resolution in transaction
  const updatedDispute = await prisma.$transaction(async (tx) => {
    // Update dispute
    const dispute = await tx.dispute.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.RESOLVED,
        adminId,
        adminNotes,
        agreedAmount: resolutionAmount,
        adminResolvedAt: new Date(),
        closedAt: new Date(),
        outcome: `Admin resolution: ${adminNotes}`,
      },
      include: {
        booking: {
          include: {
            payment: true,
            property: {
              include: {
                realtor: true,
              },
            },
          },
        },
      },
    });

    return dispute;
  });

  // Execute the admin resolution based on dispute type
  try {
    if (updatedDispute.disputeType === DisputeType.USER_DISPUTE) {
      // Admin decided to refund customer
      logger.info("Executing admin resolution - user dispute", {
        disputeId,
        bookingId: updatedDispute.bookingId,
        refundAmount: resolutionAmount,
        adminId,
      });

      await refundRoomFeeToCustomer(
        updatedDispute.bookingId,
        updatedDispute.booking.payment!.id,
        resolutionAmount,
        `Admin resolution: ${adminNotes}`
      );

      // Update booking status
      await prisma.booking.update({
        where: { id: updatedDispute.bookingId },
        data: {
          status: BookingStatus.CANCELLED,
        },
      });
    } else if (updatedDispute.disputeType === DisputeType.REALTOR_DISPUTE) {
      // Admin decided realtor gets amount from deposit
      logger.info("Executing admin resolution - realtor dispute", {
        disputeId,
        bookingId: updatedDispute.bookingId,
        realtorAmount: resolutionAmount,
        adminId,
      });

      await payRealtorFromDeposit(
        updatedDispute.bookingId,
        updatedDispute.booking.payment!.id,
        resolutionAmount,
        `Admin resolution: ${adminNotes}`
      );

      // Update booking status
      await prisma.booking.update({
        where: { id: updatedDispute.bookingId },
        data: {
          status: BookingStatus.COMPLETED,
        },
      });
    }

    logger.info("Admin resolution executed successfully", {
      disputeId,
      disputeType: updatedDispute.disputeType,
      resolutionAmount,
      adminId,
    });
  } catch (resolutionError: any) {
    logger.error("Admin resolution execution failed", {
      disputeId,
      error: resolutionError.message,
      stack: resolutionError.stack,
    });

    // Update dispute with error information - mark for manual retry
    await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.ADMIN_REVIEW,
        adminNotes: `${adminNotes}\n\nExecution failed: ${resolutionError.message}. Requires manual retry.`,
        outcome: `Admin resolution execution failed: ${resolutionError.message}`,
      },
    });

    throw new Error(
      `Admin resolution execution failed: ${resolutionError.message}`
    );
  }

  return updatedDispute;
};

/**
 * Get all disputes for a booking
 */
export const getDisputesByBooking = async (bookingId: string) => {
  return await prisma.dispute.findMany({
    where: { bookingId },
    include: {
      opener: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      admin: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
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
          guest: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          property: {
            include: {
              realtor: {
                include: {
                  user: {
                    select: {
                      id: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
          payment: true,
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
      admin: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });
};

/**
 * Get all open disputes for admin dashboard
 */
export const getAllOpenDisputes = async () => {
  return await prisma.dispute.findMany({
    where: {
      OR: [
        { status: DisputeStatus.OPEN },
        { status: DisputeStatus.NEGOTIATION },
        { status: DisputeStatus.ADMIN_REVIEW },
      ],
    },
    include: {
      booking: {
        include: {
          guest: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          property: {
            include: {
              realtor: {
                select: {
                  id: true,
                  businessName: true,
                  userId: true,
                },
              },
            },
          },
        },
      },
      opener: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

/**
 * NEW COMMISSION FLOW: Admin resolves guest dispute with tier assignment
 * TIER_1_SEVERE: 100% room fee refund (realtor clearly at fault)
 * TIER_2_PARTIAL: 30% room fee refund (partial fault or minor issues)
 * TIER_3_ABUSE: 0% refund (guest abuse: no evidence, false claim)
 */
export const adminResolveGuestDisputeWithTier = async (
  disputeId: string,
  adminId: string,
  tier: "TIER_1_SEVERE" | "TIER_2_PARTIAL" | "TIER_3_ABUSE",
  adminNotes: string
) => {
  // Verify user is admin
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
  });

  if (!admin || admin.role !== "ADMIN") {
    throw new Error("Only admins can resolve disputes");
  }

  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      booking: {
        include: {
          payment: true,
          property: {
            include: {
              realtor: true,
            },
          },
          guest: true,
        },
      },
    },
  });

  if (!dispute) {
    throw new Error("Dispute not found");
  }

  if (dispute.disputeType !== DisputeType.USER_DISPUTE) {
    throw new Error(
      "This function only handles guest disputes. Use adminResolveRealtorDispute for realtor disputes."
    );
  }

  const booking = dispute.booking;
  const payment = booking.payment!;
  const roomFee = Number(booking.roomFee);

  // Import commission service to calculate refund
  const { calculateDisputeRefund } = await import("./commission");
  const refundAmount = calculateDisputeRefund(tier, roomFee);

  logger.info("Resolving guest dispute with tier", {
    disputeId,
    bookingId: booking.id,
    tier,
    roomFee,
    refundAmount,
  });

  // Execute resolution in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update dispute
    const updatedDispute = await tx.dispute.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.RESOLVED,
        adminId,
        adminNotes,
        agreedAmount: refundAmount,
        adminResolvedAt: new Date(),
        closedAt: new Date(),
        outcome: `Admin resolution - ${tier}: ${adminNotes}`,
      },
    });

    // Update booking with tier and refund amount
    const updatedBooking = await tx.booking.update({
      where: { id: booking.id },
      data: {
        guestDisputeTier: tier,
        disputeRefundAmount: refundAmount,
        status: BookingStatus.COMPLETED,
      },
    });

    // Update payment with dispute refund tracking
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        disputeRefundProcessed: true,
        disputeRefundReference: `DISPUTE_REFUND_${booking.id}_${Date.now()}`,
        status: "COMPLETED",
      },
    });

    return { updatedDispute, updatedBooking, refundAmount };
  });

  // Execute the actual refund (outside transaction)
  if (Number(refundAmount) > 0) {
    try {
      logger.info("Processing dispute refund to customer", {
        bookingId: booking.id,
        refundAmount,
        tier,
      });

      // TODO: Implement actual Paystack refund API call
      // For now, just log the escrow event
      const escrowService = await import("./escrowService");
      await escrowService.logEscrowEvent({
        bookingId: booking.id,
        eventType: "REFUND_PARTIAL_TO_CUSTOMER",
        amount: refundAmount,
        description: `Guest dispute resolved - ${tier}: ${adminNotes}. Refund amount: ₦${refundAmount}`,
        metadata: {
          disputeId,
          tier,
          refundPercentage:
            tier === "TIER_1_SEVERE" ? 100 : tier === "TIER_2_PARTIAL" ? 30 : 0,
        },
      });

      // Send notifications
      await prisma.notification.create({
        data: {
          userId: booking.guestId,
          type: "PAYMENT_COMPLETED",
          title: "Dispute Resolved - Refund Processed",
          message: `Your dispute has been resolved. You will receive a refund of ₦${refundAmount.toLocaleString()} (${
            tier === "TIER_1_SEVERE"
              ? "100%"
              : tier === "TIER_2_PARTIAL"
              ? "30%"
              : "0%"
          } of room fee).`,
          bookingId: booking.id,
          priority: "high",
          isRead: false,
        },
      });

      await prisma.notification.create({
        data: {
          userId: booking.property.realtor.userId,
          type: "DISPUTE_OPENED",
          title: "Guest Dispute Resolved",
          message: `Admin resolved the guest dispute for ${
            booking.property.title
          }. Tier: ${tier}. Guest refund: ₦${refundAmount.toLocaleString()}.`,
          bookingId: booking.id,
          priority: "high",
          isRead: false,
        },
      });

      logger.info("Guest dispute refund processed successfully", {
        disputeId,
        bookingId: booking.id,
        refundAmount,
        tier,
      });
    } catch (error: any) {
      logger.error("Failed to process dispute refund", {
        disputeId,
        bookingId: booking.id,
        error: error.message,
      });

      // Mark for manual retry
      await prisma.dispute.update({
        where: { id: disputeId },
        data: {
          adminNotes: `${adminNotes}\n\nRefund execution failed: ${error.message}. Requires manual processing.`,
          outcome: `${tier} - Refund execution failed: ${error.message}`,
        },
      });

      throw new Error(`Dispute refund execution failed: ${error.message}`);
    }
  } else {
    // TIER_3_ABUSE - no refund, just send notifications
    await prisma.notification.create({
      data: {
        userId: booking.guestId,
        type: "DISPUTE_OPENED",
        title: "Dispute Resolved - No Refund",
        message: `Your dispute has been reviewed and determined to be without merit. No refund will be processed. Reason: ${adminNotes}`,
        bookingId: booking.id,
        priority: "high",
        isRead: false,
      },
    });

    await prisma.notification.create({
      data: {
        userId: booking.property.realtor.userId,
        type: "DISPUTE_OPENED",
        title: "Guest Dispute Resolved in Your Favor",
        message: `The guest dispute for ${booking.property.title} has been resolved in your favor. No refund will be issued to the guest.`,
        bookingId: booking.id,
        priority: "normal",
        isRead: false,
      },
    });
  }

  return result;
};

/**
 * NEW COMMISSION FLOW: Admin resolves realtor dispute (damage claim)
 * WIN: Realtor gets full claimed amount from deposit
 * PARTIAL: Realtor gets partial amount based on evidence
 * LOSS: Realtor gets nothing, full deposit refunded to guest
 */
export const adminResolveRealtorDisputeWithOutcome = async (
  disputeId: string,
  adminId: string,
  outcome: "WIN" | "LOSS" | "PARTIAL",
  damageAmount: number, // Amount realtor should receive (0 for LOSS, full for WIN, custom for PARTIAL)
  adminNotes: string
) => {
  // Verify user is admin
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
  });

  if (!admin || admin.role !== "ADMIN") {
    throw new Error("Only admins can resolve disputes");
  }

  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      booking: {
        include: {
          payment: true,
          property: {
            include: {
              realtor: true,
            },
          },
          guest: true,
        },
      },
    },
  });

  if (!dispute) {
    throw new Error("Dispute not found");
  }

  if (dispute.disputeType !== DisputeType.REALTOR_DISPUTE) {
    throw new Error(
      "This function only handles realtor disputes. Use adminResolveGuestDisputeWithTier for guest disputes."
    );
  }

  const booking = dispute.booking;
  const payment = booking.payment!;
  const securityDeposit = Number(booking.securityDeposit);

  // Validate damage amount
  if (damageAmount < 0) {
    throw new Error("Damage amount cannot be negative");
  }

  if (damageAmount > securityDeposit) {
    logger.warn("Damage amount exceeds deposit - capping at deposit amount", {
      disputeId,
      damageAmount,
      securityDeposit,
    });
    damageAmount = securityDeposit; // Cap at deposit (liability limit)
  }

  // Calculate amounts
  const { calculateDepositDeduction } = await import("./commission");
  const { realtorGets, guestRefund, isLiabilityCapped } =
    calculateDepositDeduction(damageAmount, securityDeposit);

  logger.info("Resolving realtor dispute with outcome", {
    disputeId,
    bookingId: booking.id,
    outcome,
    damageAmount,
    realtorGets,
    guestRefund,
    isLiabilityCapped,
  });

  // Execute resolution in transaction
  const result = await prisma.$transaction(async (tx) => {
    // Update dispute
    const updatedDispute = await tx.dispute.update({
      where: { id: disputeId },
      data: {
        status: DisputeStatus.RESOLVED,
        adminId,
        adminNotes,
        agreedAmount: realtorGets,
        adminResolvedAt: new Date(),
        closedAt: new Date(),
        outcome: `Admin resolution - ${outcome}: ${adminNotes}`,
      },
    });

    // Update booking with outcome and deduction amount
    const updatedBooking = await tx.booking.update({
      where: { id: booking.id },
      data: {
        realtorDisputeOutcome: outcome,
        depositDeductionAmount: realtorGets,
        status: BookingStatus.COMPLETED,
      },
    });

    // Update payment with deposit deduction tracking
    await tx.payment.update({
      where: { id: payment.id },
      data: {
        depositDeductionProcessed: true,
        depositPartialRefundAmount: guestRefund,
        depositPartialRefundReference: `DEPOSIT_REFUND_${
          booking.id
        }_${Date.now()}`,
        status: "COMPLETED",
      },
    });

    return { updatedDispute, updatedBooking, realtorGets, guestRefund };
  });

  // Execute the actual transfers (outside transaction)
  try {
    const escrowService = await import("./escrowService");

    // Transfer to realtor if amount > 0
    if (Number(realtorGets) > 0) {
      logger.info("Processing damage payment to realtor from deposit", {
        bookingId: booking.id,
        amount: realtorGets,
        outcome,
      });

      // TODO: Implement actual Paystack transfer to realtor
      await escrowService.logEscrowEvent({
        bookingId: booking.id,
        eventType: "PAY_REALTOR_FROM_DEPOSIT",
        amount: realtorGets,
        description: `Realtor dispute resolved - ${outcome}: ${adminNotes}. Damage payment: ₦${realtorGets}`,
        metadata: {
          disputeId,
          outcome,
          damageAmount,
          isLiabilityCapped,
        },
      });
    }

    // Refund remaining deposit to guest if amount > 0
    if (Number(guestRefund) > 0) {
      logger.info("Processing partial deposit refund to guest", {
        bookingId: booking.id,
        amount: guestRefund,
        outcome,
      });

      // TODO: Implement actual Paystack refund to guest
      await escrowService.logEscrowEvent({
        bookingId: booking.id,
        eventType: "RELEASE_DEPOSIT_TO_CUSTOMER",
        amount: guestRefund,
        description: `Deposit refund after damage deduction - ${outcome}: Refund ₦${guestRefund} (Deduction: ₦${realtorGets})`,
        metadata: {
          disputeId,
          outcome,
          totalDeposit: securityDeposit,
          deductionAmount: realtorGets,
        },
      });
    }

    // Send notifications
    if (outcome === "WIN") {
      await prisma.notification.create({
        data: {
          userId: booking.property.realtor.userId,
          type: "PAYOUT_COMPLETED",
          title: "Damage Dispute Resolved in Your Favor",
          message: `Your damage claim of ₦${realtorGets.toLocaleString()} has been approved and will be transferred from the guest's deposit.`,
          bookingId: booking.id,
          priority: "high",
          isRead: false,
        },
      });

      await prisma.notification.create({
        data: {
          userId: booking.guestId,
          type: "PAYMENT_COMPLETED",
          title: "Damage Dispute Resolved",
          message: `The realtor's damage claim was approved. ₦${realtorGets.toLocaleString()} will be deducted from your deposit${
            Number(guestRefund) > 0
              ? `. Remaining deposit of ₦${guestRefund.toLocaleString()} will be refunded.`
              : "."
          }`,
          bookingId: booking.id,
          priority: "high",
          isRead: false,
        },
      });
    } else if (outcome === "LOSS") {
      await prisma.notification.create({
        data: {
          userId: booking.property.realtor.userId,
          type: "DISPUTE_OPENED",
          title: "Damage Dispute Not Approved",
          message: `Your damage claim was not approved. The full deposit of ₦${securityDeposit.toLocaleString()} will be refunded to the guest. Reason: ${adminNotes}`,
          bookingId: booking.id,
          priority: "high",
          isRead: false,
        },
      });

      await prisma.notification.create({
        data: {
          userId: booking.guestId,
          type: "PAYMENT_COMPLETED",
          title: "Damage Dispute Resolved in Your Favor",
          message: `The realtor's damage claim was not approved. Your full security deposit of ₦${securityDeposit.toLocaleString()} will be refunded.`,
          bookingId: booking.id,
          priority: "high",
          isRead: false,
        },
      });
    } else {
      // PARTIAL
      await prisma.notification.create({
        data: {
          userId: booking.property.realtor.userId,
          type: "PAYOUT_COMPLETED",
          title: "Partial Damage Claim Approved",
          message: `Your damage claim was partially approved. You will receive ₦${realtorGets.toLocaleString()} from the guest's deposit.`,
          bookingId: booking.id,
          priority: "high",
          isRead: false,
        },
      });

      await prisma.notification.create({
        data: {
          userId: booking.guestId,
          type: "PAYMENT_COMPLETED",
          title: "Partial Damage Claim Approved",
          message: `A partial damage claim was approved. ₦${realtorGets.toLocaleString()} will be deducted from your deposit. Remaining ₦${guestRefund.toLocaleString()} will be refunded.`,
          bookingId: booking.id,
          priority: "high",
          isRead: false,
        },
      });
    }

    logger.info("Realtor dispute resolution processed successfully", {
      disputeId,
      bookingId: booking.id,
      outcome,
      realtorGets,
      guestRefund,
    });
  } catch (error: any) {
    logger.error("Failed to process realtor dispute resolution", {
      disputeId,
      bookingId: booking.id,
      error: error.message,
    });

    // Mark for manual retry
    await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        adminNotes: `${adminNotes}\n\nExecution failed: ${error.message}. Requires manual processing.`,
        outcome: `${outcome} - Execution failed: ${error.message}`,
      },
    });

    throw new Error(
      `Realtor dispute resolution execution failed: ${error.message}`
    );
  }

  return result;
};

export default {
  openDispute,
  sendDisputeMessage,
  addDisputeEvidence,
  agreeToSettlement,
  escalateToAdmin,
  adminResolveDispute,
  adminResolveGuestDisputeWithTier,
  adminResolveRealtorDisputeWithOutcome,
  getDisputesByBooking,
  getDisputeById,
  getAllOpenDisputes,
};
