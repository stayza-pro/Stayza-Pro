import { Request } from "express";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { v2 as cloudinary } from "cloudinary";
import { AppError } from "@/middleware/errorHandler";

// Configure cloudinary (should be done in config but added here for completeness)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Cloudinary storage configuration for review photos
const reviewPhotosStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "stayza/review-photos",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [
      { width: 800, height: 600, crop: "limit", quality: "auto" },
      { format: "webp" },
    ],
  } as any,
});

// Multer configuration for review photos
export const uploadReviewPhotos = multer({
  storage: reviewPhotosStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5, // Maximum 5 photos per review
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: any) => {
    // Check file type
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
          400
        ),
        false
      );
    }
  },
}).array("photos", 5); // Accept up to 5 files with field name "photos"

// Single photo upload for avatars, etc.
export const uploadSinglePhoto = multer({
  storage: new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "stayza/avatars",
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      transformation: [
        {
          width: 400,
          height: 400,
          crop: "fill",
          quality: "auto",
          gravity: "face",
        },
        { format: "webp" },
      ],
    } as any,
  }),
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB per file
  },
  fileFilter: (req: Request, file: Express.Multer.File, cb: any) => {
    const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
          400
        ),
        false
      );
    }
  },
}).single("photo");

// Utility function to extract public ID from Cloudinary URL
export const getCloudinaryPublicId = (url: string): string => {
  const matches = url.match(/\/v\d+\/(.+)\./);
  return matches ? matches[1] : "";
};

// Delete image from Cloudinary
export const deleteCloudinaryImage = async (url: string): Promise<void> => {
  try {
    const publicId = getCloudinaryPublicId(url);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    // Don't throw error to avoid breaking the flow
  }
};

// Upload base64 image to Cloudinary (for drag & drop uploads)
export const uploadBase64Image = async (
  base64Data: string,
  folder: string = "stayza/uploads"
): Promise<{ url: string; publicId: string }> => {
  try {
    const result = await cloudinary.uploader.upload(base64Data, {
      folder,
      resource_type: "image",
      transformation: [
        { width: 800, height: 600, crop: "limit", quality: "auto" },
        { format: "webp" },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Error uploading base64 image:", error);
    throw new AppError("Failed to upload image", 500);
  }
};

// Validate and process review photos
export const processReviewPhotos = (
  files: Express.Multer.File[]
): Array<{ url: string; caption?: string }> => {
  if (!files || files.length === 0) {
    return [];
  }

  return files.map((file) => ({
    url: file.path, // Cloudinary URL
    caption: "", // Can be added by user later
  }));
};

// Image validation utilities
export const validateImageDimensions = async (
  url: string,
  minWidth: number = 400,
  minHeight: number = 300
): Promise<boolean> => {
  try {
    const result = await cloudinary.api.resource(getCloudinaryPublicId(url));
    return result.width >= minWidth && result.height >= minHeight;
  } catch (error) {
    console.error("Error validating image dimensions:", error);
    return false;
  }
};

export const getImageInfo = async (url: string) => {
  try {
    const publicId = getCloudinaryPublicId(url);
    const result = await cloudinary.api.resource(publicId);

    return {
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
      createdAt: result.created_at,
    };
  } catch (error) {
    console.error("Error getting image info:", error);
    return null;
  }
};

// Generate different sizes for responsive images
export const generateImageVariants = (url: string) => {
  const baseUrl = url.replace("/upload/", "/upload/");

  return {
    thumbnail: baseUrl.replace("/upload/", "/upload/w_150,h_150,c_fill/"),
    small: baseUrl.replace("/upload/", "/upload/w_400,h_300,c_fill/"),
    medium: baseUrl.replace("/upload/", "/upload/w_800,h_600,c_fill/"),
    large: baseUrl.replace("/upload/", "/upload/w_1200,h_900,c_fill/"),
    original: url,
  };
};

// Batch delete multiple images
export const deleteMultipleImages = async (urls: string[]): Promise<void> => {
  const deletePromises = urls.map((url) => deleteCloudinaryImage(url));

  try {
    await Promise.allSettled(deletePromises);
  } catch (error) {
    console.error("Error in batch delete:", error);
  }
};

export default {
  uploadReviewPhotos,
  uploadSinglePhoto,
  deleteCloudinaryImage,
  uploadBase64Image,
  processReviewPhotos,
  validateImageDimensions,
  getImageInfo,
  generateImageVariants,
  deleteMultipleImages,
};
