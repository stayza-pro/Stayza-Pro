import { prisma } from "@/config/database";

/**
 * Calculate and update property ratings based on all reviews
 */
export async function updatePropertyRatings(propertyId: string): Promise<void> {
  const reviews = await prisma.review.findMany({
    where: {
      propertyId,
      isVisible: true,
    },
    select: {
      rating: true,
      cleanlinessRating: true,
      communicationRating: true,
      checkInRating: true,
      accuracyRating: true,
      locationRating: true,
      valueRating: true,
    },
  });

  const reviewCount = reviews.length;

  if (reviewCount === 0) {
    // No reviews, set all ratings to 0
    await prisma.property.update({
      where: { id: propertyId },
      data: {
        averageRating: 0,
        reviewCount: 0,
        cleanlinessRating: 0,
        communicationRating: 0,
        checkInRating: 0,
        accuracyRating: 0,
        locationRating: 0,
        valueRating: 0,
      },
    });
    return;
  }

  // Calculate average overall rating
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviewCount;

  // Calculate detailed ratings (only for reviews that have them)
  const calculateDetailedRating = (field: keyof (typeof reviews)[0]) => {
    const validReviews = reviews.filter((r) => r[field] !== null);
    if (validReviews.length === 0) return 0;
    const sum = validReviews.reduce((acc, r) => acc + (r[field] as number), 0);
    return sum / validReviews.length;
  };

  const cleanlinessRating = calculateDetailedRating("cleanlinessRating");
  const communicationRating = calculateDetailedRating("communicationRating");
  const checkInRating = calculateDetailedRating("checkInRating");
  const accuracyRating = calculateDetailedRating("accuracyRating");
  const locationRating = calculateDetailedRating("locationRating");
  const valueRating = calculateDetailedRating("valueRating");

  // Update property with calculated ratings (rounded to 2 decimal places)
  await prisma.property.update({
    where: { id: propertyId },
    data: {
      averageRating: Math.round(averageRating * 100) / 100,
      reviewCount,
      cleanlinessRating: Math.round(cleanlinessRating * 100) / 100,
      communicationRating: Math.round(communicationRating * 100) / 100,
      checkInRating: Math.round(checkInRating * 100) / 100,
      accuracyRating: Math.round(accuracyRating * 100) / 100,
      locationRating: Math.round(locationRating * 100) / 100,
      valueRating: Math.round(valueRating * 100) / 100,
    },
  });
}

/**
 * Calculate and update realtor ratings based on all their property reviews
 */
export async function updateRealtorRatings(realtorId: string): Promise<void> {
  // Get all properties for this realtor
  const properties = await prisma.property.findMany({
    where: { realtorId },
    select: { id: true },
  });

  const propertyIds = properties.map((p) => p.id);

  // Get all reviews for all properties
  const reviews = await prisma.review.findMany({
    where: {
      propertyId: { in: propertyIds },
      isVisible: true,
    },
    select: {
      rating: true,
    },
  });

  const reviewCount = reviews.length;

  if (reviewCount === 0) {
    await prisma.realtor.update({
      where: { id: realtorId },
      data: {
        averageRating: 0,
        reviewCount: 0,
      },
    });
    return;
  }

  // Calculate average rating across all properties
  const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = totalRating / reviewCount;

  await prisma.realtor.update({
    where: { id: realtorId },
    data: {
      averageRating: Math.round(averageRating * 100) / 100,
      reviewCount,
    },
  });
}

/**
 * Update both property and realtor ratings
 */
export async function updateAllRatings(
  propertyId: string,
  realtorId: string
): Promise<void> {
  await Promise.all([
    updatePropertyRatings(propertyId),
    updateRealtorRatings(realtorId),
  ]);
}
