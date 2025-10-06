import { Response } from "express";
import { PaymentMethod, PaymentStatus } from "@prisma/client";
import { prisma } from "@/config/database";
import { AuthenticatedRequest } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { config } from "@/config";
import { sendBookingConfirmation, sendPaymentReceipt } from "@/services/email";
import {
  NotificationService,
  notificationHelpers,
} from "@/services/notificationService";
import axios from "axios";
import crypto from "crypto";

// Flutterwave API client
const flutterwaveClient = axios.create({
  baseURL: "https://api.flutterwave.com/v3",
  headers: {
    Authorization: `Bearer ${config.FLUTTERWAVE_SECRET_KEY}`,
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

    if (booking.status !== "CONFIRMED") {
      throw new AppError("Booking must be confirmed before payment", 400);
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
      // Initialize Flutterwave payment
      const flutterwaveResponse = await flutterwaveClient.post("/payments", {
        tx_ref: reference,
        amount: booking.totalPrice,
        currency: booking.currency,
        redirect_url: `${config.FRONTEND_URL}/booking/payment/success?reference=${reference}`,
        customer: {
          email: user.email,
          phonenumber: user.phone || "",
          name: `${user.firstName} ${user.lastName}`.trim(),
        },
        customizations: {
          title: "Stayza Booking Payment",
          description: `Payment for ${booking.property.title}`,
          logo: "https://your-logo-url.com/logo.png", // Add your logo URL
        },
        meta: {
          booking_id: bookingId,
          payment_id: payment.id,
          guest_id: user.id,
          property_id: booking.propertyId,
        },
      });

      if (flutterwaveResponse.data.status !== "success") {
        throw new Error(
          flutterwaveResponse.data.message || "Payment initialization failed"
        );
      }

      return res.json({
        success: true,
        message: "Payment initialized successfully",
        data: {
          paymentId: payment.id,
          authorizationUrl: flutterwaveResponse.data.data.link,
          reference,
          paymentStatus: payment.status,
        },
      });
    } catch (error: any) {
      console.error("Flutterwave initialization error:", error);

      // Update payment status to failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });

      throw new AppError(
        error.response?.data?.message || "Failed to initialize payment",
        500
      );
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
      const verificationResponse = await flutterwaveClient.get(
        `/transactions/verify_by_reference?tx_ref=${reference}`
      );

      if (verificationResponse.data.status !== "success") {
        throw new Error("Payment verification failed");
      }

      const transaction = verificationResponse.data.data;

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

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          paidAt: isSuccessful ? new Date() : undefined,
          providerTransactionId: transaction.id.toString(),
          metadata: transaction as any,
        },
      });

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
          console.error(
            "Error sending payment failure notification:",
            notificationError
          );
        }
      }

      // Update booking status if payment successful
      if (isSuccessful) {
        const updatedBooking = await prisma.booking.update({
          where: { id: payment.bookingId },
          data: { status: "COMPLETED" },
          include: {
            guest: true,
            property: {
              include: {
                realtor: true,
              },
            },
          },
        });

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
            payment,
            updatedBooking.property
          );
        } catch (emailError) {
          console.error("Error sending email notifications:", emailError);
          // Don't fail the payment verification if email fails
        }

        // Send real-time notifications
        try {
          const notificationService = NotificationService.getInstance();

          // Notify guest about successful payment
          const paymentSuccessNotification =
            notificationHelpers.paymentCompleted(
              updatedBooking.guestId,
              payment.id,
              Number(payment.amount),
              payment.currency
            );
          await notificationService.createAndSendNotification(
            paymentSuccessNotification
          );

          // Notify realtor about completed booking payment
          const realtorNotification = {
            userId: updatedBooking.property.realtorId,
            type: "PAYMENT_SUCCESSFUL" as const,
            title: "Payment Received",
            message: `Payment of ${payment.currency} ${payment.amount} received for "${updatedBooking.property.title}".`,
            paymentId: payment.id,
            bookingId: updatedBooking.id,
            priority: "normal" as const,
          };
          await notificationService.createAndSendNotification(
            realtorNotification
          );
        } catch (notificationError) {
          console.error(
            "Error sending payment notifications:",
            notificationError
          );
          // Don't fail the payment verification if notifications fail
        }
      }

      return res.json({
        success: isSuccessful,
        message: isSuccessful
          ? "Payment verified successfully"
          : "Payment verification failed",
        data: {
          paymentId: payment.id,
          status: newStatus,
          transaction,
        },
      });
    } catch (error: any) {
      console.error("Payment verification error:", error);
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
          status: PaymentStatus.REFUNDED,
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
      console.error("Refund processing error:", error);
      throw new AppError("Failed to process refund", 500);
    }
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
