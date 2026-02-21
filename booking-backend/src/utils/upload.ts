import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { config } from "@/config";
import { CloudinaryUploadResult } from "@/types";

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

// Multer configuration for memory storage
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed") as any, false);
    }
  },
});

/**
 * Multer instance for dispute evidence — accepts images AND videos, 50 MB limit
 */
export const disputeUpload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50 MB
  },
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(
        new Error("Only image and video files are allowed for dispute evidence") as any,
        false,
      );
    }
  },
});

/**
 * Upload single image to Cloudinary
 */
export const uploadSingleImage = async (
  buffer: Buffer,
  folder: string = "booking-system"
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          flags: ["strip_profile"],
          transformation: [
            { width: 1200, height: 800, crop: "limit" },
            { quality: "auto", fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result as CloudinaryUploadResult);
          }
        }
      )
      .end(buffer);
  });
};

/**
 * Upload multiple images to Cloudinary
 */
export const uploadMultipleImages = async (
  files: Buffer[],
  folder: string = "booking-system"
): Promise<CloudinaryUploadResult[]> => {
  const uploadPromises = files.map((buffer) =>
    uploadSingleImage(buffer, folder)
  );
  return Promise.all(uploadPromises);
};

/**
 * Upload dispute evidence (image or video) to Cloudinary.
 * Videos are uploaded without image transformations.
 */
export const uploadDisputeEvidence = async (
  buffer: Buffer,
  mimetype: string,
  folder: string = "disputes",
): Promise<CloudinaryUploadResult> => {
  const isVideo = mimetype.startsWith("video/");
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: isVideo ? "video" : "image",
          ...(!isVideo && {
            transformation: [
              { width: 1920, height: 1080, crop: "limit" },
              { quality: "auto", fetch_format: "auto" },
            ],
          }),
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as CloudinaryUploadResult);
        },
      )
      .end(buffer);
  });
};

/**
 * Delete image from Cloudinary
 */
export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId);
};

/**
 * Extract public ID from Cloudinary URL
 */
export const extractPublicId = (url: string): string => {
  const parts = url.split("/");
  const filename = parts[parts.length - 1];
  return filename.split(".")[0];
};
