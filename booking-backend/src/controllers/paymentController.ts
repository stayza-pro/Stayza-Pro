import { logger } from "@/utils/logger";
import { Response } from "express";
import { PaymentMethod, PaymentStatus, BookingStatus } from "@prisma/client";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { config } from "@/config";
import { sendBookingConfirmation, sendPaymentReceipt } from "@/services/email";
import {
  NotificationService,
  notificationHelpers,
} from "@/services/notificationService";
import { updatePaymentCommission } from "@/services/commission";
import { flutterwaveService } from "@/services/flutterwave";
import axios from "axios";
import crypto from "crypto";
import escrowService from "@/services/escrowService";

// Paystack API client
const paystackClient = axios.create({
  baseURL: "https://api.paystack.co",
  headers: {
    Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
    "Content-Type": "application/json",
  },
});

/**
 * @desc    Initialize Flutterwave payment
 * @route   POST /api/payments/initialize-flutterwave
 * @access  Private
 */
export const initializeFlutterwavePayment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId } = req.body;
    const user = req.user!;

    // Get booking details
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        guestId: user.id,
      },
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
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (booking.status !== "PENDING") {
      throw new AppError("Payment can only be made for pending bookings", 400);
    }

    // Check if payment already exists
    let payment = await prisma.payment.findFirst({
      where: { bookingId },
    });

    if (payment && payment.status === PaymentStatus.COMPLETED) {
      return res.json({
        success: true,
        message: "Payment already completed",
        data: {
          paymentId: payment.id,
          paymentStatus: payment.status,
        },
      });
    }

    // Generate unique reference
    const reference = `stayza_${bookingId}_${Date.now()}`;

    // Create or update payment record
    payment = await prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        userId: booking.guestId,
        amount: booking.totalPrice,
        currency: booking.currency,
        method: PaymentMethod.FLUTTERWAVE,
        status: PaymentStatus.PENDING,
        reference,
      },
      update: {
        status: PaymentStatus.PENDING,
        reference,
        updatedAt: new Date(),
      },
    });

    try {
      // Initialize Flutterwave payment using service
      const flutterwaveResponse =
        await flutterwaveService.initializeFlutterwavePayment({
          email: user.email,
          amount: Number(booking.totalPrice),
          reference: reference,
          currency: booking.currency,
          callback_url: `${config.FRONTEND_URL}/booking/payment/success?reference=${reference}`,
          metadata: {
            booking_id: bookingId,
            payment_id: payment.id,
            guest_id: user.id,
            property_id: booking.propertyId,
            guest_name: `${user.firstName} ${user.lastName}`.trim(),
            property_title: booking.property.title,
          },
        });

      if (flutterwaveResponse.status !== "success") {
        throw new Error(
          flutterwaveResponse.message || "Payment initialization failed"
        );
      }

      const authorizationUrl = flutterwaveResponse.data.link;

      if (!authorizationUrl) {
        throw new Error("No authorization URL received from Flutterwave");
      }

      logger.info(`✅ Flutterwave payment initialized:`, {
        paymentId: payment.id,
        reference,
        authorizationUrl,
      });

      return res.json({
        success: true,
        message: "Payment initialized successfully",
        data: {
          paymentId: payment.id,
          authorizationUrl,
          reference,
          paymentStatus: payment.status,
        },
      });
    } catch (error: any) {
      logger.error("❌ Flutterwave initialization error:", {
        error: error.message,
        response: error.response?.data,
        bookingId,
        paymentId: payment?.id,
      });

      // Update payment status to failed
      if (payment) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: PaymentStatus.FAILED,
            metadata: {
              error: error.response?.data || error.message,
            } as any,
          },
        });
      }

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to initialize payment";

      throw new AppError(errorMessage, error.response?.status || 500);
    }
  }
);

/**
 * @desc    Verify Flutterwave payment
 * @route   POST /api/payments/verify-flutterwave
 * @access  Private
 */
export const verifyFlutterwavePayment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { reference } = req.body;

    if (!reference) {
      throw new AppError("Payment reference is required", 400);
    }

    try {
      // Verify payment with Flutterwave
      const verificationResponse =
        await flutterwaveService.verifyFlutterwaveTransaction(reference);

      if (verificationResponse.status !== "success") {
        throw new Error("Payment verification failed");
      }

      const transaction = verificationResponse.data;

      // Find payment by reference
      const payment = await prisma.payment.findFirst({
        where: { reference },
        include: {
          booking: {
            include: {
              property: true,
              guest: true,
            },
          },
        },
      });

      if (!payment) {
        throw new AppError("Payment not found", 404);
      }

      // Check if payment belongs to the authenticated user
      if (payment.booking.guestId !== req.user!.id) {
        throw new AppError("Unauthorized access to payment", 403);
      }

      // Update payment status based on verification
      const isSuccessful = transaction.status === "successful";
      const newStatus = isSuccessful
        ? PaymentStatus.COMPLETED
        : PaymentStatus.FAILED;

      const updatedPayment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          paidAt: isSuccessful ? new Date() : undefined,
          providerTransactionId: transaction.id.toString(),
          metadata: transaction as any,
        },
      });

      // If payment successful, integrate with escrow system
      if (isSuccessful) {
        // Get fee breakdown from booking
        const booking = payment.booking;
        const feeBreakdown = {
          roomFee: booking.roomFee.toNumber(),
          cleaningFee: booking.cleaningFee.toNumber(),
          securityDeposit: booking.securityDeposit.toNumber(),
          serviceFee: booking.serviceFee.toNumber(),
          platformFee: booking.platformFee.toNumber(),
          totalAmount: booking.totalPrice.toNumber(),
        };

        // Hold funds in escrow (room fee + security deposit)
        await escrowService.holdFundsInEscrow(
          updatedPayment.id,
          booking.id,
          feeBreakdown
        );

        // Update booking status to PAID (funds in escrow)
        await prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: BookingStatus.PAID },
        });

        // Create escrow events for immediate payouts
        if (feeBreakdown.cleaningFee > 0) {
          await escrowService.createEscrowEvent(
            booking.id,
            "HOLD_ROOM_FEE", // Using as placeholder for immediate payout tracking
            feeBreakdown.cleaningFee,
            "CUSTOMER",
            "REALTOR",
            transaction.id.toString(),
            `Cleaning fee ₦${feeBreakdown.cleaningFee.toFixed(
              2
            )} paid to realtor immediately`
          );
        }

        if (feeBreakdown.serviceFee > 0) {
          await escrowService.createEscrowEvent(
            booking.id,
            "RELEASE_ROOM_FEE_SPLIT", // Using as placeholder for service fee tracking
            feeBreakdown.serviceFee,
            "CUSTOMER",
            "PLATFORM",
            transaction.id.toString(),
            `Service fee ₦${feeBreakdown.serviceFee.toFixed(
              2
            )} collected by platform`
          );
        }

        // Calculate and store commission breakdown
        try {
          await updatePaymentCommission(updatedPayment.id);
        } catch (commissionError) {
          logger.error("Error calculating commission:", commissionError);
          // Don't fail payment verification if commission calculation fails
        }
      }

      // Send failure notification if payment failed
      if (!isSuccessful) {
        try {
          const notificationService = NotificationService.getInstance();
          const failureNotification = notificationHelpers.paymentFailed(
            payment.booking.guestId,
            payment.id,
            Number(payment.amount),
            payment.currency
          );
          await notificationService.createAndSendNotification(
            failureNotification
          );
        } catch (notificationError) {
          logger.error(
            "Error sending payment failure notification:",
            notificationError
          );
        }

        return res.json({
          success: false,
          message: "Payment verification failed",
          data: {
            paymentId: payment.id,
            status: newStatus,
            transaction,
          },
        });
      }

      // Get updated booking with all relations for notifications
      const updatedBooking = await prisma.booking.findUnique({
        where: { id: payment.bookingId },
        include: {
          guest: true,
          property: {
            include: {
              realtor: true,
            },
          },
        },
      });

      if (!updatedBooking) {
        throw new AppError("Booking not found after payment", 500);
      }

      // Send email notifications
      try {
        // Send booking confirmation to guest
        await sendBookingConfirmation(
          updatedBooking.guest.email,
          updatedBooking,
          updatedBooking.property,
          updatedBooking.property.realtor
        );

        // Send payment receipt to guest
        await sendPaymentReceipt(
          updatedBooking.guest.email,
          updatedBooking,
          updatedPayment,
          updatedBooking.property
        );
      } catch (emailError) {
        logger.error("Error sending email notifications:", emailError);
        // Don't fail the payment verification if email fails
      }

      // Send real-time notifications
      try {
        const notificationService = NotificationService.getInstance();

        // Notify guest about successful payment
        const paymentSuccessNotification = notificationHelpers.paymentCompleted(
          updatedBooking.guestId,
          updatedPayment.id,
          Number(updatedPayment.amount),
          updatedPayment.currency
        );
        await notificationService.createAndSendNotification(
          paymentSuccessNotification
        );

        // Notify realtor about completed booking payment
        const realtorNotification = {
          userId: updatedBooking.property.realtorId,
          type: "PAYMENT_SUCCESSFUL" as const,
          title: "Payment Received",
          message: `Payment of ${updatedPayment.currency} ${updatedPayment.amount} received for "${updatedBooking.property.title}".`,
          paymentId: updatedPayment.id,
          bookingId: updatedBooking.id,
          priority: "normal" as const,
        };
        await notificationService.createAndSendNotification(
          realtorNotification
        );
      } catch (notificationError) {
        logger.error(
          "Error sending payment notifications:",
          notificationError
        );
        // Don't fail the payment verification if notifications fail
      }

      return res.json({
        success: true,
        message: "Payment verified successfully",
        data: {
          payment: updatedPayment,
          booking: updatedBooking,
        },
      });
    } catch (error: any) {
      logger.error("Payment verification error:", error);
      throw new AppError(
        error.response?.data?.message || "Failed to verify payment",
        500
      );
    }
  }
);

/**
 * @desc    Get payment details
 * @route   GET /api/payments/:id
 * @access  Private
 */
export const getPayment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const user = req.user!;

    const payment = await prisma.payment.findFirst({
      where: { id },
      include: {
        booking: {
          include: {
            property: {
              select: {
                id: true,
                title: true,
                images: true,
              },
            },
            guest: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    // Check authorization - guest can see their own payments, admin can see all
    if (user.role === "GUEST" && payment.booking.guestId !== user.id) {
      throw new AppError("Unauthorized access to payment", 403);
    }

    return res.json({
      success: true,
      data: payment,
    });
  }
);

/**
 * @desc    Get user payments
 * @route   GET /api/payments
 * @access  Private
 */
export const getUserPayments = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const { page = "1", limit = "10" } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const whereClause =
      user.role === "GUEST" ? { booking: { guestId: user.id } } : {};

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where: whereClause,
        include: {
          booking: {
            include: {
              property: {
                select: {
                  id: true,
                  title: true,
                  images: true,
                },
              },
              guest: {
                select: {
                  id: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limitNum,
      }),
      prisma.payment.count({ where: whereClause }),
    ]);

    return res.json({
      success: true,
      data: payments,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasMore: skip + limitNum < total,
      },
    });
  }
);

/**
 * @desc    Create payment record (internal use)
 * @route   POST /api/payments/create
 * @access  Private
 */
export const createPayment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId, amount, currency, method = "FLUTTERWAVE" } = req.body;

    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        guestId: req.user!.id,
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    const payment = await prisma.payment.create({
      data: {
        bookingId,
        userId: booking.guestId,
        amount: amount || booking.totalPrice,
        currency: currency || booking.currency,
        method: method as PaymentMethod,
        status: PaymentStatus.PENDING,
        reference: `stayza_${bookingId}_${Date.now()}`,
      },
    });

    return res.status(201).json({
      success: true,
      message: "Payment record created successfully",
      data: payment,
    });
  }
);

/**
 * @desc    Process refund
 * @route   POST /api/payments/:id/refund
 * @access  Private (Admin or Realtor)
 */
export const processRefund = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { amount, reason } = req.body;

    const payment = await prisma.payment.findFirst({
      where: { id },
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

    if (!payment) {
      throw new AppError("Payment not found", 404);
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new AppError("Can only refund completed payments", 400);
    }

    // Check authorization
    const user = req.user!;
    const canRefund =
      user.role === "ADMIN" ||
      (user.role === "REALTOR" &&
        payment.booking.property.realtor.userId === user.id);

    if (!canRefund) {
      throw new AppError("Unauthorized to process refunds", 403);
    }

    const refundAmount = amount || payment.amount;

    if (refundAmount > payment.amount) {
      throw new AppError("Refund amount cannot exceed payment amount", 400);
    }

    try {
      // For MVP, we'll mark as refunded without actual Flutterwave refund API call
      // In production, you would call Flutterwave's refund API here

      await prisma.payment.update({
        where: { id },
        data: {
          status: PaymentStatus.REFUNDED_TO_CUSTOMER,
          refundAmount,
          refundedAt: new Date(),
          metadata: {
            ...((payment.metadata as any) || {}),
            refund: {
              amount: refundAmount,
              reason,
              processedBy: user.id,
              processedAt: new Date().toISOString(),
            },
          } as any,
        },
      });

      return res.json({
        success: true,
        message: "Refund processed successfully",
        data: {
          refundAmount,
          reason,
        },
      });
    } catch (error) {
      logger.error("Refund processing error:", error);
      throw new AppError("Failed to process refund", 500);
    }
  }
);

/**
 * @desc    Initialize Paystack payment
 * @route   POST /api/payments/initialize-paystack
 * @access  Private
 */
export const initializePaystackPayment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { bookingId } = req.body;
    const user = req.user!;

    // Get booking details
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        guestId: user.id,
        status: "PENDING",
      },
      include: {
        property: {
          include: {
            realtor: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found or not eligible for payment", 404);
    }

    // Check if payment already exists
    const existingPayment = await prisma.payment.findUnique({
      where: { bookingId },
    });

    if (existingPayment && existingPayment.status === "COMPLETED") {
      throw new AppError("Payment already completed", 400);
    }

    // Create or update payment record
    const payment = existingPayment
      ? await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            method: PaymentMethod.PAYSTACK,
            status: PaymentStatus.PENDING,
          },
        })
      : await prisma.payment.create({
          data: {
            bookingId: booking.id,
            userId: user.id,
            amount: booking.totalPrice,
            currency: booking.currency,
            method: PaymentMethod.PAYSTACK,
            status: PaymentStatus.PENDING,
          },
        });

    // Initialize Paystack transaction - ALL funds go to Stayza Pro (NO SPLIT)
    const { initializePaystackTransaction } = await import(
      "@/services/paystack"
    );

    const paystackResponse = await initializePaystackTransaction({
      email: user.email,
      amount: Number(booking.totalPrice) * 100, // Convert to kobo
      reference: payment.id,
      callback_url: `${process.env.FRONTEND_URL}/payment/verify?provider=paystack&reference=${payment.id}`,
      metadata: {
        bookingId: booking.id,
        userId: user.id,
        propertyTitle: booking.property.title,
        realtorId: booking.property.realtorId,
      },
      // NO subaccount - all funds to main Stayza account
      // NO transaction_charge split
      // Escrow system: funds held, payout after check-in
    });

    // Update payment with reference
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        reference: paystackResponse.data.reference,
        metadata: {
          paystackData: paystackResponse.data,
        } as any,
      },
    });

    res.status(201).json({
      success: true,
      message: "Payment initialized successfully",
      data: {
        paymentId: payment.id,
        authorizationUrl: paystackResponse.data.authorization_url,
        accessCode: paystackResponse.data.access_code,
        reference: paystackResponse.data.reference,
      },
    });
  }
);

/**
 * @desc    Verify Paystack payment
 * @route   POST /api/payments/verify-paystack
 * @access  Private
 */
export const verifyPaystackPayment = asyncHandler(
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const { reference } = req.body;
    const user = req.user!;

    if (!reference) {
      throw new AppError("Payment reference is required", 400);
    }

    // Find payment record
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { reference },
          { id: reference }, // In case frontend sends paymentId
        ],
        userId: user.id,
      },
      include: {
        booking: {
          include: {
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

    if (!payment) {
      throw new AppError("Payment record not found", 404);
    }

    if (payment.status === PaymentStatus.COMPLETED) {
      res.json({
        success: true,
        message: "Payment already verified",
        data: { payment, booking: payment.booking },
      });
      return;
    }

    // Verify with Paystack
    const { verifyPaystackTransaction } = await import("@/services/paystack");

    const verification = await verifyPaystackTransaction(
      payment.reference || payment.id
    );

    if (!verification.status || verification.data.status !== "success") {
      // Update payment status to failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          providerTransactionId: verification.data.id?.toString(),
        },
      });
      throw new AppError("Payment verification failed", 400);
    }

    // Get fee breakdown from booking
    const booking = payment.booking;
    const feeBreakdown = {
      roomFee: booking.roomFee.toNumber(),
      cleaningFee: booking.cleaningFee.toNumber(),
      securityDeposit: booking.securityDeposit.toNumber(),
      serviceFee: booking.serviceFee.toNumber(),
      platformFee: booking.platformFee.toNumber(),
      totalAmount: booking.totalPrice.toNumber(),
    };

    // Update payment status with breakdown
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: PaymentStatus.COMPLETED,
        providerId: "PAYSTACK",
        providerTransactionId: verification.data.id?.toString(),
        paidAt: new Date(),
        metadata: {
          paystackVerification: verification.data,
        } as any,
      },
      include: {
        booking: {
          include: {
            property: true,
            guest: true,
          },
        },
      },
    });

    // Hold funds in escrow (room fee + security deposit)
    await escrowService.holdFundsInEscrow(
      updatedPayment.id,
      booking.id,
      feeBreakdown
    );

    // Update booking status to PAID (funds in escrow)
    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: BookingStatus.PAID },
    });

    // Create escrow events for immediate payouts
    if (feeBreakdown.cleaningFee > 0) {
      await escrowService.createEscrowEvent(
        booking.id,
        "HOLD_ROOM_FEE", // Using as placeholder for immediate payout tracking
        feeBreakdown.cleaningFee,
        "CUSTOMER",
        "REALTOR",
        verification.data.id?.toString(),
        `Cleaning fee ₦${feeBreakdown.cleaningFee.toFixed(
          2
        )} paid to realtor immediately`
      );
    }

    if (feeBreakdown.serviceFee > 0) {
      await escrowService.createEscrowEvent(
        booking.id,
        "RELEASE_ROOM_FEE_SPLIT", // Using as placeholder for service fee tracking
        feeBreakdown.serviceFee,
        "CUSTOMER",
        "PLATFORM",
        verification.data.id?.toString(),
        `Service fee ₦${feeBreakdown.serviceFee.toFixed(
          2
        )} collected by platform`
      );
    }

    // Calculate and update commission
    try {
      const { updatePaymentCommission } = await import("@/services/commission");
      await updatePaymentCommission(updatedPayment.id);
    } catch (commissionError) {
      logger.error("Commission update failed:", commissionError);
    }

    // Send confirmation email
    try {
      await sendPaymentReceipt(
        updatedPayment.booking.guest.email,
        updatedPayment.booking,
        updatedPayment,
        updatedPayment.booking.property
      );
    } catch (emailError) {
      logger.error("Payment receipt email failed:", emailError);
    }

    res.json({
      success: true,
      message: "Payment verified successfully",
      data: {
        payment: updatedPayment,
        booking: updatedPayment.booking,
      },
    });
  }
);

export default {
  initializeFlutterwavePayment,
  verifyFlutterwavePayment,
  createPayment,
  getPayment,
  getUserPayments,
  processRefund,
};
