# Review System Implementation

## Overview
The review system has been updated to properly calculate and store ratings for both properties and realtors in the database.

## Rating Calculation Strategy

### Property Ratings
1. **Overall Average Rating**: Calculated from all visible reviews for the property
2. **Detailed Ratings**: Separately calculated for:
   - Cleanliness
   - Communication
   - Check-in experience
   - Accuracy
   - Location
   - Value for money
3. **Review Count**: Total number of visible reviews

### Realtor Ratings
1. **Overall Average Rating**: Calculated from ALL reviews across ALL of their properties
2. **Review Count**: Total number of reviews across all properties

## How It Works

### When a Review is Created:
1. Guest submits review after completing a booking
2. Review is saved with overall rating and optional detailed ratings
3. `updateAllRatings()` function is called
4. Property ratings are recalculated from all its reviews
5. Realtor ratings are recalculated from all reviews across all their properties
6. Both Property and Realtor models are updated with new ratings

### When a Review is Updated:
1. Review changes are saved
2. Ratings are recalculated for both property and realtor

### When a Review is Deleted:
1. Review is removed
2. Ratings are recalculated to reflect the removal

## Database Schema

### Property Model
```prisma
model Property {
  averageRating       Decimal? @db.Decimal(3, 2) @default(0)
  reviewCount         Int      @default(0)
  cleanlinessRating   Decimal? @db.Decimal(3, 2) @default(0)
  communicationRating Decimal? @db.Decimal(3, 2) @default(0)
  checkInRating       Decimal? @db.Decimal(3, 2) @default(0)
  accuracyRating      Decimal? @db.Decimal(3, 2) @default(0)
  locationRating      Decimal? @db.Decimal(3, 2) @default(0)
  valueRating         Decimal? @db.Decimal(3, 2) @default(0)
}
```

### Realtor Model
```prisma
model Realtor {
  averageRating Decimal? @db.Decimal(3, 2) @default(0)
  reviewCount   Int      @default(0)
}
```

## Benefits

1. **Performance**: No need to calculate ratings on every request
2. **Accuracy**: Ratings are always up-to-date and consistent
3. **Flexibility**: Can easily display ratings without fetching all reviews
4. **SEO**: Ratings are readily available for meta tags and structured data
5. **Analytics**: Can sort and filter by rating directly in database queries

## Review Requirements

- Reviews can ONLY be submitted by guests who have COMPLETED a booking
- One review per booking
- Reviews must have a rating between 1-5
- Optional detailed ratings (1-5 each)
- Optional photos
- Realtors can respond to reviews

## Frontend Implementation

The property detail page now:
1. Shows existing reviews with ratings
2. Displays property average rating from database
3. When no reviews exist, shows informational message
4. Explains that reviews require completed bookings
5. No review form shown (users must book first)

## Migration

Run the following to apply changes:
```bash
cd booking-backend
npx prisma migrate dev --name add_rating_fields
```

This will:
1. Add rating fields to Property table
2. Add rating fields to Realtor table
3. Initialize all ratings to 0

## Post-Migration

After migration, you may want to recalculate existing ratings:
```bash
# Create a script to recalculate all ratings
npm run recalculate-ratings
```

## API Endpoints

- `POST /api/reviews` - Create review (requires completed booking)
- `PUT /api/reviews/:id` - Update review
- `DELETE /api/reviews/:id` - Delete review
- `GET /api/properties/:id/reviews` - Get property reviews
- `GET /api/properties/:id` - Returns property with averageRating and reviewCount

## Future Enhancements

1. Add review helpfulness voting
2. Add review photos
3. Add review responses from realtors
4. Add review moderation system
5. Add review analytics dashboard
