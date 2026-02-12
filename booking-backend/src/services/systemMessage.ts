/**
 * System Message Service
 *
 * Auto-generates critical messages for bookings to ensure consistency and reliability:
 * - Check-in time and instructions
 * - Property address reveal (after payment confirmed)
 * - Door access codes
 * - House rules
 * - Check-out instructions
 *
 * System messages are:
 * - Timestamped
 * - Immutable
 * - Always sent at the right time
 * - Visible to admin during disputes
 */

import { BookingStatus, PaymentStatus } from "@prisma/client";
import { prisma } from "@/config/database";
import { logger } from "@/utils/logger";

export enum SystemMessageType {
  BOOKING_CONFIRMED = "BOOKING_CONFIRMED",
  PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED",
  CHECKIN_INSTRUCTIONS = "CHECKIN_INSTRUCTIONS",
  ADDRESS_REVEAL = "ADDRESS_REVEAL",
  ACCESS_CODES = "ACCESS_CODES",
  HOUSE_RULES = "HOUSE_RULES",
  CHECKOUT_REMINDER = "CHECKOUT_REMINDER",
  CHECKOUT_INSTRUCTIONS = "CHECKOUT_INSTRUCTIONS",
  BOOKING_CANCELLED = "BOOKING_CANCELLED",
  REFUND_PROCESSED = "REFUND_PROCESSED",
}

interface SystemMessageData {
  bookingId: string;
  propertyId: string;
  guestId: string;
  realtorId: string;
  realtorUserId: string;
  propertyData: {
    title: string;
    address: string;
    city: string;
    checkInTime: string;
    checkOutTime: string;
    accessInstructions?: string;
    houseRules?: string;
    wifiName?: string;
    wifiPassword?: string;
    parkingInstructions?: string;
  };
  bookingData: {
    checkInDate: Date;
    checkOutDate: Date;
    guestName: string;
  };
}

const MAX_TIMEOUT_MS = 2_147_483_647;

export class SystemMessageService {
  private static getLogDetailType(details: unknown): string | null {
    if (
      details &&
      typeof details === "object" &&
      "type" in (details as Record<string, unknown>) &&
      typeof (details as Record<string, unknown>).type === "string"
    ) {
      return (details as Record<string, unknown>).type as string;
    }
    return null;
  }

  private static async hasAuditLogForType(params: {
    action: string;
    bookingId: string;
    type: SystemMessageType;
  }): Promise<boolean> {
    const logs = await prisma.auditLog.findMany({
      where: {
        action: params.action,
        entityType: "BOOKING",
        entityId: params.bookingId,
      },
      select: {
        details: true,
      },
      orderBy: {
        timestamp: "desc",
      },
      take: 100,
    });

    return logs.some(
      (log) => this.getLogDetailType(log.details) === params.type
    );
  }

  /**
   * Generate booking confirmation message
   */
  static generateBookingConfirmed(data: SystemMessageData): string {
    return `🎉 Booking Confirmed!

Hi ${data.bookingData.guestName},

Your booking at ${data.propertyData.title} has been confirmed.

📅 Check-in: ${new Date(data.bookingData.checkInDate).toLocaleDateString()}
📅 Check-out: ${new Date(data.bookingData.checkOutDate).toLocaleDateString()}

Next steps:
1. Complete payment to receive property address and access instructions
2. Review house rules before arrival
3. Contact your host if you have questions

Thank you for booking with us!`;
  }

  /**
   * Generate payment confirmation with address reveal
   */
  static generatePaymentConfirmed(data: SystemMessageData): string {
    return `✅ Payment Confirmed - Property Details

Payment received successfully!

📍 Property Address:
${data.propertyData.address}
${data.propertyData.city}

⏰ Check-in Time: ${data.propertyData.checkInTime || "3:00 PM"}
⏰ Check-out Time: ${data.propertyData.checkOutTime || "11:00 AM"}

You will receive detailed access instructions 24 hours before check-in.

Important: Save this address for navigation on your check-in day.`;
  }

  /**
   * Generate check-in instructions (sent 24 hours before)
   */
  static generateCheckInInstructions(data: SystemMessageData): string {
    let message = `🔑 Check-in Instructions

Hi ${data.bookingData.guestName},

Your check-in is tomorrow! Here's everything you need to know:

📍 Address:
${data.propertyData.address}
${data.propertyData.city}

⏰ Check-in Time: ${data.propertyData.checkInTime || "3:00 PM"}

`;

    // Add access instructions if provided
    if (data.propertyData.accessInstructions) {
      message += `🚪 Access Instructions:
${data.propertyData.accessInstructions}

`;
    }

    // Add WiFi if provided
    if (data.propertyData.wifiName) {
      message += `📶 WiFi:
Network: ${data.propertyData.wifiName}
Password: ${data.propertyData.wifiPassword || "Ask host"}

`;
    }

    // Add parking if provided
    if (data.propertyData.parkingInstructions) {
      message += `🅿️ Parking:
${data.propertyData.parkingInstructions}

`;
    }

    message += `Have a great stay! If you encounter any issues, contact your host through the platform.`;

    return message;
  }

  /**
   * Generate house rules message
   */
  static generateHouseRules(data: SystemMessageData): string {
    const defaultRules = `• Respect quiet hours (10 PM - 8 AM)
• No smoking inside the property
• No parties or events without prior approval
• Treat the property with care
• Follow maximum guest capacity
• Report any damages immediately
• Secure the property when leaving`;

    return `📋 House Rules

Please review and follow these rules during your stay:

${data.propertyData.houseRules || defaultRules}

Violation of house rules may result in booking termination without refund.

Thank you for your cooperation!`;
  }

  /**
   * Generate check-out reminder (sent 24 hours before)
   */
  static generateCheckOutReminder(data: SystemMessageData): string {
    return `⏰ Check-out Tomorrow

Hi ${data.bookingData.guestName},

Your check-out is scheduled for tomorrow at ${
      data.propertyData.checkOutTime || "11:00 AM"
    }.

Please ensure:
✓ All lights and appliances are turned off
✓ Thermostat is set to original setting
✓ Trash is disposed of properly
✓ All keys/access cards are left as instructed
✓ Property is locked securely

We hope you enjoyed your stay!`;
  }

  /**
   * Generate check-out instructions (sent on checkout day)
   */
  static generateCheckOutInstructions(data: SystemMessageData): string {
    return `✅ Check-out Instructions

Check-out time is ${data.propertyData.checkOutTime || "11:00 AM"} today.

Before leaving:
1. Strip used bed linens (place in laundry area if provided)
2. Load and start dishwasher with dirty dishes
3. Take out trash to bins
4. Close all windows and doors
5. Turn off all lights and AC/heating
6. Lock all doors and return keys as instructed

Thank you for staying with us! We'd love to hear about your experience - please leave a review.`;
  }

  /**
   * Send system message (creates in database)
   */
  static async sendSystemMessage(
    type: SystemMessageType,
    data: SystemMessageData
  ): Promise<void> {
    const alreadySent = await this.hasAuditLogForType({
      action: "SYSTEM_MESSAGE_SENT",
      bookingId: data.bookingId,
      type,
    });

    if (alreadySent) {
      return;
    }

    let content = "";

    switch (type) {
      case SystemMessageType.BOOKING_CONFIRMED:
        content = this.generateBookingConfirmed(data);
        break;
      case SystemMessageType.PAYMENT_CONFIRMED:
        content = this.generatePaymentConfirmed(data);
        break;
      case SystemMessageType.CHECKIN_INSTRUCTIONS:
        content = this.generateCheckInInstructions(data);
        break;
      case SystemMessageType.HOUSE_RULES:
        content = this.generateHouseRules(data);
        break;
      case SystemMessageType.CHECKOUT_REMINDER:
        content = this.generateCheckOutReminder(data);
        break;
      case SystemMessageType.CHECKOUT_INSTRUCTIONS:
        content = this.generateCheckOutInstructions(data);
        break;
      default:
        throw new Error(`Unknown system message type: ${type}`);
    }

    await prisma.message.create({
      data: {
        bookingId: data.bookingId,
        senderId: data.realtorUserId,
        recipientId: data.guestId,
        content,
        type: "SYSTEM",
        isRead: false,
        createdAt: new Date(),
        wasFiltered: false,
        violations: [],
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "SYSTEM_MESSAGE_SENT",
        entityType: "BOOKING",
        entityId: data.bookingId,
        details: {
          type,
          recipientId: data.guestId,
        },
      },
    });

    logger.info("System message sent", {
      bookingId: data.bookingId,
      recipientId: data.guestId,
      type,
    });
  }

  static getScheduledMessageTimes(checkInDate: Date, checkOutDate: Date) {
    return {
      checkInInstructionsAt: new Date(
        new Date(checkInDate).getTime() - 24 * 60 * 60 * 1000
      ),
      checkOutReminderAt: new Date(
        new Date(checkOutDate).getTime() - 24 * 60 * 60 * 1000
      ),
      checkOutInstructionsAt: new Date(checkOutDate),
    };
  }

  private static async scheduleMessageDispatch(params: {
    bookingId: string;
    type: SystemMessageType;
    data: SystemMessageData;
    runAt: Date;
  }) {
    const delayMs = params.runAt.getTime() - Date.now();

    await prisma.auditLog.create({
      data: {
        action: "SYSTEM_MESSAGE_SCHEDULED",
        entityType: "BOOKING",
        entityId: params.bookingId,
        details: {
          type: params.type,
          runAt: params.runAt.toISOString(),
          delayMs,
        },
      },
    });

    if (delayMs <= 0) {
      await this.sendSystemMessage(params.type, params.data);
      return;
    }

    if (delayMs > MAX_TIMEOUT_MS) {
      logger.warn("System message schedule exceeds timer limit; skipping", {
        bookingId: params.bookingId,
        type: params.type,
        runAt: params.runAt.toISOString(),
      });
      return;
    }

    setTimeout(() => {
      this.sendSystemMessage(params.type, params.data).catch((error) => {
        logger.error("Failed to send scheduled system message", {
          bookingId: params.bookingId,
          type: params.type,
          error: error instanceof Error ? error.message : error,
        });
      });
    }, delayMs);
  }

  /**
   * Schedule system messages for a new booking
   */
  static async scheduleBookingMessages(bookingId: string): Promise<void> {
    // Fetch booking data
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        property: {
          include: {
            realtor: true,
          },
        },
        guest: true,
      },
    });

    if (!booking) {
      throw new Error("Booking not found");
    }

    const data: SystemMessageData = {
      bookingId: booking.id,
      propertyId: booking.propertyId,
      guestId: booking.guestId,
      realtorId: booking.property.realtorId,
      realtorUserId: booking.property.realtor.userId,
      propertyData: {
        title: booking.property.title,
        address: booking.property.address,
        city: booking.property.city,
        checkInTime: booking.property.checkInTime || "3:00 PM",
        checkOutTime: booking.property.checkOutTime || "11:00 AM",
        accessInstructions: booking.property.accessInstructions || undefined,
        houseRules: booking.property.houseRules || undefined,
        wifiName: booking.property.wifiName || undefined,
        wifiPassword: booking.property.wifiPassword || undefined,
        parkingInstructions: booking.property.parkingInstructions || undefined,
      },
      bookingData: {
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        guestName: `${booking.guest.firstName} ${booking.guest.lastName}`,
      },
    };

    // Send immediate messages
    await this.sendSystemMessage(SystemMessageType.BOOKING_CONFIRMED, data);

    if (
      booking.paymentStatus === PaymentStatus.HELD ||
      booking.paymentStatus === PaymentStatus.PARTIALLY_RELEASED ||
      booking.paymentStatus === PaymentStatus.SETTLED
    ) {
      await this.sendSystemMessage(SystemMessageType.PAYMENT_CONFIRMED, data);
      await this.sendSystemMessage(SystemMessageType.HOUSE_RULES, data);
    }

    const schedule = this.getScheduledMessageTimes(
      booking.checkInDate,
      booking.checkOutDate
    );

    await this.scheduleMessageDispatch({
      bookingId: booking.id,
      type: SystemMessageType.CHECKIN_INSTRUCTIONS,
      data,
      runAt: schedule.checkInInstructionsAt,
    });

    await this.scheduleMessageDispatch({
      bookingId: booking.id,
      type: SystemMessageType.CHECKOUT_REMINDER,
      data,
      runAt: schedule.checkOutReminderAt,
    });

    await this.scheduleMessageDispatch({
      bookingId: booking.id,
      type: SystemMessageType.CHECKOUT_INSTRUCTIONS,
      data,
      runAt: schedule.checkOutInstructionsAt,
    });
  }

  static async rehydrateScheduledMessages(): Promise<void> {
    const now = new Date();
    const lookbackWindow = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const candidateBookings = await prisma.booking.findMany({
      where: {
        checkOutDate: { gte: lookbackWindow },
        status: {
          in: [BookingStatus.PENDING, BookingStatus.ACTIVE, BookingStatus.COMPLETED],
        },
      },
      select: {
        id: true,
      },
      orderBy: {
        checkInDate: "asc",
      },
      take: 500,
    });

    for (const booking of candidateBookings) {
      try {
        await this.scheduleBookingMessages(booking.id);
      } catch (error) {
        logger.error("Failed to rehydrate booking system messages", {
          bookingId: booking.id,
          error: error instanceof Error ? error.message : error,
        });
      }
    }

    logger.info("System message rehydration complete", {
      count: candidateBookings.length,
    });
  }
}
