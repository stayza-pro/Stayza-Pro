import { prisma } from "@/config/database";
import { sendEmail } from "@/services/email";
import { logger } from "@/utils/logger";
import { config } from "@/config";
import { BookingStatus, EmailEventType, StayStatus } from "@prisma/client";

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const WINDOW_MS = 10 * 60 * 1000;

const buildCaptureLink = (bookingId: string) =>
  `${config.FRONTEND_URL}/evidence/capture?booking=${encodeURIComponent(bookingId)}`;

const shouldSendWithinWindow = (target: Date, now: Date): boolean => {
  const diff = target.getTime() - now.getTime();
  return diff <= TWO_HOURS_MS && diff >= TWO_HOURS_MS - WINDOW_MS;
};

const createDedupe = async (
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
  } catch (error: any) {
    if (error?.code === "P2002") {
      return false;
    }
    throw error;
  }
};

export const runEvidenceReminderJob = async (): Promise<void> => {
  const now = new Date();

  const bookings = await prisma.booking.findMany({
    where: {
      status: BookingStatus.ACTIVE,
      OR: [
        { checkInAtSnapshot: { not: null } },
        { checkOutAtSnapshot: { not: null } },
      ],
    },
    include: {
      guest: {
        select: {
          email: true,
          firstName: true,
        },
      },
      property: {
        include: {
          realtor: {
            include: {
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
    take: 500,
  });

  if (bookings.length === 0) {
    logger.info("[EvidenceReminder] No active bookings to inspect.");
    return;
  }

  let sent = 0;

  for (const booking of bookings) {
    const captureLink = buildCaptureLink(booking.id);

    if (booking.checkInAtSnapshot && shouldSendWithinWindow(booking.checkInAtSnapshot, now)) {
      const shouldSend = await createDedupe(
        booking.id,
        EmailEventType.PRE_CHECKIN_REMINDER,
      );

      if (shouldSend) {
        await sendEmail(booking.property.realtor.user.email, {
          subject: `Record property condition (2 hours before check-in)`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
              <h2 style="color: #1f2937;">Pre-check-in evidence reminder</h2>
              <p>Hello ${booking.property.realtor.user.firstName || "Host"},</p>
              <p>Please record the property condition for booking <strong>${booking.id}</strong> before check-in.</p>
              <p><strong>Property:</strong> ${booking.property.title}</p>
              <p><strong>Scheduled check-in:</strong> ${booking.checkInAtSnapshot.toISOString()}</p>
              <a href="${captureLink}" style="display: inline-block; margin-top: 12px; background: #2563eb; color: #fff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 600;">Record property condition</a>
            </div>
          `,
        }).catch(() => undefined);

        sent += 1;
      }
    }

    if (
      booking.checkOutAtSnapshot &&
      booking.stayStatus === StayStatus.CHECKED_IN &&
      shouldSendWithinWindow(booking.checkOutAtSnapshot, now)
    ) {
      const shouldSend = await createDedupe(
        booking.id,
        EmailEventType.PRE_CHECKOUT_REMINDER,
      );

      if (shouldSend) {
        await sendEmail(booking.guest.email, {
          subject: `Record checkout condition (2 hours before check-out)`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
              <h2 style="color: #1f2937;">Pre-check-out evidence reminder</h2>
              <p>Hello ${booking.guest.firstName || "Guest"},</p>
              <p>Please record the property condition before checkout for booking <strong>${booking.id}</strong>.</p>
              <p><strong>Property:</strong> ${booking.property.title}</p>
              <p><strong>Scheduled check-out:</strong> ${booking.checkOutAtSnapshot.toISOString()}</p>
              <a href="${captureLink}" style="display: inline-block; margin-top: 12px; background: #2563eb; color: #fff; text-decoration: none; padding: 10px 16px; border-radius: 8px; font-weight: 600;">Record checkout condition</a>
            </div>
          `,
        }).catch(() => undefined);

        sent += 1;
      }
    }
  }

  logger.info(`[EvidenceReminder] Completed. Sent ${sent} reminder email(s).`);
};
