import { Response } from "express";
import { AuthenticatedRequest } from "@/types";
import { prisma } from "@/config/database";
import { asyncHandler, AppError } from "@/middleware/errorHandler";

/**
 * @desc    Get realtor branding by subdomain (slug)
 * @route   GET /api/branding/subdomain/:subdomain
 * @access  Public
 */
export const getBrandingBySubdomain = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { subdomain } = req.params;

    if (!subdomain) {
      throw new AppError("Subdomain is required", 400);
    }

    // Find realtor by slug (subdomain)
    const realtor = await prisma.realtor.findUnique({
      where: {
        slug: subdomain,
      },
      select: {
        id: true,
        userId: true,
        businessName: true,
        tagline: true,
        description: true,
        slug: true,
        logoUrl: true,
        businessPhone: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        websiteUrl: true,
        instagramUrl: true,
        twitterUrl: true,
        linkedinUrl: true,
        facebookUrl: true,
        youtubeUrl: true,
        whatsappType: true,
        status: true,
        isActive: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    if (!realtor) {
      throw new AppError("Realtor not found with this subdomain", 404);
    }

    // Check if realtor is active and approved
    if (!realtor.isActive || realtor.status !== "APPROVED") {
      throw new AppError("This realtor's website is not available", 403);
    }

    // Get stats for the realtor
    const properties = await prisma.property.findMany({
      where: {
        realtorId: realtor.id,
        status: "ACTIVE",
        isActive: true,
      },
      select: {
        id: true,
        reviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    const propertyIds = properties.map((p) => p.id);

    // Get unique guest count from bookings
    const uniqueGuests = await prisma.booking.groupBy({
      by: ["guestId"],
      where: {
        propertyId: { in: propertyIds },
        status: { in: ["CONFIRMED", "COMPLETED"] },
      },
      _count: {
        guestId: true,
      },
    });

    // Calculate total reviews and average rating from actual reviews
    let totalReviews = 0;
    let totalRatingSum = 0;

    properties.forEach((property) => {
      totalReviews += property.reviews.length;
      property.reviews.forEach((review) => {
        totalRatingSum += review.rating;
      });
    });

    const avgRating = totalReviews > 0 ? totalRatingSum / totalReviews : 0;

    // Format response to match frontend expectations
    const branding = {
      id: realtor.id,
      userId: realtor.userId,
      businessName: realtor.businessName,
      businessEmail: realtor.user.email,
      subdomain: realtor.slug,
      logo: realtor.logoUrl,
      tagline: realtor.tagline,
      description: realtor.description,
      colors: {
        primary: realtor.primaryColor,
        secondary: realtor.secondaryColor || "#10B981",
        accent: realtor.accentColor || "#F59E0B",
      },
      social: {
        website: realtor.websiteUrl,
        instagram: realtor.instagramUrl,
        twitter: realtor.twitterUrl,
        linkedin: realtor.linkedinUrl,
        facebook: realtor.facebookUrl,
        youtube: realtor.youtubeUrl,
        whatsappType: realtor.whatsappType,
      },
      stats: {
        totalProperties: properties.length,
        totalGuests: uniqueGuests.length,
        totalReviews: totalReviews,
        averageRating: avgRating,
      },
      user: realtor.user,
    };

    res.status(200).json({
      success: true,
      data: branding,
    });
  }
);

/**
 * @desc    Get current user's branding (for realtor dashboard)
 * @route   GET /api/branding/me
 * @access  Private (Realtor only)
 */
export const getMyBranding = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError("User not authenticated", 401);
    }

    const realtor = await prisma.realtor.findUnique({
      where: {
        userId: userId,
      },
      select: {
        id: true,
        userId: true,
        businessName: true,
        tagline: true,
        description: true,
        slug: true,
        logoUrl: true,
        businessPhone: true,
        primaryColor: true,
        secondaryColor: true,
        accentColor: true,
        websiteUrl: true,
        instagramUrl: true,
        twitterUrl: true,
        linkedinUrl: true,
        facebookUrl: true,
        youtubeUrl: true,
        whatsappType: true,
        status: true,
        isActive: true,
      },
    });

    if (!realtor) {
      throw new AppError("Realtor profile not found", 404);
    }

    const branding = {
      id: realtor.id,
      userId: realtor.userId,
      businessName: realtor.businessName,
      subdomain: realtor.slug,
      logo: realtor.logoUrl,
      tagline: realtor.tagline,
      description: realtor.description,
      colors: {
        primary: realtor.primaryColor,
        secondary: realtor.secondaryColor || "#10B981",
        accent: realtor.accentColor || "#F59E0B",
      },
      social: {
        website: realtor.websiteUrl,
        instagram: realtor.instagramUrl,
        twitter: realtor.twitterUrl,
        linkedin: realtor.linkedinUrl,
        facebook: realtor.facebookUrl,
        youtube: realtor.youtubeUrl,
        whatsappType: realtor.whatsappType,
      },
      status: realtor.status,
      isActive: realtor.isActive,
    };

    res.status(200).json({
      success: true,
      data: branding,
    });
  }
);
