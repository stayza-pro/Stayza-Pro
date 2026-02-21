import {
  BookingStatus,
  EmailEventType,
  PaymentStatus,
  Prisma,
  StayStatus,
} from "@prisma/client";
import { prisma } from "@/config/database";
import { config } from "@/config";
import { logger } from "@/utils/logger";
import { sendEmail } from "@/services/email";
import checkinService from "@/services/checkinService";
import escrowService from "@/services/escrowService";

const PRE_CHECKIN_LEAD_HOURS = 2;
const PRE_CHECKOUT_LEAD_HOURS = 2;
const REALTOR_DISPUTE_HOURS = 4;
const DISPUTE_GRACE_MINUTES = 10;

const getCaptureLink = (bookingId: string) =>
  `${config.FRONTEND_URL}/evidence/capture?booking=${encodeURIComponent(bookingId)}`;

const tryCreateEmailDedupe = async (
  bookingId: string,
  eventType: EmailEventType,
): Promise<boolean> => {
  const dedupeKey = `${bookingId}:${eventType}`;
  try {
    await prisma.emailEventDedupe.create({
      data: {
        bookingId,
        eventType,
        dedupeKey,
      },
    });
    return true;
  } catch (error) {
    const isDuplicate =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002";
    if (isDuplicate) {
      return false;
    }
    throw error;
  }
};

const sendPreCheckInReminder = async (booking: {
  id: string;
  checkInAtSnapshot: Date | null;
  property: { title: string; realtor: { user: { email: string; firstName: string } } };
}) => {
  if (!booking.checkInAtSnapshot) return;

  const shouldSend = await tryCreateEmailDedupe(
    booking.id,
    EmailEventType.PRE_CHECKIN_REMINDER,
  );
  if (!shouldSend) return;

  const captureLink = getCaptureLink(booking.id);
  await sendEmail(booking.property.realtor.user.email, {
    subject: `Record property condition - ${booking.property.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Pre check-in reminder</h2>
        <p>Hello ${booking.property.realtor.user.firstName || "Host"},</p>
        <p>Check-in is in about 2 hours for booking <strong>${booking.id}</strong>.</p>
        <p>Please record current property condition using Stayza Pro camera evidence.</p>
        <a href="${captureLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 16px;border-radius:8px;text-decoration:none;font-weight:600;">Record property condition</a>
      </div>
    `,
  });
};

const sendPreCheckOutReminder = async (booking: {
  id: string;
  checkOutAtSnapshot: Date | null;
  guest: { email: string; firstName: string };
  property: { title: string };
}) => {
  if (!booking.checkOutAtSnapshot) return;

  const shouldSend = await tryCreateEmailDedupe(
    booking.id,
    EmailEventType.PRE_CHECKOUT_REMINDER,
  );
  if (!shouldSend) return;

  const captureLink = getCaptureLink(booking.id);
  await sendEmail(booking.guest.email, {
    subject: `Record checkout condition - ${booking.property.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto;">
        <h2 style="color: #1f2937;">Pre checkout reminder</h2>
        <p>Hello ${booking.guest.firstName || "Guest"},</p>
        <p>Checkout is in about 2 hours for booking <strong>${booking.id}</strong>.</p>
        <p>Please record room condition with Stayza Pro camera before checkout.</p>
        <a href="${captureLink}" style="display:inline-block;background:#2563eb;color:#fff;padding:12px 16px;border-radius:8px;text-decoration:none;font-weight:600;">Record checkout condition</a>
      </div>
    `,
  });
};

export const runLifecycleReminderJobs = async (): Promise<void> => {
  const now = new Date();
  const preCheckInWindow = new Date(now.getTime() + PRE_CHECKIN_LEAD_HOURS * 60 * 60 * 1000);
  const preCheckOutWindow = new Date(now.getTime() + PRE_CHECKOUT_LEAD_HOURS * 60 * 60 * 1000);

  const [preCheckInBookings, preCheckOutBookings] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: BookingStatus.ACTIVE,
        stayStatus: StayStatus.NOT_STARTED,
        checkInAtSnapshot: {
          lte: preCheckInWindow,
        },
      },
      select: {
        id: true,
        checkInAtSnapshot: true,
        property: {
          select: {
            title: true,
            realtor: {
              select: {
                user: {
                  select: {
                    email: true,
                    firstName: true,
                  },
                },
              },
            },
          },
        },
      },
      take: 200,
    }),
    prisma.booking.findMany({
      where: {
        status: BookingStatus.ACTIVE,
        stayStatus: StayStatus.CHECKED_IN,
        checkOutTime: null,
        checkOutAtSnapshot: {
          lte: preCheckOutWindow,
        },
      },
      select: {
        id: true,
        checkOutAtSnapshot: true,
        guest: {
          select: {
            email: true,
            firstName: true,
          },
        },
        property: {
          select: {
            title: true,
          },
        },
      },
      take: 200,
    }),
  ]);

  for (const booking of preCheckInBookings) {
    if (!booking.checkInAtSnapshot) continue;
    const reminderAt = new Date(
      booking.checkInAtSnapshot.getTime() - PRE_CHECKIN_LEAD_HOURS * 60 * 60 * 1000,
    );
    if (now < reminderAt) continue;

    try {
      await sendPreCheckInReminder(booking);
    } catch (error) {
      logger.error("Failed pre-check-in reminder", {
        bookingId: booking.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  for (const booking of preCheckOutBookings) {
    if (!booking.checkOutAtSnapshot) continue;
    const reminderAt = new Date(
      booking.checkOutAtSnapshot.getTime() - PRE_CHECKOUT_LEAD_HOURS * 60 * 60 * 1000,
    );
    if (now < reminderAt) continue;

    try {
      await sendPreCheckOutReminder(booking);
    } catch (error) {
      logger.error("Failed pre-check-out reminder", {
        bookingId: booking.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
};

const autoCheckoutBooking = async (bookingId: string): Promise<boolean> => {
  const now = new Date();
  const realtorDisputeClosesAt = new Date(
    now.getTime() + (REALTOR_DISPUTE_HOURS * 60 + DISPUTE_GRACE_MINUTES) * 60 * 1000,
  );

  const result = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          include: {
            realtor: {
              include: {
                user: true,
              },
            },
          },
        },
        guest: true,
      },
    });

    if (!booking) return false;
    if (booking.status !== BookingStatus.ACTIVE) return false;
    if (booking.stayStatus !== StayStatus.CHECKED_IN) return false;
    if (booking.checkOutTime) return false;

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        stayStatus: StayStatus.CHECKED_OUT,
        checkOutTime: now,
        depositRefundEligibleAt: realtorDisputeClosesAt,
        realtorDisputeClosesAt,
      },
    });

    await tx.notification.createMany({
      data: [
        {
          userId: booking.guestId,
          type: "BOOKING_CONFIRMED",
          title: "Checkout Auto-Confirmed",
          message:
            "Checkout was automatically confirmed at scheduled checkout time. Security deposit will be refunded if no damages are reported.",
          bookingId: booking.id,
          priority: "medium",
          isRead: false,
        },
        {
          userId: booking.property.realtor.userId,
          type: "BOOKING_REMINDER",
          title: "Guest Checkout Auto-Confirmed",
          message:
            "Guest checkout was auto-confirmed at scheduled checkout time. You can still open a deposit dispute within your window.",
          bookingId: booking.id,
          priority: "high",
          isRead: false,
        },
      ],
    });

    await escrowService.logEscrowEvent({
      bookingId: booking.id,
      eventType: "HOLD_SECURITY_DEPOSIT",
      amount: booking.securityDeposit,
      description: `Auto checkout confirmed at scheduled time. Deposit refund eligible at ${realtorDisputeClosesAt.toISOString()}`,
      metadata: {
        auto: true,
        checkOutTime: now.toISOString(),
        realtorDisputeClosesAt: realtorDisputeClosesAt.toISOString(),
      },
    });

    return true;
  });

  return result;
};

export const runBookingLifecycleAutomation = async (): Promise<void> => {
  const now = new Date();

  const [checkinDue, checkoutDue] = await Promise.all([
    prisma.booking.findMany({
      where: {
        status: BookingStatus.ACTIVE,
        stayStatus: StayStatus.NOT_STARTED,
        checkinConfirmedAt: null,
        checkInAtSnapshot: {
          lte: now,
        },
        payment: {
          status: {
            in: [PaymentStatus.HELD, PaymentStatus.PARTIALLY_RELEASED, PaymentStatus.SETTLED],
          },
        },
      },
      select: { id: true },
      take: 100,
    }),
    prisma.booking.findMany({
      where: {
        status: BookingStatus.ACTIVE,
        stayStatus: StayStatus.CHECKED_IN,
        checkOutTime: null,
        checkOutAtSnapshot: {
          lte: now,
        },
      },
      select: { id: true },
      take: 100,
    }),
  ]);

  for (const booking of checkinDue) {
    try {
      await checkinService.autoConfirmCheckIn(booking.id);
    } catch (error) {
      logger.error("Auto check-in failed", {
        bookingId: booking.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  for (const booking of checkoutDue) {
    try {
      await autoCheckoutBooking(booking.id);
    } catch (error) {
      logger.error("Auto checkout failed", {
        bookingId: booking.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
};
