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
