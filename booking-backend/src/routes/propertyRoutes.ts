import express from "express";
import {
  getProperties,
  getProperty,
  createProperty,
  updateProperty,
  deleteProperty,
  getPropertiesByHost,
  uploadPropertyImages,
  deletePropertyImage,
  reorderPropertyImages,
} from "@/controllers/propertyController";
import { authenticate, authorize } from "@/middleware/auth";
import { upload } from "@/utils/upload";

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Property:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Property ID
 *         title:
 *           type: string
 *           description: Property title
 *         description:
 *           type: string
 *           description: Property description
 *         type:
 *           type: string
 *           enum: [APARTMENT, HOUSE, VILLA, CONDO, STUDIO, LOFT]
 *           description: Property type
 *         address:
 *           type: string
 *           description: Property address
 *         city:
 *           type: string
 *           description: Property city
 *         country:
 *           type: string
 *           description: Property country
 *         latitude:
 *           type: number
 *           description: Property latitude
 *         longitude:
 *           type: number
 *           description: Property longitude
 *         pricePerNight:
 *           type: number
 *           description: Property price per night
 *         currency:
 *           type: string
 *           description: Property currency
 *         bedrooms:
 *           type: integer
 *           description: Number of bedrooms
 *         bathrooms:
 *           type: integer
 *           description: Number of bathrooms
 *         maxGuests:
 *           type: integer
 *           description: Maximum number of guests
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *           description: Property amenities
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Property image URLs
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, PENDING]
 *           description: Property status
 *         averageRating:
 *           type: number
 *           description: Property average rating
 *         reviewCount:
 *           type: integer
 *           description: Number of reviews
 *         hostId:
 *           type: string
 *           description: Host user ID
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreatePropertyRequest:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - type
 *         - address
 *         - city
 *         - country
 *         - pricePerNight
 *         - bedrooms
 *         - bathrooms
 *         - maxGuests
 *       properties:
 *         title:
 *           type: string
 *           description: Property title
 *         description:
 *           type: string
 *           description: Property description
 *         type:
 *           type: string
 *           enum: [APARTMENT, HOUSE, VILLA, CONDO, STUDIO, LOFT]
 *           description: Property type
 *         address:
 *           type: string
 *           description: Property address
 *         city:
 *           type: string
 *           description: Property city
 *         country:
 *           type: string
 *           description: Property country
 *         latitude:
 *           type: number
 *           description: Property latitude
 *         longitude:
 *           type: number
 *           description: Property longitude
 *         pricePerNight:
 *           type: number
 *           description: Property price per night
 *         currency:
 *           type: string
 *           default: USD
 *           description: Property currency
 *         bedrooms:
 *           type: integer
 *           description: Number of bedrooms
 *         bathrooms:
 *           type: integer
 *           description: Number of bathrooms
 *         maxGuests:
 *           type: integer
 *           description: Maximum number of guests
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *           description: Property amenities
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Property image URLs
 *     UpdatePropertyRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Property title
 *         description:
 *           type: string
 *           description: Property description
 *         type:
 *           type: string
 *           enum: [APARTMENT, HOUSE, VILLA, CONDO, STUDIO, LOFT]
 *           description: Property type
 *         address:
 *           type: string
 *           description: Property address
 *         city:
 *           type: string
 *           description: Property city
 *         country:
 *           type: string
 *           description: Property country
 *         latitude:
 *           type: number
 *           description: Property latitude
 *         longitude:
 *           type: number
 *           description: Property longitude
 *         pricePerNight:
 *           type: number
 *           description: Property price per night
 *         currency:
 *           type: string
 *           description: Property currency
 *         bedrooms:
 *           type: integer
 *           description: Number of bedrooms
 *         bathrooms:
 *           type: integer
 *           description: Number of bathrooms
 *         maxGuests:
 *           type: integer
 *           description: Maximum number of guests
 *         amenities:
 *           type: array
 *           items:
 *             type: string
 *           description: Property amenities
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Property image URLs
 *         status:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, PENDING]
 *           description: Property status
 *     PaginatedProperties:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: Properties retrieved successfully
 *         data:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Property'
 *         pagination:
 *           type: object
 *           properties:
 *             currentPage:
 *               type: integer
 *             totalPages:
 *               type: integer
 *             totalItems:
 *               type: integer
 *             hasNext:
 *               type: boolean
 *             hasPrev:
 *               type: boolean
 */

/**
 * @swagger
 * /api/properties:
 *   get:
 *     summary: Get all properties with filtering and pagination
 *     tags: [Properties]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         description: Filter by country
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [APARTMENT, HOUSE, VILLA, CONDO, STUDIO, LOFT]
 *         description: Filter by property type
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price per night
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price per night
 *       - in: query
 *         name: bedrooms
 *         schema:
 *           type: integer
 *         description: Number of bedrooms
 *       - in: query
 *         name: bathrooms
 *         schema:
 *           type: integer
 *         description: Number of bathrooms
 *       - in: query
 *         name: maxGuests
 *         schema:
 *           type: integer
 *         description: Maximum number of guests
 *       - in: query
 *         name: amenities
 *         schema:
 *           type: string
 *         description: Comma-separated list of amenities
 *       - in: query
 *         name: checkIn
 *         schema:
 *           type: string
 *           format: date
 *         description: Check-in date
 *       - in: query
 *         name: checkOut
 *         schema:
 *           type: string
 *           format: date
 *         description: Check-out date
 *     responses:
 *       200:
 *         description: Properties retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedProperties'
 *       400:
 *         description: Bad request - Invalid query parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get("/", getProperties);

/**
 * @swagger
 * /api/properties/host/{hostId}:
 *   get:
 *     summary: Get properties by host ID
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: hostId
 *         required: true
 *         schema:
 *           type: string
 *         description: Host user ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Host properties retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedProperties'
 *       404:
 *         description: Host not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get("/host/:hostId", getPropertiesByHost);

/**
 * @swagger
 * /api/properties/{id}:
 *   get:
 *     summary: Get property by ID
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Property retrieved successfully
 *                 data:
 *                   $ref: '#/components/schemas/Property'
 *       404:
 *         description: Property not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get("/:id", getProperty);

/**
 * @swagger
 * /api/properties:
 *   post:
 *     summary: Create a new property (HOST or ADMIN only)
 *     tags: [Properties]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePropertyRequest'
 *     responses:
 *       201:
 *         description: Property created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Property created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Property'
 *       400:
 *         description: Bad request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post("/", authenticate, authorize("REALTOR", "ADMIN"), createProperty);

/**
 * @swagger
 * /api/properties/{id}:
 *   get:
 *     summary: Get property by ID
 *     description: Get detailed information about a specific property
 *     tags: [Properties]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         property:
 *                           $ref: '#/components/schemas/PropertyResponse'
 *       404:
 *         description: Property not found
 */
router.get("/:id", getProperty);

/**
 * @swagger
 * /api/properties/{id}:
 *   put:
 *     summary: Update property
 *     description: Update property information (realtor/host only)
 *     tags: [Properties]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PropertyUpdate'
 *     responses:
 *       200:
 *         description: Property updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/SuccessResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         property:
 *                           $ref: '#/components/schemas/PropertyResponse'
 *       403:
 *         description: Not authorized to update this property
 *       404:
 *         description: Property not found
 *   delete:
 *     summary: Delete property
 *     description: Delete a property (realtor/host only)
 *     tags: [Properties]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: Not authorized to delete this property
 *       404:
 *         description: Property not found
 */
router.put("/:id", authenticate, authorize("REALTOR", "ADMIN"), updateProperty);
router.delete(
  "/:id",
  authenticate,
  authorize("REALTOR", "ADMIN"),
  deleteProperty
);

/**
 * @swagger
 * /api/properties/{id}:
 *   put:
 *     summary: Update property (HOST or ADMIN only)
 *     tags: [Properties]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePropertyRequest'
 *     responses:
 *       200:
 *         description: Property updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Property updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/Property'
 *       400:
 *         description: Bad request - Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Property not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *   delete:
 *     summary: Delete property (HOST or ADMIN only)
 *     tags: [Properties]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     responses:
 *       200:
 *         description: Property deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Property deleted successfully
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Property not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.put("/:id", authenticate, authorize("REALTOR", "ADMIN"), updateProperty);
router.delete(
  "/:id",
  authenticate,
  authorize("REALTOR", "ADMIN"),
  deleteProperty
);

/**
 * @swagger
 * /api/properties/{id}/images:
 *   post:
 *     summary: Upload property images (HOST or ADMIN only)
 *     tags: [Properties]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Property ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Property images (max 10 files, 5MB each)
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Images uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     imageUrls:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: Uploaded image URLs
 *       400:
 *         description: Bad request - Invalid files or too many files
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Property not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post(
  "/:id/images",
  authenticate,
  authorize("REALTOR", "ADMIN"),
  upload.array("images", 8),
  uploadPropertyImages
);

router.delete(
  "/:id/images/:imageId",
  authenticate,
  authorize("REALTOR", "ADMIN"),
  deletePropertyImage
);

router.put(
  "/:id/images/reorder",
  authenticate,
  authorize("REALTOR", "ADMIN"),
  reorderPropertyImages
);

export default router;
