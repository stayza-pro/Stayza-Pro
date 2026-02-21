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
import { processAutomaticCancellationRefund } from "@/services/cancellationRefund";
import { paystackService } from "@/services/paystack";
import { sendBookingCancellation } from "@/services/email";
import { auditLogger } from "@/services/auditLogger";
import {
  safeTransitionBookingStatus,
  canCancelBooking,
} from "@/services/bookingStatus";
import {
  NotificationService,
  notificationHelpers,
} from "@/services/notificationService";
import escrowService from "@/services/escrowService";
import {
  applyGuestBookingAccessControl,
  isBookingPaymentConfirmed,
  buildBookingVerificationCode,
  isBlockedDatesSpecialRequest,
  buildBlockedDatesSpecialRequest,
} from "@/services/bookingAccessControl";
import { loadFinanceConfig } from "@/services/financeConfig";
import {
  computeGuestServiceFee,
  getCurrentLagosMonthBounds,
  quoteBooking,
} from "@/services/pricingEngine";
import { logger } from "@/utils/logger";
import { authenticate, authorize } from "@/middleware/auth";
import { bookingLimiter } from "@/middleware/rateLimiter";
import { config } from "@/config";

const router = express.Router();

const CONFIRMED_PAYMENT_STATUSES: PaymentStatus[] = [
  PaymentStatus.HELD,
  PaymentStatus.PARTIALLY_RELEASED,
  PaymentStatus.SETTLED,
];

const BOOKING_PAYMENT_TIMEOUT_MS =
  config.BOOKING_PAYMENT_TIMEOUT_MINUTES * 60 * 1000;

const buildSnapshotDateTime = (
  baseDate: Date,
  propertyTime: string | null | undefined,
  fallbackHour: number,
  fallbackMinute: number,
): Date => {
  const snapshot = new Date(baseDate);
  snapshot.setHours(fallbackHour, fallbackMinute, 0, 0);

  if (!propertyTime) {
    return snapshot;
  }

  const normalized = propertyTime.trim();
  const matched = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (!matched) {
    return snapshot;
  }

  const hour = Number(matched[1]);
  const minute = Number(matched[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return snapshot;
  }
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return snapshot;
  }

  snapshot.setHours(hour, minute, 0, 0);
  return snapshot;
};

const getStaleUnpaidBookingFilter = (): Prisma.BookingWhereInput => {
  const paymentUnpaidOrFailed: Prisma.BookingWhereInput["OR"] = [
    { payment: { is: null } },
    {
      payment: {
        is: {
          paidAt: null,
          status: {
            in: [PaymentStatus.INITIATED, PaymentStatus.FAILED],
          },
        },
      },
    },
  ];

  return {
    NOT: {
      OR: [
        {
          status: BookingStatus.PENDING,
          createdAt: {
            lt: new Date(Date.now() - BOOKING_PAYMENT_TIMEOUT_MS),
          },
          OR: paymentUnpaidOrFailed,
        },
        {
          status: BookingStatus.CANCELLED,
          OR: paymentUnpaidOrFailed,
        },
        {
          status: BookingStatus.EXPIRED,
        },
      ],
    },
  };
};

const getMonthlyConfirmedRoomFeeVolume = async (
  realtorId: string,
  db: Pick<typeof prisma, "booking"> = prisma,
): Promise<number> => {
  const { start, end } = getCurrentLagosMonthBounds();

  const aggregate = await db.booking.aggregate({
    _sum: {
      roomFee: true,
    },
    where: {
      property: {
        realtorId,
      },
      status: {
        in: [
          BookingStatus.ACTIVE,
          BookingStatus.COMPLETED,
          BookingStatus.DISPUTED,
        ],
      },
      payment: {
        status: {
          in: CONFIRMED_PAYMENT_STATUSES,
        },
        paidAt: {
          gte: start,
          lt: end,
        },
      },
    },
  });

  return Number(aggregate._sum.roomFee || 0);
};

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
    const { propertyId, checkInDate, checkOutDate } = req.body;

    if (!propertyId || !checkInDate || !checkOutDate) {
      throw new AppError(
        "Property ID, check-in date, and check-out date are required",
        400,
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
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
    );
    const financeConfig = await loadFinanceConfig();
    const monthlyVolume = await getMonthlyConfirmedRoomFeeVolume(
      property.realtorId,
    );
    const quote = quoteBooking(
      {
        pricePerNight: Number(property.pricePerNight),
        numberOfNights: nights,
        cleaningFee: property.cleaningFee ? Number(property.cleaningFee) : 0,
        securityDeposit: property.securityDeposit
          ? Number(property.securityDeposit)
          : 0,
        monthlyVolume,
        paystackMode: "LOCAL",
      },
      financeConfig,
    );

    res.json({
      success: true,
      message: "Booking calculation successful",
      data: {
        roomFee: quote.roomFee,
        cleaningFee: quote.cleaningFee,
        serviceFee: quote.serviceFee,
        securityDeposit: quote.securityDeposit,
        subtotal: quote.roomFee,
        taxes: 0, // No taxes in current implementation
        fees: quote.serviceFee,
        total: quote.totalPayable,
        currency: property.currency,
        nights,
        serviceFeeBreakdown: quote.serviceFeeBreakdown,
        realtorPreview: {
          baseRate: quote.commissionSnapshot.baseRate,
          volumeReduction: quote.commissionSnapshot.volumeReductionRate,
          effectiveRate: quote.commissionSnapshot.effectiveRate,
          commissionAmount: quote.commissionSnapshot.commissionAmount,
          estimatedNetPayout: quote.estimatedNetPayout,
        },
        monthlyVolumeProgress: quote.monthlyVolumeProgress,
        breakdown: {
          pricePerNight: Number(Number(property.pricePerNight).toFixed(2)),
          roomFee: quote.roomFee,
          cleaningFee: quote.cleaningFee,
          serviceFee: quote.serviceFee,
          securityDeposit: quote.securityDeposit,
          platformFee: quote.platformFee,
          serviceFeeStayza: quote.serviceFeeBreakdown.stayza,
          serviceFeeProcessing: quote.serviceFeeBreakdown.processing,
          cleaningFeeImmediate: quote.cleaningFee,
          serviceFeeToPlatform: quote.serviceFee,
          roomFeeSplitRealtor: quote.commissionSnapshot.realtorRoomPayout,
          roomFeeSplitPlatform: quote.commissionSnapshot.commissionAmount,
          totalRealtorEarnings: quote.estimatedNetPayout,
          commissionBaseRate: quote.commissionSnapshot.baseRate,
          commissionEffectiveRate: quote.commissionSnapshot.effectiveRate,
          serviceFeeMode: quote.serviceFeeBreakdown.processingMode,
        },
      },
    });
  }),
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

    const unavailableDates: string[] = [];

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
  }),
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
            userId: true,
          },
        },
      },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    if (property.realtor.userId === req.user!.id) {
      throw new AppError("You cannot book your own property", 400);
    }

    if (totalGuests > property.maxGuests) {
      throw new AppError(
        `Property can accommodate maximum ${property.maxGuests} guests`,
        400,
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

    const financeConfig = await loadFinanceConfig();
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

      const unavailableDates: string[] = [];

      if (unavailableDates.length > 0) {
        throw new AppError("Property is not available for selected dates", 400);
      }

      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
      );

      const pricePerNight = Number(property.pricePerNight);

      const cleaningFee = property.cleaningFee
        ? Number(property.cleaningFee)
        : 0;
      const securityDeposit = property.securityDeposit
        ? Number(property.securityDeposit)
        : 0;
      const monthlyVolume = await getMonthlyConfirmedRoomFeeVolume(
        property.realtor.id,
        tx,
      );
      const quote = quoteBooking(
        {
          pricePerNight,
          numberOfNights: nights,
          cleaningFee,
          securityDeposit,
          monthlyVolume,
          paystackMode: "LOCAL",
        },
        financeConfig,
      );
      const totalPrice = quote.totalPayable;

      const refundCutoffTime = new Date(checkIn);
      refundCutoffTime.setHours(refundCutoffTime.getHours() - 24);

      const payoutEligibleAt = new Date(checkIn);
      const checkInAtSnapshot = buildSnapshotDateTime(
        checkIn,
        property.checkInTime,
        14,
        0,
      );
      const checkOutAtSnapshot = buildSnapshotDateTime(
        checkOut,
        property.checkOutTime,
        11,
        0,
      );

      const booking = await tx.booking.create({
        data: {
          checkInDate: checkIn,
          checkOutDate: checkOut,
          checkInAtSnapshot,
          checkOutAtSnapshot,
          totalGuests,
          totalPrice: new Prisma.Decimal(totalPrice.toFixed(2)),
          currency: property.currency,
          specialRequests: specialRequests || "",
          refundCutoffTime,
          payoutEligibleAt,
          payoutStatus: "PENDING",
          roomFee: new Prisma.Decimal(quote.roomFee),
          cleaningFee: new Prisma.Decimal(quote.cleaningFee),
          securityDeposit: new Prisma.Decimal(quote.securityDeposit),
          serviceFee: new Prisma.Decimal(quote.serviceFee),
          platformFee: new Prisma.Decimal(quote.platformFee),
          commissionBaseRate: new Prisma.Decimal(
            quote.commissionSnapshot.baseRate,
          ),
          commissionVolumeReductionRate: new Prisma.Decimal(
            quote.commissionSnapshot.volumeReductionRate,
          ),
          commissionEffectiveRate: new Prisma.Decimal(
            quote.commissionSnapshot.effectiveRate,
          ),
          monthlyVolumeAtPricing: new Prisma.Decimal(monthlyVolume),
          serviceFeeStayza: new Prisma.Decimal(
            quote.serviceFeeBreakdown.stayza,
          ),
          serviceFeeProcessing: new Prisma.Decimal(
            quote.serviceFeeBreakdown.processing,
          ),
          processingFeeMode: quote.serviceFeeBreakdown.processingMode,
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
        message: `Your booking for "${result.property.title}" is awaiting payment confirmation.`,
        bookingId: result.id,
        priority: "normal" as const,
      };

      await notificationService.createAndSendNotification(guestNotification);

      const realtorNotification = {
        userId: result.property.realtor.userId,
        type: "BOOKING_CONFIRMED" as const,
        title: "New Booking Pending Payment",
        message: `${req.user!.firstName || "A guest"} has requested to book "${
          result.property.title
        }" and is completing payment.`,
        bookingId: result.id,
        priority: "high" as const,
      };

      await notificationService.createAndSendNotification(realtorNotification);
    } catch (notificationError) {
      logger.error(
        "Failed to send booking creation notifications:",
        notificationError,
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
  }),
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

    const where: Prisma.BookingWhereInput = {
      guestId: req.user!.id,
      ...getStaleUnpaidBookingFilter(),
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
              checkInTime: true,
              checkOutTime: true,
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

    const bookingsWithAccessControl = bookings.map((booking) =>
      applyGuestBookingAccessControl(booking as Record<string, unknown>, true),
    );

    res.json({
      success: true,
      message: "Your bookings retrieved successfully",
      data: bookingsWithAccessControl,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  }),
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

    const where: Prisma.BookingWhereInput = {
      property: {
        realtorId: realtor.id,
      },
      ...getStaleUnpaidBookingFilter(),
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
  }),
);

router.get(
  "/verify-artifact/:code",
  authenticate,
  authorize("REALTOR", "ADMIN"),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { code } = req.params;

    if (!code || !code.startsWith("STZ-")) {
      throw new AppError("Invalid verification code", 400);
    }

    const bookingId = code.slice(4);
    if (!bookingId) {
      throw new AppError("Invalid verification code", 400);
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: {
          select: {
            status: true,
          },
        },
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            state: true,
            realtor: {
              select: {
                userId: true,
              },
            },
          },
        },
        guest: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found for this verification code", 404);
    }

    const isAdmin = req.user!.role === "ADMIN";
    const isAssignedRealtor = booking.property.realtor.userId === req.user!.id;
    if (!isAdmin && !isAssignedRealtor) {
      throw new AppError("Not authorized to verify this booking", 403);
    }

    const paymentVerified = isBookingPaymentConfirmed(
      booking.payment?.status ?? null,
      booking.paymentStatus ?? null,
    );

    return res.json({
      success: true,
      message: paymentVerified
        ? "Booking artifact verified"
        : "Booking found but payment is not yet verified",
      data: {
        verified: paymentVerified,
        code: buildBookingVerificationCode(booking.id),
        booking: {
          id: booking.id,
          status: booking.status,
          paymentStatus: booking.paymentStatus,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          guestName: `${booking.guest.firstName || ""} ${
            booking.guest.lastName || ""
          }`.trim(),
          property: {
            id: booking.property.id,
            title: booking.property.title,
            city: booking.property.city,
            state: booking.property.state,
          },
        },
      },
    });
  }),
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
                userId: true,
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
    const isHost = booking.property.realtor.userId === req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";

    if (!isOwner && !isHost && !isAdmin) {
      throw new AppError("Not authorized to view this booking", 403);
    }

    const isGuestOwner = isOwner && req.user!.role === "GUEST";
    const bookingWithAccessControl = applyGuestBookingAccessControl(
      booking as Record<string, unknown>,
      isGuestOwner,
    );

    res.json({
      success: true,
      message: "Booking retrieved successfully",
      data: bookingWithAccessControl,
    });
  }),
);

/**
 * @swagger
 * /api/bookings/{id}/status:
 *   put:
 *     summary: Disabled endpoint (manual status update)
 *     description: Manual status updates are disabled. Booking state is system-managed.
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
    throw new AppError(
      "Manual booking status updates are disabled. Booking state is now managed automatically by payment, check-in/check-out, and dispute workflows.",
      410,
    );
    const { id } = req.params;
    const { status } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        payment: {
          select: {
            status: true,
          },
        },
        property: {
          select: {
            realtor: {
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new AppError("Booking not found", 404);
    }

    const isHost = booking.property.realtor.userId === req.user!.id;
    const isAdmin = req.user!.role === "ADMIN";

    if (!isHost && !isAdmin) {
      throw new AppError("Not authorized to update this booking", 403);
    }

    if (status === BookingStatus.ACTIVE && !isAdmin) {
      const paymentConfirmed = isBookingPaymentConfirmed(
        booking.payment?.status ?? null,
        booking.paymentStatus ?? null,
      );
      const isBlockedDatesBooking = isBlockedDatesSpecialRequest(
        booking.specialRequests,
      );

      if (!paymentConfirmed && !isBlockedDatesBooking) {
        throw new AppError(
          "Booking can only be activated after successful payment verification",
          400,
        );
      }
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
          updatedBooking.property.title,
        );
      } else if (status === BookingStatus.CANCELLED) {
        notification = notificationHelpers.bookingCancelled(
          updatedBooking.guestId,
          updatedBooking.id,
          updatedBooking.property.title,
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
        notificationError,
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
  }),
);

/**
 * @swagger
 * /api/bookings/{id}/cancel-preview:
 *   get:
 *     summary: Preview cancellation refund amount
 *     description: Get refund breakdown before confirming guest cancellation
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

    if (!isGuest) {
      throw new AppError(
        "Only the booking guest can preview cancellation for this booking",
        403,
      );
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

    let tierPercentages = { customer: 90, realtor: 7, platform: 3 };
    let warning = null;

    if (refundCalc.tier !== "EARLY") {
      warning = "❌ Cancellation not allowed within 24 hours of check-in.";
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
  }),
);

/**
 * @swagger
 * /api/bookings/{id}/cancel:
 *   put:
 *     summary: Cancel booking
 *     description: Cancel booking with refund processing (guest owner only)
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

    if (!isOwner) {
      throw new AppError("Only the booking guest can cancel this booking", 403);
    }

    const cancellationCheck = await canCancelBooking(id);
    if (!cancellationCheck.canCancel) {
      throw new AppError(
        cancellationCheck.reason || "Booking cannot be cancelled at this time",
        400,
      );
    }

    const transitionResult = await safeTransitionBookingStatus(
      id,
      BookingStatus.CANCELLED,
      {
        userId: req.user!.id,
        reason: reason || "Booking cancelled by user",
      },
    );

    if (!transitionResult.success) {
      throw new AppError(
        transitionResult.error || "Failed to cancel booking",
        400,
      );
    }

    let refundInfo: {
      amount?: number;
      eligible?: boolean;
      totalCustomerRefund?: number;
      totalRealtorPortion?: number;
      tier?: string;
      [key: string]: unknown;
    } | null = null;

    // Process automatic cancellation refund based on tier
    if (
      booking.payment?.status === PaymentStatus.HELD ||
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
        refundInfo?.amount,
      );
    } catch (emailError) {
      logger.error("Failed to send cancellation email:", emailError);
    }

    try {
      const notificationService = NotificationService.getInstance();

      const guestNotification = notificationHelpers.bookingCancelled(
        booking.guestId,
        booking.id,
        booking.property.title,
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
        notificationError,
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
          cancelledBy: "guest",
          cancelledAt: new Date(),
          refundEligible: cancellationCheck.refundEligible,
        },
      },
    });
  }),
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
        property: {
          select: {
            realtor: {
              select: {
                userId: true,
              },
            },
          },
        },
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
      user.id === booking.property?.realtor.userId ||
      user.role === "ADMIN";

    if (!isAuthorized) {
      throw new AppError(
        "You do not have permission to view this booking escrow events",
        403,
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
  }),
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
    return res.status(410).json({
      success: false,
      message:
        "Booking modification is no longer available. Use Book Again to rebook with new dates.",
      error: {
        code: "BOOKING_MODIFICATION_DISABLED",
      },
    });
  }),
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
    return res.status(410).json({
      success: false,
      message:
        "Booking modification options are no longer available. Use Book Again to rebook with new dates.",
      error: {
        code: "BOOKING_MODIFICATION_DISABLED",
      },
    });
  }),
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
    return res.status(400).json({
      success: false,
      message:
        "Stay extension is disabled. To stay longer, create a new booking.",
    });

    const { id } = req.params;
    const parsedAdditionalNights = Number(req.body?.additionalNights);
    const userId = req.user!.id;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        property: {
          include: {
            realtor: {
              select: {
                userId: true,
              },
            },
          },
        },
        guest: {
          select: {
            email: true,
          },
        },
        payment: {
          select: {
            id: true,
            status: true,
            method: true,
            roomFeeInEscrow: true,
            amount: true,
            commissionEffectiveRate: true,
            serviceFeeStayzaAmount: true,
            serviceFeeProcessingQuotedAmount: true,
            metadata: true,
          },
        },
        escrow: {
          select: {
            id: true,
          },
        },
      },
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
        400,
      );
    }

    if (!booking.payment) {
      throw new AppError("No payment found for this booking", 400);
    }

    if (booking.payment.method !== PaymentMethod.PAYSTACK) {
      throw new AppError(
        "Only Paystack extensions are currently supported",
        400,
      );
    }

    if (
      booking.payment.status !== PaymentStatus.HELD ||
      !booking.payment.roomFeeInEscrow
    ) {
      throw new AppError(
        "Booking extension is only available while payment is held in escrow",
        400,
      );
    }

    // Calculate new check-out date
    const newCheckOut = new Date(booking.checkOutDate);
    newCheckOut.setDate(newCheckOut.getDate() + parsedAdditionalNights);

    // Check for conflicts
    const conflicts = await prisma.booking.findMany({
      where: {
        propertyId: booking.propertyId,
        id: { not: id },
        status: { in: ["ACTIVE", "PENDING"] },
        AND: [
          {
            checkInDate: {
              lt: newCheckOut,
            },
          },
          {
            checkOutDate: {
              gt: booking.checkOutDate,
            },
          },
        ],
      },
    });

    if (conflicts.length > 0) {
      throw new AppError(
        "Cannot extend: Property is booked for the requested dates",
        400,
      );
    }

    const additionalRoomFee =
      parsedAdditionalNights * Number(booking.property.pricePerNight);
    const financeConfig = await loadFinanceConfig();
    const serviceFeeBreakdown = computeGuestServiceFee(
      additionalRoomFee,
      "LOCAL",
      financeConfig,
      "QUOTED",
    );
    const additionalServiceFee = Number(serviceFeeBreakdown.total.toFixed(2));
    const effectiveRate = Number(
      booking.commissionEffectiveRate ??
        booking.payment?.commissionEffectiveRate ??
        0.1,
    );
    const additionalPlatformFee = Number(
      (additionalRoomFee * effectiveRate).toFixed(2),
    );
    const totalAdditionalCost = Number(
      (additionalRoomFee + additionalServiceFee).toFixed(2),
    );

    const paymentMetadata =
      booking.payment.metadata &&
      typeof booking.payment.metadata === "object" &&
      !Array.isArray(booking.payment.metadata)
        ? (booking.payment.metadata as Record<string, unknown>)
        : {};
    const providerResponse =
      paymentMetadata.providerResponse &&
      typeof paymentMetadata.providerResponse === "object" &&
      !Array.isArray(paymentMetadata.providerResponse)
        ? (paymentMetadata.providerResponse as Record<string, unknown>)
        : {};
    const authorizationData =
      providerResponse.authorization &&
      typeof providerResponse.authorization === "object" &&
      !Array.isArray(providerResponse.authorization)
        ? (providerResponse.authorization as Record<string, unknown>)
        : {};
    const authorizationCode: string | undefined =
      (typeof authorizationData.authorization_code === "string"
        ? String(authorizationData.authorization_code)
        : undefined) ||
      (typeof paymentMetadata.authorizationCode === "string"
        ? String(paymentMetadata.authorizationCode)
        : undefined);

    if (!authorizationCode || typeof authorizationCode !== "string") {
      throw new AppError(
        "Unable to charge extension automatically for this booking",
        400,
      );
    }

    const extensionReference = `EXT-${booking.id.slice(-6)}-${Date.now()}`;
    const chargeResult = await paystackService.chargeAuthorization({
      authorizationCode,
      email: booking.guest.email,
      amount: Math.round(totalAdditionalCost * 100), // Paystack expects kobo
      reference: extensionReference,
      metadata: {
        bookingId: id,
        additionalNights: parsedAdditionalNights,
        additionalRoomFee,
        additionalServiceFee,
      },
    });

    const chargeData = chargeResult?.data || {};
    const paymentSuccessful =
      chargeResult?.status === true && chargeData?.status === "success";

    if (!paymentSuccessful) {
      throw new AppError(
        `Extension payment failed: ${
          chargeResult?.message ||
          chargeData?.gateway_response ||
          "unknown error"
        }`,
        400,
      );
    }

    const extensionChargeEntry = {
      reference: extensionReference,
      amount: totalAdditionalCost,
      roomFee: additionalRoomFee,
      serviceFee: additionalServiceFee,
      serviceFeeStayza: serviceFeeBreakdown.stayza,
      serviceFeeProcessing: serviceFeeBreakdown.processing,
      serviceFeeProcessingMode: serviceFeeBreakdown.processingMode,
      platformFee: additionalPlatformFee,
      additionalNights: parsedAdditionalNights,
      chargedAt: new Date().toISOString(),
      providerId: chargeData?.id?.toString?.() || null,
    };

    const existingExtensionCharges: Array<Record<string, unknown>> =
      Array.isArray(paymentMetadata.extensionCharges)
        ? (paymentMetadata.extensionCharges as Array<Record<string, unknown>>)
        : [];

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const bookingUpdate = await tx.booking.update({
        where: { id },
        data: {
          checkOutDate: newCheckOut,
          totalPrice: {
            increment: totalAdditionalCost,
          },
          roomFee: {
            increment: additionalRoomFee,
          },
          serviceFee: {
            increment: additionalServiceFee,
          },
          serviceFeeStayza: new Prisma.Decimal(
            (
              Number(booking.serviceFeeStayza || 0) + serviceFeeBreakdown.stayza
            ).toFixed(2),
          ),
          serviceFeeProcessing: new Prisma.Decimal(
            (
              Number(booking.serviceFeeProcessing || 0) +
              serviceFeeBreakdown.processing
            ).toFixed(2),
          ),
          processingFeeMode: serviceFeeBreakdown.processingMode,
          platformFee: {
            increment: additionalPlatformFee,
          },
        },
      });

      await tx.payment.update({
        where: { id: booking.payment!.id },
        data: {
          amount: {
            increment: totalAdditionalCost,
          },
          roomFeeAmount: {
            increment: additionalRoomFee,
          },
          serviceFeeAmount: {
            increment: additionalServiceFee,
          },
          serviceFeeStayzaAmount: new Prisma.Decimal(
            (
              Number(booking.payment!.serviceFeeStayzaAmount || 0) +
              serviceFeeBreakdown.stayza
            ).toFixed(2),
          ),
          serviceFeeProcessingQuotedAmount: new Prisma.Decimal(
            (
              Number(booking.payment!.serviceFeeProcessingQuotedAmount || 0) +
              serviceFeeBreakdown.processing
            ).toFixed(2),
          ),
          processingFeeModeQuoted: serviceFeeBreakdown.processingMode,
          platformFeeAmount: {
            increment: additionalPlatformFee,
          },
          metadata: {
            ...paymentMetadata,
            extensionCharges: [
              ...existingExtensionCharges,
              extensionChargeEntry,
            ],
            lastExtensionCharge: extensionChargeEntry,
          } as Prisma.InputJsonValue,
        },
      });

      if (additionalServiceFee > 0) {
        const platformWallet = await tx.wallet.upsert({
          where: {
            ownerType_ownerId: {
              ownerType: "PLATFORM",
              ownerId: "platform",
            },
          },
          update: {
            balanceAvailable: {
              increment: new Prisma.Decimal(additionalServiceFee),
            },
          },
          create: {
            ownerType: "PLATFORM",
            ownerId: "platform",
            balanceAvailable: new Prisma.Decimal(additionalServiceFee),
            balancePending: new Prisma.Decimal(0),
          },
        });

        await tx.walletTransaction.create({
          data: {
            walletId: platformWallet.id,
            type: "CREDIT",
            source: "SERVICE_FEE",
            amount: new Prisma.Decimal(additionalServiceFee),
            referenceId: id,
            status: "COMPLETED",
            metadata: {
              bookingId: id,
              paymentId: booking.payment!.id,
              extensionReference,
            },
          },
        });

        await tx.escrowEvent.create({
          data: {
            bookingId: id,
            eventType: "COLLECT_SERVICE_FEE",
            amount: new Prisma.Decimal(additionalServiceFee),
            fromParty: "CUSTOMER",
            toParty: "PLATFORM_WALLET",
            transactionReference: extensionReference,
            notes: `Service fee of ${additionalServiceFee.toFixed(
              2,
            )} collected immediately for extension (${serviceFeeBreakdown.processingMode})`,
            triggeredBy: userId,
            providerResponse: chargeData,
          },
        });
      }

      if (booking.escrow) {
        await tx.escrow.update({
          where: { bookingId: id },
          data: {
            roomFeeHeld: {
              increment: additionalRoomFee,
            },
          },
        });

        await tx.escrowEvent.create({
          data: {
            bookingId: id,
            eventType: "HOLD_ROOM_FEE",
            amount: new Prisma.Decimal(additionalRoomFee),
            fromParty: "CUSTOMER",
            toParty: "ESCROW",
            transactionReference: extensionReference,
            notes: `Additional room fee of ${additionalRoomFee.toFixed(
              2,
            )} held in escrow for extension`,
            triggeredBy: userId,
            providerResponse: chargeData,
          },
        });
      }

      return bookingUpdate;
    });

    // Notify realtor
    await prisma.notification.create({
      data: {
        userId: booking.property.realtor.userId,
        type: "BOOKING_CONFIRMED",
        title: "Booking Extended",
        message: `Guest extended booking #${booking.id.slice(
          -6,
        )} by ${parsedAdditionalNights} night(s)`,
        bookingId: id,
        priority: "normal",
        isRead: false,
        data: {
          bookingId: id,
          additionalNights: parsedAdditionalNights,
          additionalCost: totalAdditionalCost,
          paymentReference: extensionReference,
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
          additionalNights: parsedAdditionalNights,
          oldCheckOut: booking.checkOutDate,
          newCheckOut,
          additionalCost: totalAdditionalCost,
          paymentReference: extensionReference,
          providerTransactionId: chargeData?.id?.toString?.() || null,
        },
      },
    });

    logger.info("Booking extended", {
      bookingId: id,
      additionalNights: parsedAdditionalNights,
      newCheckOut,
      paymentReference: extensionReference,
    });

    return res.json({
      success: true,
      message: `Booking extended by ${parsedAdditionalNights} night(s)`,
      data: {
        newCheckOutDate: newCheckOut,
        additionalCost: totalAdditionalCost,
        paymentReference: extensionReference,
        booking: updatedBooking,
      },
    });
  }),
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
      include: {
        realtor: {
          select: {
            userId: true,
          },
        },
      },
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
      const ical = [
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
          "END:VEVENT",
        );
      });

      ical.push("END:VCALENDAR");

      res.setHeader("Content-Type", "text/calendar");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${propertyId}-calendar.ics"`,
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
  }),
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

    if (!startDate || !endDate || !reason) {
      throw new AppError("startDate, endDate, and reason are required", 400);
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        currency: true,
        realtor: {
          select: {
            userId: true,
          },
        },
      },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    if (property.realtor.userId !== userId) {
      throw new AppError("Only property owner can block dates", 403);
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const reasonText = String(reason).trim();

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new AppError("Invalid startDate or endDate", 400);
    }

    if (!reasonText) {
      throw new AppError("Reason is required", 400);
    }

    if (end <= start) {
      throw new AppError("End date must be after start date", 400);
    }

    // Check for existing bookings
    const conflicts = await prisma.booking.findMany({
      where: {
        propertyId,
        status: { in: ["ACTIVE", "PENDING"] },
        AND: [
          {
            checkInDate: { lt: end },
          },
          {
            checkOutDate: { gt: start },
          },
        ],
      },
    });

    if (conflicts.length > 0) {
      throw new AppError(
        "Cannot block dates: There are existing bookings during this period",
        400,
      );
    }

    const blockedBooking = await prisma.booking.create({
      data: {
        propertyId,
        guestId: userId,
        checkInDate: start,
        checkOutDate: end,
        totalGuests: 1,
        totalPrice: new Prisma.Decimal(0),
        currency: property.currency,
        status: BookingStatus.ACTIVE,
        paymentStatus: null,
        roomFee: new Prisma.Decimal(0),
        cleaningFee: new Prisma.Decimal(0),
        securityDeposit: new Prisma.Decimal(0),
        serviceFee: new Prisma.Decimal(0),
        platformFee: new Prisma.Decimal(0),
        specialRequests: buildBlockedDatesSpecialRequest(reasonText),
      },
      select: {
        id: true,
        checkInDate: true,
        checkOutDate: true,
        status: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: "DATES_BLOCKED",
        userId,
        entityId: propertyId,
        entityType: "Property",
        details: {
          startDate,
          endDate,
          reason: reasonText,
          blockedBookingId: blockedBooking.id,
        },
      },
    });

    logger.info("Dates blocked", {
      propertyId,
      startDate,
      endDate,
      reason: reasonText,
      blockedBookingId: blockedBooking.id,
    });

    return res.json({
      success: true,
      message: "Dates blocked successfully",
      data: {
        blockedBooking,
      },
    });
  }),
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
        403,
      );
    }

    const checkinService = await import("@/services/checkinService");
    const result = await checkinService.default.confirmCheckIn(
      bookingId,
      confirmationType,
      userId,
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
  }),
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
        400,
      );
    }

    // Check if already checked out
    if (booking.checkOutTime) {
      throw new AppError("Already checked out", 400);
    }

    const now = new Date();
    const realtorDisputeClosesAt = new Date(
      now.getTime() + (4 * 60 + 10) * 60 * 1000,
    ); // +4 hours + 10 minutes grace

    // Update booking to checked out
    await prisma.booking.update({
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
          message: `Your security deposit will be refunded in 4 hours 10 minutes if no damages are reported by the realtor.`,
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
          message: `Guest has checked out. You have 4 hours 10 minutes to report any damages with photo evidence.`,
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
        realtorDisputeWindowDuration: "4 hours 10 minutes",
        depositAmount: booking.securityDeposit,
      },
    });
  }),
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
  }),
);

export default router;
