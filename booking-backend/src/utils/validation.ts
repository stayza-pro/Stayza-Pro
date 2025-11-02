import Joi from "joi";

// User validation schemas
export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  phone: Joi.string().optional(),
  role: Joi.string().valid("GUEST", "REALTOR").optional(),
  country: Joi.string().optional(),
  city: Joi.string().optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).required(),
});

export const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional(),
  lastName: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().optional(),
  country: Joi.string().optional(),
  city: Joi.string().optional(),
  address: Joi.string().optional(),
  dateOfBirth: Joi.date().optional(),
});

// Property validation schemas
export const createPropertySchema = Joi.object({
  title: Joi.string().min(10).max(200).required(),
  description: Joi.string().min(50).max(2000).required(),
  type: Joi.string()
    .valid(
      "APARTMENT",
      "HOUSE",
      "VILLA",
      "COTTAGE",
      "STUDIO",
      "LOFT",
      "TOWNHOUSE",
      "OTHER"
    )
    .required(),
  pricePerNight: Joi.number().positive().required(),
  currency: Joi.string().valid("USD", "NGN", "GBP", "EUR").default("USD"),
  maxGuests: Joi.number().integer().positive().max(20).required(),
  bedrooms: Joi.number().integer().min(0).required(),
  bathrooms: Joi.number().integer().positive().required(),
  amenities: Joi.array().items(Joi.string()).optional(),
  customAmenities: Joi.array().items(Joi.string().max(100)).optional(),
  address: Joi.string().required(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  country: Joi.string().required(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
});

export const updatePropertySchema = Joi.object({
  title: Joi.string().min(10).max(200).optional(),
  description: Joi.string().min(50).max(2000).optional(),
  type: Joi.string()
    .valid(
      "APARTMENT",
      "HOUSE",
      "VILLA",
      "COTTAGE",
      "STUDIO",
      "LOFT",
      "TOWNHOUSE",
      "OTHER"
    )
    .optional(),
  pricePerNight: Joi.number().positive().optional(),
  currency: Joi.string().valid("USD", "NGN", "GBP", "EUR").optional(),
  maxGuests: Joi.number().integer().positive().max(20).optional(),
  bedrooms: Joi.number().integer().min(0).optional(),
  bathrooms: Joi.number().integer().positive().optional(),
  amenities: Joi.array().items(Joi.string()).optional(),
  customAmenities: Joi.array().items(Joi.string().max(100)).optional(),
  address: Joi.string().optional(),
  city: Joi.string().optional(),
  state: Joi.string().optional(),
  country: Joi.string().optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  isActive: Joi.boolean().optional(),
});

// Booking validation schemas
export const createBookingSchema = Joi.object({
  propertyId: Joi.string().required(),
  checkInDate: Joi.date().greater("now").required(),
  checkOutDate: Joi.date().greater(Joi.ref("checkInDate")).required(),
  totalGuests: Joi.number().integer().positive().required(),
  specialRequests: Joi.string().max(500).optional(),
});

export const updateBookingSchema = Joi.object({
  status: Joi.string().valid("CONFIRMED", "CANCELLED").optional(),
  specialRequests: Joi.string().max(500).optional(),
});

// Review validation schemas
export const createReviewSchema = Joi.object({
  bookingId: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().min(10).max(1000).optional(),
});

export const updateReviewSchema = Joi.object({
  rating: Joi.number().integer().min(1).max(5).optional(),
  comment: Joi.string().min(10).max(1000).optional(),
  isVisible: Joi.boolean().optional(),
});
