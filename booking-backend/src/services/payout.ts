import { PrismaClient, PayoutStatus, PaymentStatus } from "@prisma/client";
import { config } from "../config";
import axios from "axios";

const prisma = new PrismaClient();

/**
 * Paystack Transfer Service
 * Handles transferring funds to realtor bank accounts after check-in
 */

interface TransferRecipient {
  type: "nuban" | "mobile_money" | "basa";
  name: string;
  account_number: string;
  bank_code: string;
  currency: string;
}

interface TransferRequest {
  source: "balance";
  amount: number; // In kobo for NGN
  recipient: string; // Recipient code
  reason: string;
  reference: string;
}

const paystackClient = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

/**
 * Create a transfer recipient for a realtor
 * This should be called when realtor adds their bank account
 */
export const createTransferRecipient = async (
  recipientData: TransferRecipient
): Promise<string> => {
  try {
    const response = await paystackClient.post(
      "/transferrecipient",
      recipientData
    );

    if (!response.data.status) {
      throw new Error(response.data.message || "Failed to create recipient");
    }

    return response.data.data.recipient_code;
  } catch (error: any) {
        throw new Error("Failed to create transfer recipient");
  }
};

/**
 * Initiate transfer to realtor
 */
export const initiateTransfer = async (
  transferData: TransferRequest
): Promise<any> => {
  try {
    const response = await paystackClient.post("/transfer", transferData);

    if (!response.data.status) {
      throw new Error(response.data.message || "Transfer failed");
    }

    return response.data.data;
  } catch (error: any) {
        throw error;
  }
};

/**
 * Process payout for a booking (90% to realtor, 10% to Stayza)
 */
export const processBookingPayout = async (bookingId: string) => {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      payment: true,
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

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (
    !booking.payment ||
    (booking.payment.status !== PaymentStatus.PARTIALLY_RELEASED &&
      booking.payment.status !== PaymentStatus.SETTLED)
  ) {
    throw new Error("Payment not completed for this booking");
  }

  if (booking.payoutStatus !== "PENDING") {
    throw new Error(`Payout already ${booking.payoutStatus.toLowerCase()}`);
  }

  // Check if check-in time has been reached
  const now = new Date();
  if (booking.checkInDate > now) {
    throw new Error("Check-in time not yet reached");
  }

  const totalAmount = Number(booking.totalPrice);

  // Calculate property base amount (excluding optional fees for commission calculation)
  const nights = Math.ceil(
    (booking.checkOutDate.getTime() - booking.checkInDate.getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const pricePerNight = Number(booking.property.pricePerNight);
  const propertyBaseAmount = pricePerNight * nights;

  // Platform takes 10% of property base amount
  const platformCommission =
    propertyBaseAmount * config.DEFAULT_PLATFORM_COMMISSION_RATE;

  // Realtor gets: property base amount - commission + all optional fees
  const serviceFee = booking.property.serviceFee
    ? Number(booking.property.serviceFee)
    : 0;
  const cleaningFee = booking.property.cleaningFee
    ? Number(booking.property.cleaningFee)
    : 0;
  const securityDeposit = booking.property.securityDeposit
    ? Number(booking.property.securityDeposit)
    : 0;

  const realtorPayout =
    propertyBaseAmount -
    platformCommission +
    serviceFee +
    cleaningFee +
    securityDeposit;
  const stayzaCommission = platformCommission; // Stayza keeps only 10% commission

  // Update payout status to processing
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      payoutStatus: PayoutStatus.PROCESSING,
    },
  });

  try {
    // Check if realtor has a recipient code (bank account on file)
    // For MVP, we'll assume realtors will add this later
    // In production, you'd require bank account before approval

    const recipientCode = booking.property.realtor.paystackSubAccountCode; // Reuse this field or create new one

    if (!recipientCode) {
      throw new Error("Realtor has no bank account on file");
    }

    // Initiate transfer via Paystack
    const transferReference = `payout-${bookingId}-${Date.now()}`;

    const transferResult = await initiateTransfer({
      source: "balance",
      amount: Math.round(realtorPayout * 100), // Convert to kobo
      recipient: recipientCode,
      reason: `Booking payout for ${booking.property.title}`,
      reference: transferReference,
    });

    // Update payment record
    await prisma.payment.update({
      where: { id: booking.payment.id },
      data: {
        commissionPaidOut: true,
        payoutDate: new Date(),
        payoutReference: transferReference,
        platformCommission: stayzaCommission,
        realtorEarnings: realtorPayout,
      },
    });

    // Update booking payout status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        payoutStatus: PayoutStatus.COMPLETED,
        payoutCompletedAt: new Date(),
      },
    });

    
    return {
      success: true,
      bookingId,
      realtorPayout,
      stayzaCommission,
      transferReference,
      transferStatus: transferResult.status,
    };
  } catch (error: any) {
    // Revert to pending if transfer fails
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        payoutStatus: PayoutStatus.FAILED,
      },
    });

        throw error;
  }
};

/**
 * Find all bookings eligible for payout
 */
export const findEligiblePayouts = async (): Promise<string[]> => {
  const now = new Date();

  const eligibleBookings = await prisma.booking.findMany({
    where: {
      payoutStatus: PayoutStatus.PENDING,
      status: "ACTIVE", // Only active bookings
      checkInDate: {
        lte: now, // Check-in time has passed
      },
      payment: {
        status: "HELD", // Payment held in escrow
      },
    },
    select: {
      id: true,
    },
  });

  return eligibleBookings.map((b) => b.id);
};

/**
 * Mark bookings as ready for payout when check-in time reached
 */
export const markReadyForPayout = async (): Promise<number> => {
  const now = new Date();

  const result = await prisma.booking.updateMany({
    where: {
      payoutStatus: PayoutStatus.PENDING,
      payoutEligibleAt: {
        lte: now,
      },
      payment: {
        status: {
          in: [PaymentStatus.PARTIALLY_RELEASED, PaymentStatus.SETTLED],
        }, // Payment completed
      },
    },
    data: {
      payoutStatus: PayoutStatus.READY,
    },
  });

  return result.count;
};
