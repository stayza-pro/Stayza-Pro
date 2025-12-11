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

export default {
  openDispute,
  sendDisputeMessage,
  addDisputeEvidence,
  agreeToSettlement,
  escalateToAdmin,
  adminResolveDispute,
  getDisputesByBooking,
  getDisputeById,
  getAllOpenDisputes,
};
