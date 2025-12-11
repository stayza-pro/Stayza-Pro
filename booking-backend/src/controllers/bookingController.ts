import { logger } from "@/utils/logger";
import { Response } from "express";
import { BookingStatus, Prisma } from "@prisma/client";
import { prisma } from "@/config/database";
import { AuthenticatedRequest, BookingSearchQuery } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { createBookingSchema, updateBookingSchema } from "@/utils/validation";
import { refundPolicyService } from "@/services/refundPolicy";
import { paystackService } from "@/services/paystack";
import { PaymentStatus, PaymentMethod } from "@prisma/client";
import { config } from "@/config";
import { sendBookingCancellation } from "@/services/email";
import { auditLogger } from "@/services/auditLogger";
import {
  safeTransitionBookingStatus,
  canCancelBooking,
  BookingStatusConflictError,
  InvalidStatusTransitionError,
} from "@/services/bookingStatus";
import {
  NotificationService,
  notificationHelpers,
} from "@/services/notificationService";
import escrowService from "@/services/escrowService";

/**
 * @desc    Calculate booking price
 * @route   POST /api/bookings/calculate
 * @access  Public
 */
export const calculateBooking = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { propertyId, checkInDate, checkOutDate, guests } = req.body;

    if (!propertyId || !checkInDate || !checkOutDate) {
      throw new AppError(
        "Property ID, check-in date, and check-out date are required",
        400
      );
    }

    // Check if property exists and is active
    const property = await prisma.property.findUnique({
      where: { id: propertyId, isActive: true },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // Validate dates
    if (checkIn >= checkOut) {
      throw new AppError("Check-out date must be after check-in date", 400);
    }

    // Compare dates only (ignore time) - allow same-day bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDateOnly = new Date(checkIn);
    checkInDateOnly.setHours(0, 0, 0, 0);

    if (checkInDateOnly < today) {
      throw new AppError("Check-in date cannot be in the past", 400);
    }

    // Calculate nights
    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    const pricePerNight = Number(property.pricePerNight);
    const subtotal = pricePerNight * nights;

    // Get optional fees set by realtor
    const serviceFee = property.serviceFee ? Number(property.serviceFee) : 0;
    const cleaningFee = property.cleaningFee ? Number(property.cleaningFee) : 0;
    const securityDeposit = property.securityDeposit
      ? Number(property.securityDeposit)
      : 0;

    // Calculate platform commission (10% of subtotal - taken from realtor payout, not shown to guest)
    const platformCommission =
      subtotal * config.DEFAULT_PLATFORM_COMMISSION_RATE;

    // Total guest pays = subtotal + realtor's optional fees
    const total = subtotal + serviceFee + cleaningFee + securityDeposit;

    res.json({
      success: true,
      message: "Booking calculation successful",
      data: {
        subtotal: Number(subtotal.toFixed(2)),
        serviceFee: Number(serviceFee.toFixed(2)),
        cleaningFee: Number(cleaningFee.toFixed(2)),
        securityDeposit: Number(securityDeposit.toFixed(2)),
        taxes: 0, // MVP: No separate tax calculation
        fees: Number((serviceFee + cleaningFee).toFixed(2)), // Combined fees for backward compatibility
        total: Number(total.toFixed(2)),
        currency: property.currency,
        nights,
        breakdown: {
          pricePerNight: Number(pricePerNight.toFixed(2)),
          serviceFee: Number(serviceFee.toFixed(2)),
          cleaningFee: Number(cleaningFee.toFixed(2)),
          securityDeposit: Number(securityDeposit.toFixed(2)),
          platformCommission: Number(platformCommission.toFixed(2)), // For internal tracking only
          realtorPayout: Number((subtotal - platformCommission).toFixed(2)), // What realtor gets after commission
        },
      },
    });
  }
);

/**
 * @desc    Check property availability for given dates
 * @route   GET /api/bookings/availability/:propertyId
 * @access  Public
 */
export const checkAvailability = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { propertyId } = req.params;
    const { checkIn, checkOut } = req.query as {
      checkIn: string;
      checkOut: string;
    };

    if (!checkIn || !checkOut) {
      throw new AppError("Check-in and check-out dates are required", 400);
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      throw new AppError("Check-out date must be after check-in date", 400);
    }

    // Compare dates only (ignore time) - allow same-day bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDateOnly = new Date(checkInDate);
    checkInDateOnly.setHours(0, 0, 0, 0);

    if (checkInDateOnly < today) {
      throw new AppError("Check-in date cannot be in the past", 400);
    }

    // Check if property exists
    const property = await prisma.property.findUnique({
      where: { id: propertyId, isActive: true },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    // Check for conflicting bookings
    const conflictingBookings = await prisma.booking.findMany({
      where: {
        propertyId,
        status: { in: ["CONFIRMED", "PENDING"] },
        AND: [
          {
            OR: [
              {
                AND: [
                  { checkInDate: { lte: checkInDate } },
                  { checkOutDate: { gt: checkInDate } },
                ],
              },
              {
                AND: [
                  { checkInDate: { lt: checkOutDate } },
                  { checkOutDate: { gte: checkOutDate } },
                ],
              },
              {
                AND: [
                  { checkInDate: { gte: checkInDate } },
                  { checkOutDate: { lte: checkOutDate } },
                ],
              },
            ],
          },
        ],
      },
    });

    // Check for unavailable dates
    // MVP: Simplified - no unavailableDate model
    const unavailableDates: any[] = [];

    const isAvailable =
      conflictingBookings.length === 0 && unavailableDates.length === 0;

    res.json({
      success: true,
      message: "Availability checked successfully",
      data: {
        isAvailable,
        conflictingBookings:
          conflictingBookings.length > 0 ? conflictingBookings : undefined,
        unavailableDates:
          unavailableDates.length > 0 ? unavailableDates : undefined,
      },
    });
  }
);

/**
 * @desc    Create new booking
 * @route   POST /api/bookings
 * @access  Private (GUEST role)
 */
export const createBooking = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { error, value } = createBookingSchema.validate(req.body);

    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const {
      propertyId,
      checkInDate,
      checkOutDate,
      totalGuests,
      specialRequests,
    } = value;

    // Check if property exists and is active
    const property = await prisma.property.findUnique({
      where: { id: propertyId, isActive: true },
      include: {
        realtor: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    // Prevent realtor from booking their own property
    if (property.realtorId === req.user!.id) {
      throw new AppError("You cannot book your own property", 400);
    }

    // Check guest capacity
    if (totalGuests > property.maxGuests) {
      throw new AppError(
        `Property can accommodate maximum ${property.maxGuests} guests`,
        400
      );
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // Validate dates
    if (checkIn >= checkOut) {
      throw new AppError("Check-out date must be after check-in date", 400);
    }

    // Compare dates only (ignore time) - allow same-day bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDateOnly = new Date(checkIn);
    checkInDateOnly.setHours(0, 0, 0, 0);

    if (checkInDateOnly < today) {
      throw new AppError("Check-in date cannot be in the past", 400);
    }

    // Check for conflicts in a transaction to prevent race conditions
    const result = await prisma.$transaction(async (tx) => {
      // Check for conflicting bookings
      const conflictingBookings = await tx.booking.findMany({
        where: {
          propertyId,
          status: { in: ["CONFIRMED", "PENDING"] },
          AND: [
            {
              OR: [
                {
                  AND: [
                    { checkInDate: { lte: checkIn } },
                    { checkOutDate: { gt: checkIn } },
                  ],
                },
                {
                  AND: [
                    { checkInDate: { lt: checkOut } },
                    { checkOutDate: { gte: checkOut } },
                  ],
                },
                {
                  AND: [
                    { checkInDate: { gte: checkIn } },
                    { checkOutDate: { lte: checkOut } },
                  ],
                },
              ],
            },
          ],
        },
      });

      if (conflictingBookings.length > 0) {
        throw new AppError("Property is not available for selected dates", 400);
      }

      // Check for unavailable dates
      // MVP: Skip unavailable dates check
      const unavailableDates: any[] = [];

      if (unavailableDates.length > 0) {
        throw new AppError("Property is not available for selected dates", 400);
      }

      // Calculate nights
      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );

      const pricePerNight = Number(property.pricePerNight);
      const propertyPrice = pricePerNight * nights; // Base property amount

      // Get optional fees set by realtor
      const cleaningFee = property.cleaningFee
        ? Number(property.cleaningFee)
        : 0;
      const securityDeposit = property.securityDeposit
        ? Number(property.securityDeposit)
        : 0;

      // Use escrow service to calculate fee breakdown
      const feeBreakdown = escrowService.calculateFeeBreakdown(
        pricePerNight,
        nights,
        cleaningFee,
        securityDeposit
      );

      const totalPrice = feeBreakdown.totalAmount;

      // Platform commission (10% of property price only - taken from realtor payout)
      const platformCommissionRate = config.DEFAULT_PLATFORM_COMMISSION_RATE;
      const platformCommission = propertyPrice * platformCommissionRate;
      const realtorPayout = propertyPrice - platformCommission;

      // Escrow system: Calculate refund cutoff (24 hours before check-in)
      const refundCutoffTime = new Date(checkIn);
      refundCutoffTime.setHours(refundCutoffTime.getHours() - 24);

      // Payout eligible time (when check-in time is reached)
      const payoutEligibleAt = new Date(checkIn);

      // Create booking with escrow tracking
      const booking = await tx.booking.create({
        data: {
          checkInDate: checkIn,
          checkOutDate: checkOut,
          totalGuests,
          totalPrice: new Prisma.Decimal(totalPrice.toFixed(2)),
          currency: property.currency,
          specialRequests: specialRequests || "",
          refundCutoffTime,
          payoutEligibleAt,
          payoutStatus: "PENDING", // Funds in escrow
          // Fee breakdown
          roomFee: new Prisma.Decimal(feeBreakdown.roomFee),
          cleaningFee: new Prisma.Decimal(feeBreakdown.cleaningFee),
          securityDeposit: new Prisma.Decimal(feeBreakdown.securityDeposit),
          serviceFee: new Prisma.Decimal(feeBreakdown.serviceFee),
          platformFee: new Prisma.Decimal(feeBreakdown.platformFee),
          guestId: req.user!.id,
          propertyId,
        },
        include: {
          property: {
            select: {
              id: true,
              title: true,
              images: true,
              address: true,
              city: true,
              country: true,
              realtor: {
                select: {
                  id: true,
                },
              },
            },
          },
          guest: {
            select: {
              id: true,
            },
          },
        },
      });

      return booking;
    });

    // Send notifications for booking creation
    try {
      const notificationService = NotificationService.getInstance();

      // Create notification for booking creation (PENDING status)
      const guestNotification = {
        userId: result.guestId,
        type: "BOOKING_CONFIRMED" as const,
        title: "Booking Created",
        message: `Your booking for "${result.property.title}" is pending confirmation.`,
        bookingId: result.id,
        priority: "normal" as const,
      };

      await notificationService.createAndSendNotification(guestNotification);

      // Notify realtor about new booking
      const realtorNotification = {
        userId: result.property.realtor.id,
        type: "BOOKING_CONFIRMED" as const,
        title: "New Booking Request",
        message: `${req.user!.firstName || "A guest"} has requested to book "${
          result.property.title
        }".`,
        bookingId: result.id,
        priority: "high" as const,
      };

      await notificationService.createAndSendNotification(realtorNotification);
    } catch (notificationError) {
      logger.error(
        "Failed to send booking creation notifications:",
        notificationError
      );
      // Don't fail the booking creation if notifications fail
    }

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      data: result,
    });

    auditLogger
      .log("BOOKING_CREATE", "BOOKING", {
        entityId: result.id,
        userId: req.user!.id,
        details: {
          propertyId: propertyId,
          checkInDate: checkInDate,
          checkOutDate: checkOutDate,
          totalPrice: result.totalPrice,
        },
        req,
      })
      .catch(() => {});
  }
);

/**
 * @desc    Get all bookings with filtering
 * @route   GET /api/bookings
 * @access  Private (ADMIN)
 */
export const getAllBookings = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
      propertyId,
      guestId,
      startDate,
      endDate,
    } = req.query as BookingSearchQuery;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (status) where.status = status as BookingStatus;
    if (propertyId) where.propertyId = propertyId;
    if (guestId) where.guestId = guestId;
    if (startDate || endDate) {
      where.checkInDate = {};
      if (startDate) where.checkInDate.gte = new Date(startDate);
      if (endDate) where.checkInDate.lte = new Date(endDate);
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              images: true,
              address: true,
              city: true,
              country: true,
              realtor: {
                select: {
                  id: true,
                },
              },
            },
          },
          guest: {
            select: {
              id: true,
            },
          },
          payment: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limitNum,
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      success: true,
      message: "Bookings retrieved successfully",
      data: bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  }
);

/**
 * @desc    Get user's bookings
 * @route   GET /api/bookings/my-bookings
 * @access  Private
 */
export const getMyBookings = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
    } = req.query as BookingSearchQuery;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      guestId: req.user!.id,
    };

    if (status) where.status = status as BookingStatus;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              images: true,
              address: true,
              city: true,
              country: true,
              realtor: {
                select: {
                  id: true,
                },
              },
            },
          },
          payment: true,
          review: {
            select: {
              id: true,
              rating: true,
              comment: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limitNum,
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      success: true,
      message: "Your bookings retrieved successfully",
      data: bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  }
);

/**
 * @desc    Get host's property bookings
 * @route   GET /api/bookings/host-bookings
 * @access  Private (HOST)
 */
export const getHostBookings = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const {
      page = "1",
      limit = "10",
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
      propertyId,
    } = req.query as BookingSearchQuery;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      property: {
        realtorId: req.user!.id,
      },
    };

    if (status) where.status = status as BookingStatus;
    if (propertyId) where.propertyId = propertyId;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          property: {
            select: {
              id: true,
              title: true,
              images: true,
              address: true,
              city: true,
              country: true,
            },
          },
          guest: {
            select: {
              id: true,
            },
          },
          payment: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limitNum,
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      success: true,
      message: "Host bookings retrieved successfully",
      data: bookings,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  }
);

/**
 * @desc    Get single booking
 * @route   GET /api/bookings/:id
 * @access  Private (Owner, Host, or ADMIN)
 */
export const getBooking = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            realtor: {
              select: {
                id: true,
                businessName: true,
                businessPhone: true,
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            images: {
              select: {
                id: true,
                url: true,
              },
              orderBy: {
                order: "asc",
              },
            },
          },
        },
        guest: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        payment: true,
        review: true,
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    // Check authorization
    const isOwner = booking.guestId === req.user!.id;
    const isHost = booking.property.realtor.id === req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";

    if (!isOwner && !isHost && !isAdmin) {
      throw new AppError("Not authorized to view this booking", 403);
    }

    res.json({
      success: true,
      message: "Booking retrieved successfully",
      data: booking,
    });
  }
);

/**
 * @desc    Cancel booking
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private (Owner or ADMIN)
 */
// export const cancelBooking = asyncHandler(
//   async (req: AuthenticatedRequest, res: Response) => {
//     const { id } = req.params;
//     const { reason } = req.body;

//     const booking = await prisma.booking.findUnique({
//       where: { id },
//       include: {
//         property: {
//           include: {
//             realtor: {
//               select: {},
//             },
//           },
//         },
//         payment: true,
//       },
//     });

//     if (!booking) {
//       throw new AppError("Booking not found", 404);
//     }

//     // Check authorization
//     const isOwner = booking.guestId === req.user!.id;
//     const isAdmin = req.user!.role === "ADMIN";

//     if (!isOwner && !isAdmin) {
//       throw new AppError("Not authorized to cancel this booking", 403);
//     }

//     // Check if booking can be cancelled
//     if (booking.status === "CANCELLED") {
//       throw new AppError("Booking is already cancelled", 400);
//     }

//     if (booking.status === "COMPLETED") {
//       throw new AppError("Cannot cancel completed booking", 400);
//     }

//     const now = new Date();

//     // Evaluate refund via policy service if payment exists & was completed
//     let refundEvaluation = null as any;
//     let executedRefund: any = null;

//     if (booking.payment && booking.payment.status === PaymentStatus.COMPLETED) {
//       // Need property.realtorId for policy; re-fetch with property.realtorId select if minimal
//       refundEvaluation = await refundPolicyService.evaluateRefund({
//         booking: booking as any, // property includes realtorId due to earlier include path
//         now,
//       });

//       if (refundEvaluation.eligible) {
//         const refundAmount = refundEvaluation.refundableAmount;

//         // Provider specific refund (best-effort; errors won't block cancellation)
//         // try {
//         //   if (
//         //     false // MVP: Stripe not implemented yet
//         //   ) {
//         //     executedRefund = await stripeService.processRefund(
//         //       booking.payment.stripePaymentIntentId,
//         //       refundAmount,
//         //       "requested_by_customer"
//         //     );
//         //   } else if (
//         //     booking.payment.method === PaymentMethod.PAYSTACK &&
//         //     booking.payment.paystackReference
//         //   ) {
//         //     executedRefund = await paystackService.processRefund(
//         //       booking.payment.paystackReference,
//         //       refundEvaluation.fullRefund ? undefined : refundAmount
//         //     );
//         //   }
//         // } catch (err) {
//         //   logger.error(
//         //     "Provider refund failed; proceeding with internal record",
//         //     err
//         //   );
//         // }

//         await prisma.$transaction(async (tx) => {
//           // Update payment status
//           const newPaymentStatus = refundEvaluation.fullRefund
//             ? PaymentStatus.REFUNDED
//             : PaymentStatus.REFUNDED; // MVP: Simplified status
//           await tx.payment.update({
//             where: { id: booking.payment!.id },
//             data: { status: newPaymentStatus },
//           });

//           // Create refund record
//           await tx.refund.create({
//             data: {
//               amount: refundAmount,
//               currency: booking.currency,
//               reason: refundEvaluation.reason,
//               status: PaymentStatus.COMPLETED,
//               method: booking.payment!.method,
//               bookingId: booking.id,
//               paymentId: booking.payment!.id,
//               processedAt: new Date(),
//               adminApproved: true,
//             },
//           });
//         });
//       }
//     }

//     let updatedBooking = null as any;
//     try {
//       await transitionBookingStatus(
//         id,
//         booking.status as any,
//         BookingStatus.CANCELLED,
//         {
//           specialRequests: reason
//             ? `${
//                 "" // MVP: specialRequests removed
//               }\n\nCancellation reason: ${reason}`
//             : booking.specialRequests,
//         }
//       );
//       updatedBooking = await prisma.booking.findUnique({
//         where: { id },
//         include: {
//           property: { select: { title: true, address: true, city: true } },
//           payment: true,
//           // MVP: refunds model removed
//         },
//       });
//     } catch (e) {
//       if (e instanceof BookingStatusConflictError) {
//         throw new AppError("Booking status changed; cancellation aborted", 409);
//       }
//       throw e;
//     }

//     // Email notification (best effort)
//     try {
//       const guest = await prisma.user.findUnique({
//         where: { id: booking.guestId },
//         select: { email: true },
//       });
//       if (guest?.email) {
//         const totalRefunded = updatedBooking.refunds.reduce(
//           (s: number, r: { amount: any }) => s + Number(r.amount),
//           0 as number
//         );
//         await sendBookingCancellation(
//           guest.email,
//           updatedBooking,
//           { title: updatedBooking.property.title },
//           totalRefunded || undefined
//         );
//       }
//     } catch (e) {
//       logger.error("Failed to send booking cancellation email", e);
//     }

//     res.json({
//       success: true,
//       message: "Booking cancelled successfully",
//       data: {
//         booking: updatedBooking,
//         refundEvaluation,
//         providerRefund: executedRefund || undefined,
//       },
//     });

//     auditLogger
//       .log("BOOKING_CANCEL", "Booking", {
//         entityId: updatedBooking.id,
//         userId: req.user!.id,
//         details: {
//           refundApplied: refundEvaluation?.eligible || false,
//           refundAmount: refundEvaluation?.refundableAmount ?? 0,
//           reason: reason || undefined,
//         },
//         req,
//       })
//       .catch(() => {});
//   }
// );

/**
 * @desc    Update booking status (HOST/ADMIN only)
 * @route   PUT /api/bookings/:id/status
 * @access  Private (HOST or ADMIN)
 */
export const updateBookingStatus = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !Object.values(BookingStatus).includes(status)) {
      throw new AppError("Valid status is required", 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            realtorId: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    // Check authorization
    const isHost = booking.property.realtorId === req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";

    if (!isHost && !isAdmin) {
      throw new AppError("Not authorized to update this booking", 403);
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        property: {
          select: {
            title: true,
            address: true,
            city: true,
            realtorId: true,
          },
        },
        guest: {
          select: {
            id: true,
          },
        },
      },
    });

    // Send status update notifications
    try {
      const notificationService = NotificationService.getInstance();
      let notification = null;

      if (status === BookingStatus.CONFIRMED) {
        notification = notificationHelpers.bookingConfirmed(
          updatedBooking.guestId,
          updatedBooking.id,
          updatedBooking.property.title
        );
      } else if (status === BookingStatus.CANCELLED) {
        notification = notificationHelpers.bookingCancelled(
          updatedBooking.guestId,
          updatedBooking.id,
          updatedBooking.property.title
        );
      } else if (status === BookingStatus.COMPLETED) {
        notification = {
          userId: updatedBooking.guestId,
          type: "BOOKING_COMPLETED" as const,
          title: "Booking Completed",
          message: `Your stay at "${updatedBooking.property.title}" is now complete. Don't forget to leave a review!`,
          bookingId: updatedBooking.id,
          priority: "normal" as const,
        };
      }

      if (notification) {
        await notificationService.createAndSendNotification(notification);
      }
    } catch (notificationError) {
      logger.error(
        "Failed to send booking status update notifications:",
        notificationError
      );
      // Don't fail the status update if notifications fail
    }

    res.json({
      success: true,
      message: "Booking status updated successfully",
      data: updatedBooking,
    });

    auditLogger
      .log("BOOKING_STATUS_UPDATE", "BOOKING", {
        entityId: updatedBooking.id,
        userId: req.user!.id,
        details: { status },
        req,
      })
      .catch(() => {});
  }
);

/**
 * @desc    Cancel booking with enhanced status workflow
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private (Owner or ADMIN)
 */
export const cancelBooking = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            realtor: {
              select: {
                id: true,
                businessName: true,
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
          },
        },
        payment: true,
        guest: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    // Check authorization
    const isOwner = booking.guestId === req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      throw new AppError("Not authorized to cancel this booking", 403);
    }

    // Check if booking can be cancelled using enhanced workflow
    const cancellationCheck = await canCancelBooking(id);
    if (!cancellationCheck.canCancel) {
      throw new AppError(
        cancellationCheck.reason || "Booking cannot be cancelled at this time",
        400
      );
    }

    // Attempt status transition
    const transitionResult = await safeTransitionBookingStatus(
      id,
      BookingStatus.CANCELLED,
      {
        userId: isOwner ? req.user!.id : undefined,
        adminId: isAdmin ? req.user!.id : undefined,
        reason: reason || "Booking cancelled by user",
      }
    );

    if (!transitionResult.success) {
      throw new AppError(
        transitionResult.error || "Failed to cancel booking",
        400
      );
    }

    // Calculate and process refund if eligible
    let refundInfo: any = null;
    if (
      cancellationCheck.refundEligible &&
      booking.payment?.status === "COMPLETED"
    ) {
      try {
        // Import refund service
        const { processBookingRefund, calculateRefundSplit } = await import(
          "@/services/refund"
        );

        // Calculate tiered refund split
        const refundSplit = calculateRefundSplit(
          booking.checkInDate,
          Number(booking.totalPrice)
        );

        // Process the refund with split
        const refundResult = await processBookingRefund(id);

        refundInfo = {
          eligible: true,
          tier: refundResult.tier,
          totalAmount: refundResult.totalAmount,
          customerRefund: refundSplit.customerRefund,
          realtorPayout: refundSplit.realtorPayout,
          stayzaPayout: refundSplit.stayzaPayout,
          breakdown: {
            customer: `${
              refundSplit.tier === "EARLY"
                ? "90%"
                : refundSplit.tier === "MEDIUM"
                ? "70%"
                : "0%"
            }`,
            realtor: `${
              refundSplit.tier === "EARLY"
                ? "7%"
                : refundSplit.tier === "MEDIUM"
                ? "20%"
                : "80%"
            }`,
            stayza: `${
              refundSplit.tier === "EARLY"
                ? "3%"
                : refundSplit.tier === "MEDIUM"
                ? "10%"
                : "20%"
            }`,
          },
          status: "processed",
        };

        // TODO: Actually transfer funds via Paystack/Flutterwave APIs
        // For now, we've recorded the split in the database
      } catch (refundError) {
        logger.error("Refund processing failed:", refundError);
        refundInfo = {
          eligible: true,
          error: "Refund processing failed - please contact support",
        };
      }
    } else {
      refundInfo = {
        eligible: false,
        reason: cancellationCheck.reason,
      };
    }

    // Send cancellation notification emails
    try {
      await sendBookingCancellation(
        booking.guest.email,
        booking,
        booking.property,
        refundInfo?.amount
      );
    } catch (emailError) {
      logger.error("Failed to send cancellation email:", emailError);
    }

    // Send real-time notifications
    try {
      const notificationService = NotificationService.getInstance();

      // Notify guest
      const guestNotification = notificationHelpers.bookingCancelled(
        booking.guestId,
        booking.id,
        booking.property.title
      );
      await notificationService.createAndSendNotification(guestNotification);

      // Notify realtor
      const realtorNotification = {
        userId: booking.property.realtorId,
        type: "BOOKING_CANCELLED" as const,
        title: "Booking Cancelled",
        message: `Booking for "${booking.property.title}" has been cancelled${
          reason ? `. Reason: ${reason}` : ""
        }`,
        bookingId: booking.id,
        propertyId: booking.property.id,
      };
      await notificationService.createAndSendNotification(realtorNotification);
    } catch (notificationError) {
      logger.error(
        "Failed to send cancellation notifications:",
        notificationError
      );
    }

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      data: {
        booking: transitionResult.booking,
        refund: refundInfo,
        cancellation: {
          reason: reason || "Booking cancelled by user",
          cancelledBy: isAdmin ? "admin" : "guest",
          cancelledAt: new Date(),
          refundEligible: cancellationCheck.refundEligible,
        },
      },
    });
  }
);

/**
 * @desc    Check-in booking
 * @route   POST /api/bookings/:id/check-in
 * @access  Private (Guest or Admin)
 */
export const checkInBooking = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        guest: true,
        property: {
          include: {
            realtor: true,
          },
        },
        payment: true,
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    // Authorization: Only guest or admin can check in
    if (!isAdmin && booking.guestId !== userId) {
      throw new AppError("Unauthorized to check in this booking", 403);
    }

    // Verify booking status
    if (
      booking.status !== BookingStatus.PAID &&
      booking.status !== "CONFIRMED"
    ) {
      throw new AppError(
        `Cannot check in. Booking status is ${booking.status}`,
        400
      );
    }

    // Verify it's check-in day or after
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(booking.checkInDate);
    checkInDate.setHours(0, 0, 0, 0);

    if (checkInDate > today) {
      throw new AppError("Check-in date has not arrived yet", 400);
    }

    // Set check-in time and dispute window (1 hour from now)
    const checkInTime = new Date();
    const disputeWindowClosesAt = new Date(
      checkInTime.getTime() + 60 * 60 * 1000
    ); // 1 hour

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CHECKED_IN,
        checkInTime,
        disputeWindowClosesAt,
      },
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
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            realtor: {
              select: {
                id: true,
                businessName: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    // Log audit
    await auditLogger.log("BOOKING_CHECKED_IN" as any, "BOOKING" as any, {
      userId,
      entityId: id,
      details: {
        checkInTime: checkInTime.toISOString(),
        disputeWindowClosesAt: disputeWindowClosesAt.toISOString(),
      },
    });

    res.json({
      success: true,
      message: "Check-in successful",
      data: {
        booking: updatedBooking,
        disputeWindow: {
          closesAt: disputeWindowClosesAt,
          remainingMinutes: 60,
        },
      },
    });
  }
);

/**
 * @desc    Check-out booking
 * @route   POST /api/bookings/:id/check-out
 * @access  Private (Guest or Admin)
 */
export const checkOutBooking = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        guest: true,
        property: {
          include: {
            realtor: true,
          },
        },
        payment: true,
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    // Authorization: Only guest or admin can check out
    if (!isAdmin && booking.guestId !== userId) {
      throw new AppError("Unauthorized to check out this booking", 403);
    }

    // Verify booking status
    if (booking.status !== BookingStatus.CHECKED_IN) {
      throw new AppError(
        `Cannot check out. Booking status is ${booking.status}. Must be checked in first.`,
        400
      );
    }

    // Set check-out time and realtor dispute window (2 hours from now)
    const checkOutTime = new Date();
    const realtorDisputeClosesAt = new Date(
      checkOutTime.getTime() + 2 * 60 * 60 * 1000
    ); // 2 hours

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.CHECKED_OUT,
        checkOutTime,
        realtorDisputeClosesAt,
      },
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
          select: {
            id: true,
            title: true,
            address: true,
            city: true,
            realtor: {
              select: {
                id: true,
                businessName: true,
                userId: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    // Log audit
    await auditLogger.log("BOOKING_CHECKED_OUT" as any, "BOOKING" as any, {
      userId,
      entityId: id,
      details: {
        checkOutTime: checkOutTime.toISOString(),
        realtorDisputeClosesAt: realtorDisputeClosesAt.toISOString(),
      },
    });

    res.json({
      success: true,
      message: "Check-out successful",
      data: {
        booking: updatedBooking,
        realtorDisputeWindow: {
          closesAt: realtorDisputeClosesAt,
          remainingMinutes: 120,
        },
      },
    });
  }
);
