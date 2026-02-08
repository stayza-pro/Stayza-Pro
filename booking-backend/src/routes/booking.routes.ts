import express, { Response } from "express";
import {
  BookingStatus,
  Prisma,
  PaymentStatus,
  PaymentMethod,
} from "@prisma/client";
import { prisma } from "@/config/database";
import { AuthenticatedRequest, BookingSearchQuery } from "@/types";
import { AppError, asyncHandler } from "@/middleware/errorHandler";
import { createBookingSchema } from "@/utils/validation";
import { refundPolicyService } from "@/services/refundPolicy";
import { calculateRefundSplit, processBookingRefund } from "@/services/refund";
import { processAutomaticCancellationRefund } from "@/services/cancellationRefund";
import { paystackService } from "@/services/paystack";
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
import { logger } from "@/utils/logger";
import { authenticate, authorize } from "@/middleware/auth";
import { bookingLimiter } from "@/middleware/rateLimiter";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Bookings
 *     description: Booking management and lifecycle endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Booking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         guestId:
 *           type: string
 *         propertyId:
 *           type: string
 *         checkInDate:
 *           type: string
 *           format: date
 *         checkOutDate:
 *           type: string
 *           format: date
 *         totalGuests:
 *           type: integer
 *         totalPrice:
 *           type: number
 *         currency:
 *           type: string
 *         status:
 *           type: string
 *           enum: [PENDING, ACTIVE, DISPUTED, COMPLETED, CANCELLED]
 *         specialRequests:
 *           type: string
 *         roomFee:
 *           type: number
 *         cleaningFee:
 *           type: number
 *         securityDeposit:
 *           type: number
 *         serviceFee:
 *           type: number
 *         platformFee:
 *           type: number
 *         payoutStatus:
 *           type: string
 *           enum: [PENDING, RELEASED, REFUNDED]
 *         refundCutoffTime:
 *           type: string
 *           format: date-time
 *         payoutEligibleAt:
 *           type: string
 *           format: date-time
 *         checkInTime:
 *           type: string
 *           format: date-time
 *         checkOutTime:
 *           type: string
 *           format: date-time
 *         disputeWindowClosesAt:
 *           type: string
 *           format: date-time
 *         realtorDisputeClosesAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/bookings/calculate:
 *   post:
 *     summary: Calculate booking price
 *     description: Calculate total booking price including fees and commission breakdown
 *     tags: [Bookings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *               - checkInDate
 *               - checkOutDate
 *             properties:
 *               propertyId:
 *                 type: string
 *               checkInDate:
 *                 type: string
 *                 format: date
 *               checkOutDate:
 *                 type: string
 *                 format: date
 *               guests:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Booking calculation successful
 *       400:
 *         description: Invalid dates or missing parameters
 *       404:
 *         description: Property not found
 */
router.post(
  "/calculate",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { propertyId, checkInDate, checkOutDate, guests } = req.body;

    if (!propertyId || !checkInDate || !checkOutDate) {
      throw new AppError(
        "Property ID, check-in date, and check-out date are required",
        400
      );
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId, isActive: true },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkIn >= checkOut) {
      throw new AppError("Check-out date must be after check-in date", 400);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkInDateOnly = new Date(checkIn);
    checkInDateOnly.setHours(0, 0, 0, 0);

    if (checkInDateOnly < tomorrow) {
      throw new AppError("Check-in date must be at least tomorrow", 400);
    }

    const nights = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    const pricePerNight = Number(property.pricePerNight);
    const roomFee = pricePerNight * nights; // Room fee (base price)

    const cleaningFee = property.cleaningFee ? Number(property.cleaningFee) : 0;
    const securityDeposit = property.securityDeposit
      ? Math.round(Number(property.securityDeposit) * 100) / 100
      : 0;

    // NEW COMMISSION STRUCTURE
    // Calculate service fee: 2% of (room fee + cleaning fee)
    const subtotal = roomFee + cleaningFee;
    const serviceFee = Math.round(subtotal * 0.02 * 100) / 100; // 2% service fee

    // Platform fee: 10% of room fee (deducted at release, not charged to guest)
    const platformFee = Math.round(roomFee * 0.1 * 100) / 100;

    // Total amount customer pays
    const total =
      Math.round((roomFee + cleaningFee + serviceFee + securityDeposit) * 100) /
      100;

    // Realtor earnings breakdown
    const cleaningFeeImmediate = cleaningFee; // Released immediately
    const roomFeeSplitRealtor = roomFee * 0.9; // Released after 1-hour window
    const totalRealtorEarnings = cleaningFeeImmediate + roomFeeSplitRealtor;

    res.json({
      success: true,
      message: "Booking calculation successful",
      data: {
        roomFee: Number(roomFee.toFixed(2)),
        cleaningFee: Number(cleaningFee.toFixed(2)),
        serviceFee: Number(serviceFee.toFixed(2)), // 2% of (room + cleaning)
        securityDeposit: Number(securityDeposit.toFixed(2)),
        subtotal: Number(roomFee.toFixed(2)), // Room fee only (for display)
        taxes: 0, // No taxes in current implementation
        fees: Number(serviceFee.toFixed(2)), // Service fee shown separately
        total: Number(total.toFixed(2)), // room + cleaning + serviceFee + deposit
        currency: property.currency,
        nights,
        breakdown: {
          pricePerNight: Number(pricePerNight.toFixed(2)),
          roomFee: Number(roomFee.toFixed(2)),
          cleaningFee: Number(cleaningFee.toFixed(2)),
          serviceFee: Number(serviceFee.toFixed(2)),
          securityDeposit: Number(securityDeposit.toFixed(2)),
          platformFee: Number(platformFee.toFixed(2)), // 10% of room fee

          // Immediate releases (at payment verification)
          cleaningFeeImmediate: Number(cleaningFeeImmediate.toFixed(2)),
          serviceFeeToPlatform: Number(serviceFee.toFixed(2)),

          // Released after 1-hour dispute window
          roomFeeSplitRealtor: Number(roomFeeSplitRealtor.toFixed(2)), // 90%
          roomFeeSplitPlatform: Number(platformFee.toFixed(2)), // 10%

          // Total realtor earnings
          totalRealtorEarnings: Number(totalRealtorEarnings.toFixed(2)),

          // Commission rates
          platformFeeRate: "10%",
          serviceFeeRate: "2%",
          serviceFeeDescription: "2% of (room fee + cleaning fee)",
        },
      },
    });
  })
);

/**
 * @swagger
 * /api/bookings/availability/{propertyId}:
 *   get:
 *     summary: Check property availability
 *     description: Check if property is available for given dates
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: checkIn
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: checkOut
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Availability checked successfully
 *       400:
 *         description: Invalid dates
 *       404:
 *         description: Property not found
 */
router.get(
  "/availability/:propertyId",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkInDateOnly = new Date(checkInDate);
    checkInDateOnly.setHours(0, 0, 0, 0);

    if (checkInDateOnly < tomorrow) {
      throw new AppError("Check-in date must be at least tomorrow", 400);
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId, isActive: true },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    const conflictingBookings = await prisma.booking.findMany({
      where: {
        propertyId,
        status: { in: ["ACTIVE", "PENDING"] },
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
  })
);

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create new booking
 *     description: Create a new booking (GUEST only)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - propertyId
 *               - checkInDate
 *               - checkOutDate
 *               - totalGuests
 *             properties:
 *               propertyId:
 *                 type: string
 *               checkInDate:
 *                 type: string
 *                 format: date
 *               checkOutDate:
 *                 type: string
 *                 format: date
 *               totalGuests:
 *                 type: integer
 *               specialRequests:
 *                 type: string
 *     responses:
 *       201:
 *         description: Booking created successfully
 *       400:
 *         description: Validation error or property not available
 *       403:
 *         description: Not authorized
 */
router.post(
  "/",
  authenticate,
  authorize("GUEST"),
  bookingLimiter,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

    if (property.realtorId === req.user!.id) {
      throw new AppError("You cannot book your own property", 400);
    }

    if (totalGuests > property.maxGuests) {
      throw new AppError(
        `Property can accommodate maximum ${property.maxGuests} guests`,
        400
      );
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (checkIn >= checkOut) {
      throw new AppError("Check-out date must be after check-in date", 400);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const checkInDateOnly = new Date(checkIn);
    checkInDateOnly.setHours(0, 0, 0, 0);

    if (checkInDateOnly < tomorrow) {
      throw new AppError("Check-in date must be at least tomorrow", 400);
    }

    const result = await prisma.$transaction(async (tx) => {
      const conflictingBookings = await tx.booking.findMany({
        where: {
          propertyId,
          status: { in: ["ACTIVE", "PENDING"] },
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

      const unavailableDates: any[] = [];

      if (unavailableDates.length > 0) {
        throw new AppError("Property is not available for selected dates", 400);
      }

      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );

      const pricePerNight = Number(property.pricePerNight);
      const propertyPrice = pricePerNight * nights;

      const cleaningFee = property.cleaningFee
        ? Number(property.cleaningFee)
        : 0;
      const securityDeposit = property.securityDeposit
        ? Number(property.securityDeposit)
        : 0;

      const feeBreakdown = escrowService.calculateFeeBreakdown(
        pricePerNight,
        nights,
        cleaningFee,
        securityDeposit
      );

      const totalPrice = feeBreakdown.totalAmount;

      const platformCommissionRate = config.DEFAULT_PLATFORM_COMMISSION_RATE;
      const platformCommission = propertyPrice * platformCommissionRate;
      const realtorPayout = propertyPrice - platformCommission;

      const refundCutoffTime = new Date(checkIn);
      refundCutoffTime.setHours(refundCutoffTime.getHours() - 24);

      const payoutEligibleAt = new Date(checkIn);

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
          payoutStatus: "PENDING",
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
                  userId: true,
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

    try {
      const notificationService = NotificationService.getInstance();

      const guestNotification = {
        userId: result.guestId,
        type: "BOOKING_CONFIRMED" as const,
        title: "Booking Created",
        message: `Your booking for "${result.property.title}" is pending confirmation.`,
        bookingId: result.id,
        priority: "normal" as const,
      };

      await notificationService.createAndSendNotification(guestNotification);

      const realtorNotification = {
        userId: result.property.realtor.userId,
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
  })
);

/**
 * @swagger
 * /api/bookings/my-bookings:
 *   get:
 *     summary: Get user's bookings
 *     description: Get all bookings for the authenticated user
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACTIVE, DISPUTED, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: User bookings retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/my-bookings",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

    if (status) {
      const parsedStatus = status as BookingStatus;
      if (Object.values(BookingStatus).includes(parsedStatus)) {
        where.status = parsedStatus;
      }
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
  })
);

/**
 * @swagger
 * /api/bookings/realtor-bookings:
 *   get:
 *     summary: Get host's property bookings
 *     description: Get all bookings for properties owned by the realtor
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, ACTIVE, DISPUTED, COMPLETED, CANCELLED]
 *       - in: query
 *         name: propertyId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Host bookings retrieved successfully
 *       403:
 *         description: Not authorized
 */
router.get(
  "/realtor-bookings",
  authenticate,
  authorize("REALTOR"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

    // Get realtor record from user ID
    const realtor = await prisma.realtor.findUnique({
      where: { userId: req.user!.id },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    const where: any = {
      property: {
        realtorId: realtor.id,
      },
    };

    if (status) {
      const parsedStatus = status as BookingStatus;
      if (Object.values(BookingStatus).includes(parsedStatus)) {
        where.status = parsedStatus;
      }
    }
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
              firstName: true,
              lastName: true,
              email: true,
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
  })
);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get single booking
 *     description: Get detailed booking information (owner, host, or admin only)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking retrieved successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Booking not found
 */
router.get(
  "/:id",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
          },
        },
        payment: true,
        review: true,
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

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
  })
);

/**
 * @swagger
 * /api/bookings/{id}/status:
 *   put:
 *     summary: Update booking status
 *     description: Update booking status (HOST or ADMIN only)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, ACTIVE, DISPUTED, COMPLETED, CANCELLED]
 *     responses:
 *       200:
 *         description: Booking status updated successfully
 *       400:
 *         description: Invalid status
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Booking not found
 */
router.put(
  "/:id/status",
  authenticate,
  authorize("REALTOR", "ADMIN"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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

    try {
      const notificationService = NotificationService.getInstance();
      let notification = null;

      if (status === BookingStatus.ACTIVE) {
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
  })
);

/**
 * @swagger
 * /api/bookings/{id}/cancel-preview:
 *   get:
 *     summary: Preview cancellation refund amount
 *     description: Get refund breakdown before confirming cancellation
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Refund preview calculated successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Booking not found
 */
router.get(
  "/:id/cancel-preview",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const userId = req.user!.id;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            realtorId: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            status: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    const isGuest = booking.guestId === userId;
    const isAdmin = req.user!.role === "ADMIN";

    if (!isGuest && !isAdmin) {
      throw new AppError("Not authorized to cancel this booking", 403);
    }

    const cancellationCheck = await canCancelBooking(id);

    if (!cancellationCheck.canCancel) {
      return res.json({
        canCancel: false,
        reason: cancellationCheck.reason,
        refundInfo: null,
      });
    }

    // Calculate refund using new policy service
    const refundCalc = refundPolicyService.calculateCancellationRefund({
      booking,
    });

    let tierPercentages = { customer: 0, realtor: 0, platform: 0 };
    let warning = null;

    switch (refundCalc.tier) {
      case "EARLY":
        tierPercentages = { customer: 90, realtor: 7, platform: 3 };
        break;
      case "MEDIUM":
        tierPercentages = { customer: 70, realtor: 20, platform: 10 };
        break;
      case "LATE":
        tierPercentages = { customer: 0, realtor: 80, platform: 20 };
        warning =
          "⚠️ Late cancellation: You will only receive your security deposit back. Room fee will not be refunded.";
        break;
      case "NONE":
        tierPercentages = { customer: 0, realtor: 0, platform: 0 };
        warning = "❌ Cannot cancel after check-in time.";
        break;
    }

    const refundInfo = {
      tier: refundCalc.tier,
      hoursUntilCheckIn: Math.round(refundCalc.hoursUntilCheckIn * 10) / 10,

      // Room fee breakdown
      roomFee: {
        total: refundCalc.roomFee,
        customerRefund: refundCalc.customerRoomRefund,
        realtorPortion: refundCalc.realtorRoomPortion,
        platformPortion: refundCalc.platformRoomPortion,
        percentages: tierPercentages,
      },

      // Other fees (non-refundable)
      securityDeposit: {
        total: refundCalc.securityDepositRefund,
        customerRefund: refundCalc.securityDepositRefund,
        note: "Always 100% refunded to customer",
      },

      serviceFee: {
        total: refundCalc.serviceFee,
        platformPortion: refundCalc.serviceFee,
        note: "Never refunded - kept by platform",
      },

      cleaningFee: {
        total: refundCalc.cleaningFee,
        realtorPortion: refundCalc.cleaningFee,
        note: "Never refunded - kept by realtor",
      },

      // Totals
      totals: {
        customerRefund: refundCalc.totalCustomerRefund,
        realtorPortion: refundCalc.totalRealtorPortion,
        platformPortion: refundCalc.totalPlatformPortion,
      },

      currency: booking.currency,
      reason: refundCalc.reason,
      warning,
    };

    return res.json({
      canCancel: refundCalc.tier !== "NONE",
      refundInfo,
      bookingDetails: {
        id: booking.id,
        propertyTitle: booking.property.title,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        status: booking.status,
        paymentStatus: booking.payment?.status,
      },
    });
  })
);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   put:
 *     summary: Cancel booking
 *     description: Cancel booking with refund processing (owner or admin only)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       400:
 *         description: Cannot cancel booking
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Booking not found
 */
router.put(
  "/:id/cancel",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
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
                    id: true,
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

    const isOwner = booking.guestId === req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";

    if (!isOwner && !isAdmin) {
      throw new AppError("Not authorized to cancel this booking", 403);
    }

    const cancellationCheck = await canCancelBooking(id);
    if (!cancellationCheck.canCancel) {
      throw new AppError(
        cancellationCheck.reason || "Booking cannot be cancelled at this time",
        400
      );
    }

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

    let refundInfo: any = null;

    
    // Process automatic cancellation refund based on tier
    if (
      booking.payment?.status === PaymentStatus.PARTIALLY_RELEASED ||
      booking.payment?.status === PaymentStatus.SETTLED
    ) {
      
      try {
        const refundResult = await processAutomaticCancellationRefund(id);

        if (refundResult.success) {
          const calc = refundResult.refundCalculation;

          refundInfo = {
            eligible: calc.totalCustomerRefund > 0,
            tier: calc.tier,
            hoursUntilCheckIn: calc.hoursUntilCheckIn,
            totalCustomerRefund: calc.totalCustomerRefund,
            totalRealtorPortion: calc.totalRealtorPortion,
            totalPlatformPortion: calc.totalPlatformPortion,
            breakdown: {
              roomFee: {
                total: calc.roomFee,
                customerRefund: calc.customerRoomRefund,
                realtorPortion: calc.realtorRoomPortion,
                platformPortion: calc.platformRoomPortion,
              },
              securityDeposit: calc.securityDepositRefund,
              serviceFee: calc.serviceFee,
              cleaningFee: calc.cleaningFee,
            },
            escrowEventsCreated: refundResult.escrowEventsCreated,
            notificationsSent: refundResult.notificationsSent,
            message: calc.reason,
          };

                  } else {
                    refundInfo = {
            eligible: false,
            error: refundResult.error || "Refund processing failed",
          };
        }
      } catch (refundError) {
                logger.error("Refund processing failed:", refundError);
        refundInfo = {
          eligible: false,
          error: "Refund processing failed - please contact support",
        };
      }
    } else {
      refundInfo = {
        eligible: false,
        reason: "Payment not in valid state for refund",
      };
    }

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

    try {
      const notificationService = NotificationService.getInstance();

      const guestNotification = notificationHelpers.bookingCancelled(
        booking.guestId,
        booking.id,
        booking.property.title
      );
      await notificationService.createAndSendNotification(guestNotification);

      // Notify realtor with refund details
      let realtorMessage = `Booking for "${booking.property.title}" has been cancelled`;
      if (reason) realtorMessage += `. Reason: ${reason}`;

      if (refundInfo?.eligible && refundInfo?.totalCustomerRefund > 0) {
        realtorMessage += `. Refund automatically processed - guest receives ${refundInfo.totalCustomerRefund} ${booking.currency}, you receive ${refundInfo.totalRealtorPortion} ${booking.currency}.`;
      } else if (refundInfo?.tier === "LATE") {
        realtorMessage += `. Late cancellation - guest receives no refund, you receive 80% of payment.`;
      }

      const realtorNotification = {
        userId: booking.property.realtor.user.id,
        type: "BOOKING_CANCELLED" as const,
        title: "Booking Cancelled",
        message: realtorMessage,
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
  })
);

/**
 * @swagger
 * /api/bookings/{id}/escrow-events:
 *   get:
 *     summary: Get booking escrow events
 *     description: Get escrow event timeline for a booking
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Escrow events retrieved successfully
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Booking not found
 */
router.get(
  "/:id/escrow-events",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Verify booking exists
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: {
        id: true,
        guestId: true,
        property: { select: { realtorId: true } },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    // Authorization: Only booking guest, property realtor, or admin can view
    const user = req.user;
    if (!user) {
      throw new AppError("Unauthorized", 401);
    }

    const isAuthorized =
      user.id === booking.guestId ||
      user.id === booking.property?.realtorId ||
      user.role === "ADMIN";

    if (!isAuthorized) {
      throw new AppError(
        "You do not have permission to view this booking escrow events",
        403
      );
    }

    // Fetch escrow events
    const events = await prisma.escrowEvent.findMany({
      where: { bookingId: id },
      orderBy: { executedAt: "desc" },
      select: {
        id: true,
        bookingId: true,
        eventType: true,
        amount: true,
        currency: true,
        fromParty: true,
        toParty: true,
        executedAt: true,
        transactionReference: true,
        providerResponse: true,
        notes: true,
        triggeredBy: true,
      },
    });

    logger.info("Fetched escrow events", {
      bookingId: id,
      eventCount: events.length,
      userId: user.id,
    });

    return res.json({
      success: true,
      data: events,
    });
  })
);

/**
 * @swagger
 * /api/bookings/{id}/modify:
 *   post:
 *     summary: Request booking modification
 *     description: Request to modify booking dates or guest count. Cannot modify within 48 hours of check-in.
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newCheckInDate:
 *                 type: string
 *                 format: date
 *               newCheckOutDate:
 *                 type: string
 *                 format: date
 *               newGuestCount:
 *                 type: integer
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Modification request submitted
 *       400:
 *         description: Cannot modify (too close to check-in or invalid data)
 */
router.post(
  "/:id/modify",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { newCheckInDate, newCheckOutDate, newGuestCount, reason } = req.body;
    const userId = req.user!.id;

    // Fetch booking
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    // Check if user is authorized (guest or realtor)
    if (booking.guestId !== userId && booking.property.realtorId !== userId) {
      throw new AppError("Not authorized to modify this booking", 403);
    }

    // Cannot modify within 48 hours of check-in
    const now = new Date();
    const hoursUntilCheckIn =
      (new Date(booking.checkInDate).getTime() - now.getTime()) /
      (1000 * 60 * 60);

    if (hoursUntilCheckIn < 48) {
      throw new AppError(
        "Cannot modify booking within 48 hours of check-in",
        400
      );
    }

    // Validate dates if provided
    if (newCheckInDate && newCheckOutDate) {
      const checkIn = new Date(newCheckInDate);
      const checkOut = new Date(newCheckOutDate);

      if (checkOut <= checkIn) {
        throw new AppError("Check-out must be after check-in", 400);
      }

      // Check for conflicts with other bookings
      const conflicts = await prisma.booking.findMany({
        where: {
          propertyId: booking.propertyId,
          id: { not: id },
          status: { in: ["ACTIVE"] },
          OR: [
            {
              checkInDate: { lte: checkOut },
              checkOutDate: { gte: checkIn },
            },
          ],
        },
      });

      if (conflicts.length > 0) {
        throw new AppError("New dates conflict with existing bookings", 400);
      }
    }

    // Calculate price difference if dates changed
    let priceDifference = 0;
    if (newCheckInDate && newCheckOutDate) {
      const oldNights = Math.ceil(
        (new Date(booking.checkOutDate).getTime() -
          new Date(booking.checkInDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const newNights = Math.ceil(
        (new Date(newCheckOutDate).getTime() -
          new Date(newCheckInDate).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      const nightsDifference = newNights - oldNights;
      priceDifference =
        nightsDifference * Number(booking.property.pricePerNight);
    }

    // Create notification for the other party
    const recipientId =
      userId === booking.guestId ? booking.property.realtorId : booking.guestId;

    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: "BOOKING_REMINDER",
        title: "Booking Modification Request",
        message: `Modification requested for booking #${booking.id.slice(
          -6
        )}: ${reason || "No reason provided"}`,
        bookingId: id,
        priority: "high",
        isRead: false,
        data: {
          bookingId: id,
          requestedBy: userId,
          newCheckInDate,
          newCheckOutDate,
          newGuestCount,
          priceDifference,
        },
      },
    });

    // Log modification request
    await prisma.auditLog.create({
      data: {
        action: "BOOKING_MODIFICATION_REQUESTED",
        userId,
        entityId: id,
        entityType: "Booking",
        details: {
          oldCheckIn: booking.checkInDate,
          oldCheckOut: booking.checkOutDate,
          oldGuestCount: booking.totalGuests,
          newCheckInDate,
          newCheckOutDate,
          newGuestCount,
          reason,
          priceDifference,
        },
      },
    });

    logger.info("Booking modification requested", {
      bookingId: id,
      requestedBy: userId,
      priceDifference,
    });

    return res.json({
      success: true,
      message:
        "Modification request submitted. The other party will be notified.",
      data: {
        priceDifference,
        requiresPayment: priceDifference > 0,
        refundAmount: priceDifference < 0 ? Math.abs(priceDifference) : 0,
      },
    });
  })
);

/**
 * @swagger
 * /api/bookings/{id}/modification-options:
 *   get:
 *     summary: Calculate modification costs
 *     description: Calculate price difference for potential booking modifications
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: newCheckIn
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: newCheckOut
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Cost calculation retrieved
 */
router.get(
  "/:id/modification-options",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { newCheckIn, newCheckOut } = req.query;
    const userId = req.user!.id;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (booking.guestId !== userId && booking.property.realtorId !== userId) {
      throw new AppError("Not authorized", 403);
    }

    if (!newCheckIn || !newCheckOut) {
      throw new AppError("New check-in and check-out dates required", 400);
    }

    // Calculate old and new costs
    const oldNights = Math.ceil(
      (new Date(booking.checkOutDate).getTime() -
        new Date(booking.checkInDate).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const newNights = Math.ceil(
      (new Date(newCheckOut as string).getTime() -
        new Date(newCheckIn as string).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const pricePerNight = Number(booking.property.pricePerNight);
    const oldSubtotal = oldNights * pricePerNight;
    const newSubtotal = newNights * pricePerNight;
    const difference = newSubtotal - oldSubtotal;

    return res.json({
      success: true,
      data: {
        oldNights,
        newNights,
        pricePerNight,
        oldSubtotal,
        newSubtotal,
        difference,
        requiresPayment: difference > 0,
        refundAmount: difference < 0 ? Math.abs(difference) : 0,
      },
    });
  })
);

/**
 * @swagger
 * /api/bookings/{id}/extend:
 *   post:
 *     summary: Extend booking
 *     description: Add additional nights to an existing booking
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - additionalNights
 *             properties:
 *               additionalNights:
 *                 type: integer
 *                 minimum: 1
 *     responses:
 *       200:
 *         description: Booking extended successfully
 *       400:
 *         description: Cannot extend (conflicts or invalid data)
 */
router.post(
  "/:id/extend",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { additionalNights } = req.body;
    const userId = req.user!.id;

    if (!additionalNights || additionalNights < 1) {
      throw new AppError("Invalid additional nights", 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: { property: true },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    if (booking.guestId !== userId) {
      throw new AppError("Only the guest can extend their booking", 403);
    }

    if (booking.status !== BookingStatus.ACTIVE) {
      throw new AppError(
        "Can only extend confirmed or checked-in bookings",
        400
      );
    }

    // Calculate new check-out date
    const newCheckOut = new Date(booking.checkOutDate);
    newCheckOut.setDate(newCheckOut.getDate() + additionalNights);

    // Check for conflicts
    const conflicts = await prisma.booking.findMany({
      where: {
        propertyId: booking.propertyId,
        id: { not: id },
        status: { in: ["ACTIVE"] },
        checkInDate: {
          lt: newCheckOut,
          gte: booking.checkOutDate,
        },
      },
    });

    if (conflicts.length > 0) {
      throw new AppError(
        "Cannot extend: Property is booked for the requested dates",
        400
      );
    }

    // Calculate additional cost
    const additionalCost =
      additionalNights * Number(booking.property.pricePerNight);
    const serviceFee = additionalCost * 0.02; // 2% guest service fee
    const totalAdditionalCost = additionalCost + serviceFee;

    // Here you would integrate with payment to charge the additional amount
    // For now, we'll just update the booking

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        checkOutDate: newCheckOut,
        totalPrice: {
          increment: totalAdditionalCost,
        },
      },
    });

    // Notify realtor
    await prisma.notification.create({
      data: {
        userId: booking.property.realtorId,
        type: "BOOKING_CONFIRMED",
        title: "Booking Extended",
        message: `Guest extended booking #${booking.id.slice(
          -6
        )} by ${additionalNights} night(s)`,
        bookingId: id,
        priority: "normal",
        isRead: false,
        data: {
          bookingId: id,
          additionalNights,
          additionalCost: totalAdditionalCost,
          newCheckOut,
        },
      },
    });

    // Log extension
    await prisma.auditLog.create({
      data: {
        action: "BOOKING_EXTENDED",
        userId,
        entityId: id,
        entityType: "Booking",
        details: {
          additionalNights,
          oldCheckOut: booking.checkOutDate,
          newCheckOut,
          additionalCost: totalAdditionalCost,
        },
      },
    });

    logger.info("Booking extended", {
      bookingId: id,
      additionalNights,
      newCheckOut,
    });

    return res.json({
      success: true,
      message: `Booking extended by ${additionalNights} night(s)`,
      data: {
        newCheckOutDate: newCheckOut,
        additionalCost: totalAdditionalCost,
        booking: updatedBooking,
      },
    });
  })
);

/**
 * @swagger
 * /api/bookings/properties/{propertyId}/calendar:
 *   get:
 *     summary: Get property availability calendar
 *     description: Returns availability calendar for a property, optionally in iCal format
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, ical]
 *           default: json
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Number of months to show (max 12)
 *     responses:
 *       200:
 *         description: Calendar retrieved
 */
router.get(
  "/properties/:propertyId/calendar",
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { propertyId } = req.params;
    const { format = "json", months = "6" } = req.query;
    const monthsNum = Math.min(parseInt(months as string) || 6, 12);

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    // Get all bookings for the next X months
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + monthsNum);

    const bookings = await prisma.booking.findMany({
      where: {
        propertyId,
        status: { in: ["ACTIVE"] },
        checkOutDate: { gte: startDate },
        checkInDate: { lte: endDate },
      },
      select: {
        checkInDate: true,
        checkOutDate: true,
        status: true,
      },
    });

    if (format === "ical") {
      // Generate iCal format
      let ical = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Stayza//Booking Calendar//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
      ];

      bookings.forEach((booking, index) => {
        const checkIn = new Date(booking.checkInDate);
        const checkOut = new Date(booking.checkOutDate);

        ical.push(
          "BEGIN:VEVENT",
          `UID:booking-${index}@stayza.com`,
          `DTSTART:${
            checkIn.toISOString().replace(/[-:]/g, "").split(".")[0]
          }Z`,
          `DTEND:${checkOut.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`,
          `SUMMARY:Booked`,
          `STATUS:${booking.status === "ACTIVE" ? "ACTIVE" : "TENTATIVE"}`,
          "END:VEVENT"
        );
      });

      ical.push("END:VCALENDAR");

      res.setHeader("Content-Type", "text/calendar");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${propertyId}-calendar.ics"`
      );
      return res.send(ical.join("\r\n"));
    }

    // JSON format - create date array
    const calendar: {
      date: string;
      available: boolean;
      status?: string;
    }[] = [];

    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];

      const booking = bookings.find((b) => {
        const checkIn = new Date(b.checkInDate);
        const checkOut = new Date(b.checkOutDate);
        return currentDate >= checkIn && currentDate < checkOut;
      });

      calendar.push({
        date: dateStr,
        available: !booking,
        status: booking?.status,
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return res.json({
      success: true,
      data: {
        propertyId,
        propertyName: property.title,
        calendar,
      },
    });
  })
);

/**
 * @swagger
 * /api/bookings/properties/{propertyId}/block-dates:
 *   post:
 *     summary: Block dates (Realtor only)
 *     description: Manually block dates to prevent bookings (e.g., maintenance, personal use)
 *     tags: [Bookings]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: propertyId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startDate
 *               - endDate
 *               - reason
 *             properties:
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dates blocked successfully
 *       400:
 *         description: Cannot block (existing bookings)
 *       403:
 *         description: Only property owner can block dates
 */
router.post(
  "/properties/:propertyId/block-dates",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { propertyId } = req.params;
    const { startDate, endDate, reason } = req.body;
    const userId = req.user!.id;

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    if (property.realtorId !== userId) {
      throw new AppError("Only property owner can block dates", 403);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      throw new AppError("End date must be after start date", 400);
    }

    // Check for existing bookings
    const conflicts = await prisma.booking.findMany({
      where: {
        propertyId,
        status: { in: ["ACTIVE"] },
        OR: [
          {
            checkInDate: { lte: end },
            checkOutDate: { gte: start },
          },
        ],
      },
    });

    if (conflicts.length > 0) {
      throw new AppError(
        "Cannot block dates: There are existing bookings during this period",
        400
      );
    }

    // Create a "blocked" booking (we'll use a special guestId or flag)
    // For now, we'll create an audit log entry
    await prisma.auditLog.create({
      data: {
        action: "DATES_BLOCKED",
        userId,
        entityId: propertyId,
        entityType: "Property",
        details: {
          startDate,
          endDate,
          reason,
        },
      },
    });

    logger.info("Dates blocked", {
      propertyId,
      startDate,
      endDate,
      reason,
    });

    return res.json({
      success: true,
      message: "Dates blocked successfully",
      data: {
        startDate,
        endDate,
        reason,
      },
    });
  })
);

/**
 * @swagger
 * /api/bookings/:id/confirm-checkin:
 *   post:
 *     summary: Confirm check-in (guest or realtor)
 *     description: Confirm guest has checked into the property. Starts 1-hour dispute window.
 *     tags: [Bookings]
 */
router.post(
  "/:id/confirm-checkin",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: bookingId } = req.params;
    const userId = req.user!.id;
    const userRole = req.user!.role;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        guest: true,
        property: {
          include: {
            realtor: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    // Determine confirmation type based on who is confirming
    let confirmationType: "GUEST_CONFIRMED" | "REALTOR_CONFIRMED";

    if (userId === booking.guestId) {
      // Guest confirming
      confirmationType = "GUEST_CONFIRMED";
    } else if (
      userRole === "REALTOR" &&
      booking.property.realtor.userId === userId
    ) {
      // Realtor confirming
      confirmationType = "REALTOR_CONFIRMED";
    } else {
      throw new AppError(
        "Unauthorized to confirm check-in for this booking",
        403
      );
    }

    const checkinService = await import("@/services/checkinService");
    const result = await checkinService.default.confirmCheckIn(
      bookingId,
      confirmationType,
      userId
    );

    logger.info("Check-in confirmed", {
      bookingId,
      confirmationType,
      userId,
    });

    return res.json({
      success: true,
      message: `Check-in confirmed via ${confirmationType}`,
      data: {
        bookingId: result.bookingId,
        checkinConfirmedAt: result.checkinConfirmedAt,
        confirmationType: result.confirmationType,
        disputeWindowClosesAt: result.disputeWindowClosesAt,
        roomFeeReleaseEligibleAt: result.roomFeeReleaseEligibleAt,
        disputeWindowDuration: "1 hour",
      },
    });
  })
);

/**
 * @swagger
 * /api/bookings/:id/checkout:
 *   post:
 *     summary: Checkout from property
 *     description: Mark guest as checked out. Starts 4-hour realtor dispute window.
 *     tags: [Bookings]
 */
router.post(
  "/:id/checkout",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: bookingId } = req.params;
    const userId = req.user!.id;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        guest: true,
        payment: true,
        property: {
          include: {
            realtor: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    // Only guest can check out
    if (userId !== booking.guestId) {
      throw new AppError("Only the guest can initiate checkout", 403);
    }

    // Check if already checked in
    if (booking.stayStatus !== "CHECKED_IN") {
      throw new AppError(
        `Cannot checkout. Must be checked in first. Current stayStatus: ${booking.stayStatus}`,
        400
      );
    }

    // Check if already checked out
    if (booking.checkOutTime) {
      throw new AppError("Already checked out", 400);
    }

    const now = new Date();
    const realtorDisputeClosesAt = new Date(now.getTime() + 4 * 60 * 60 * 1000); // +4 hours

    // Update booking to checked out
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: "ACTIVE", // BookingStatus stays ACTIVE until deposit released
        stayStatus: "CHECKED_OUT", // StayStatus changes to CHECKED_OUT
        checkOutTime: now,
        depositRefundEligibleAt: realtorDisputeClosesAt,
        realtorDisputeClosesAt,
      },
    });

    // Log escrow event
    await escrowService.logEscrowEvent({
      bookingId,
      eventType: "HOLD_SECURITY_DEPOSIT",
      amount: booking.securityDeposit,
      description: `Guest checked out. Deposit refund eligible at ${realtorDisputeClosesAt.toISOString()}`,
      metadata: {
        checkOutTime: now.toISOString(),
        realtorDisputeClosesAt: realtorDisputeClosesAt.toISOString(),
      },
    });

    // Send notifications
    try {
      // Notify guest
      await prisma.notification.create({
        data: {
          userId: booking.guestId,
          type: "BOOKING_CONFIRMED",
          title: "Checkout Confirmed",
          message: `Your security deposit will be refunded in 4 hours if no damages are reported by the realtor.`,
          bookingId: bookingId,
          priority: "medium",
          isRead: false,
        },
      });

      // Notify realtor
      await prisma.notification.create({
        data: {
          userId: booking.property.realtor.userId,
          type: "BOOKING_REMINDER",
          title: "Guest Checked Out",
          message: `Guest has checked out. You have 4 hours to report any damages with photo evidence.`,
          bookingId: bookingId,
          priority: "high",
          isRead: false,
        },
      });
    } catch (notificationError) {
      logger.error("Failed to send checkout notifications:", notificationError);
    }

    logger.info("Guest checked out", {
      bookingId,
      userId,
      checkOutTime: now,
    });

    return res.json({
      success: true,
      message: "Checkout successful",
      data: {
        bookingId,
        checkOutTime: now,
        depositRefundEligibleAt: realtorDisputeClosesAt,
        realtorDisputeWindowDuration: "4 hours",
        depositAmount: booking.securityDeposit,
      },
    });
  })
);

/**
 * @swagger
 * /api/bookings/:id/dispute-windows:
 *   get:
 *     summary: Get active dispute windows
 *     description: Returns information about guest and realtor dispute windows for a booking
 *     tags: [Bookings]
 */
router.get(
  "/:id/dispute-windows",
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id: bookingId } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        status: true,
        checkinConfirmedAt: true,
        disputeWindowClosesAt: true,
        userDisputeOpened: true,
        checkOutTime: true,
        realtorDisputeClosesAt: true,
        realtorDisputeOpened: true,
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    const now = new Date();

    const guestDisputeWindow = booking.disputeWindowClosesAt
      ? {
          deadline: booking.disputeWindowClosesAt,
          expired: now >= booking.disputeWindowClosesAt,
          opened: booking.userDisputeOpened,
          canOpen:
            !booking.userDisputeOpened && now < booking.disputeWindowClosesAt,
        }
      : null;

    const realtorDisputeWindow = booking.realtorDisputeClosesAt
      ? {
          deadline: booking.realtorDisputeClosesAt,
          expired: now >= booking.realtorDisputeClosesAt,
          opened: booking.realtorDisputeOpened,
          canOpen:
            !booking.realtorDisputeOpened &&
            now < booking.realtorDisputeClosesAt,
        }
      : null;

    return res.json({
      success: true,
      data: {
        bookingId,
        status: booking.status,
        guestDisputeWindow,
        realtorDisputeWindow,
      },
    });
  })
);

export default router;
