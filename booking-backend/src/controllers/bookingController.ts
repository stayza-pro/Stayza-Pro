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
  transitionBookingStatus,
  BookingStatusConflictError,
} from "@/services/bookingStatus";
import {
  NotificationService,
  notificationHelpers,
} from "@/services/notificationService";

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

    if (checkInDate < new Date()) {
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

    if (checkIn < new Date()) {
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

      // Commission rate: realtor specific override if present else default
      // (Realtor relation was not fully selected earlier; relying on property.realtorId commission not fetched.
      // For MVP we use default commission. In later enhancement include realtor.commissionRate.)
      const platformCommissionRate = config.DEFAULT_PLATFORM_COMMISSION_RATE;
      const platformCommission = propertyPrice * platformCommissionRate;

      const serviceFee = propertyPrice * config.SERVICE_FEE_RATE;
      const realtorPayout = propertyPrice - platformCommission; // Commission taken from property price portion
      const totalPrice = propertyPrice + serviceFee;

      // Refund deadline (baseline full refund window)
      const refundDeadline = new Date(
        Date.now() + config.REFUND_WINDOW_HOURS * 60 * 60 * 1000
      );

      // Escrow / payout release date (check-in + offset hours if configured)
      const payoutReleaseDate = new Date(checkIn.getTime());
      if (config.ESCROW_RELEASE_OFFSET_HOURS > 0) {
        payoutReleaseDate.setHours(
          payoutReleaseDate.getHours() + config.ESCROW_RELEASE_OFFSET_HOURS
        );
      }

      // Create booking with corrected financial breakdown
      const booking = await tx.booking.create({
        data: {
          checkInDate: checkIn,
          checkOutDate: checkOut,
          totalGuests,
          totalPrice: new Prisma.Decimal(totalPrice.toFixed(2)),
          // MVP: propertyPrice removed from simplified Booking model
          // MVP: serviceFee removed from simplified Booking model
          // MVP: platformCommission removed from simplified Booking model
          // MVP: realtorPayout removed from simplified Booking model
          currency: property.currency,
          // MVP: specialRequests removed from simplified Booking model
          // MVP: isRefundable removed from simplified Booking model
          // MVP: refundDeadline removed from simplified Booking model
          // MVP: payoutReleaseDate removed from simplified Booking model
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
      console.error(
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
      .log("BOOKING_CREATE", "Booking", {
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
        review: true,
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    // Check authorization
    const isOwner = booking.guestId === req.user!.id;
    const isHost = booking.property.realtorId === req.user!.id;
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
//         //   console.error(
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
//       console.error("Failed to send booking cancellation email", e);
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
//           refundAmount: refundEvaluation?.refundableAmount || 0,
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
      console.error(
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
      .log("BOOKING_STATUS_UPDATE", "Booking", {
        entityId: updatedBooking.id,
        userId: req.user!.id,
        details: { status },
        req,
      })
      .catch(() => {});
  }
);
