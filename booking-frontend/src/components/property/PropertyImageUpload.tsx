"use client";

import React, { useState, useCallback } from "react";
import { Button, Card, Loading } from "../ui";
import { Upload, X, Camera, Image as ImageIcon } from "lucide-react";

interface PropertyImage {
  id?: string;
  url: string;
  isPrimary?: boolean;
  file?: File;
}

interface PropertyImageUploadProps {
  images: PropertyImage[];
  onImagesChange: (images: PropertyImage[]) => void;
  maxImages?: number;
  isLoading?: boolean;
  className?: string;
}

export const PropertyImageUpload: React.FC<PropertyImageUploadProps> = ({
  images,
  onImagesChange,
  maxImages = 10,
  isLoading = false,
  className = "",
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const validFiles = fileArray.filter((file) => {
        // Check file type
        if (!file.type.startsWith("image/")) {
          return false;
        }
        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) {
        return;
      }

      // Limit total images
      const availableSlots = maxImages - images.length;
      const filesToAdd = validFiles.slice(0, availableSlots);

      const newImages: PropertyImage[] = filesToAdd.map((file) => ({
        url: URL.createObjectURL(file),
        file,
        isPrimary: images.length === 0, // First image is primary by default
      }));

      onImagesChange([...images, ...newImages]);
    },
    [images, maxImages, onImagesChange]
  );

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
        e.target.value = ""; // Reset input
      }
    },
    [handleFiles]
  );

  const removeImage = useCallback(
    (index: number) => {
      const newImages = [...images];
      const removedImage = newImages[index];

      // Clean up object URL
      if (removedImage.file && removedImage.url.startsWith("blob:")) {
        URL.revokeObjectURL(removedImage.url);
      }

      newImages.splice(index, 1);

      // If we removed the primary image, make the first image primary
      if (removedImage.isPrimary && newImages.length > 0) {
        newImages[0].isPrimary = true;
      }

      onImagesChange(newImages);
    },
    [images, onImagesChange]
  );

  const setPrimaryImage = useCallback(
    (index: number) => {
      const newImages = images.map((img, i) => ({
        ...img,
        isPrimary: i === index,
      }));
      onImagesChange(newImages);
    },
    [images, onImagesChange]
  );

  const moveImage = useCallback(
    (fromIndex: number, toIndex: number) => {
      const newImages = [...images];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      onImagesChange(newImages);
    },
    [images, onImagesChange]
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card className="p-6">
        <div className="text-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Property Images</h3>
          <p className="text-sm text-gray-600 mt-1">
            Upload up to {maxImages} high-quality images of your property
          </p>
        </div>

        {images.length < maxImages && (
          <div
            className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-blue-400 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleInputChange}
              disabled={isLoading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            <div className="space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-gray-100 rounded-full">
                  {uploadingCount > 0 ? (
                    <Loading size="lg" />
                  ) : (
                    <Upload className="h-8 w-8 text-gray-600" />
                  )}
                </div>
              </div>

              <div>
                <p className="text-lg font-medium text-gray-900">
                  {uploadingCount > 0
                    ? `Uploading ${uploadingCount} image(s)...`
                    : "Drop images here or click to browse"}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  PNG, JPG, GIF up to 10MB each
                </p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Image Grid */}
      {images.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-gray-900">
              Uploaded Images ({images.length}/{maxImages})
            </h4>
            {images.length > 0 && (
              <p className="text-sm text-gray-600">
                Drag to reorder • Click star to set primary image
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div
                key={index}
                className="relative group aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 transition-all duration-200 hover:border-gray-300"
                style={{
                  borderColor: image.isPrimary ? "#3B82F6" : "transparent",
                }}
              >
                {/* Image */}
                <img
                  src={image.url}
                  alt={`Property image ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Primary Badge */}
                {image.isPrimary && (
                  <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                    Primary
                  </div>
                )}

                {/* Controls Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                    {/* Set Primary */}
                    {!image.isPrimary && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setPrimaryImage(index)}
                        className="bg-white text-gray-700 hover:bg-gray-50"
                        title="Set as primary image"
                      >
                        ⭐
                      </Button>
                    )}

                    {/* Move Left */}
                    {index > 0 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveImage(index, index - 1)}
                        className="bg-white text-gray-700 hover:bg-gray-50"
                        title="Move left"
                      >
                        ←
                      </Button>
                    )}

                    {/* Move Right */}
                    {index < images.length - 1 && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => moveImage(index, index + 1)}
                        className="bg-white text-gray-700 hover:bg-gray-50"
                        title="Move right"
                      >
                        →
                      </Button>
                    )}

                    {/* Remove */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeImage(index)}
                      className="bg-red-600 text-white hover:bg-red-700 border-red-600"
                      title="Remove image"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Upload Tips */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <Camera className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">
              Photography Tips
            </h4>
            <ul className="text-sm text-blue-800 mt-1 space-y-1">
              <li>• Use natural lighting when possible</li>
              <li>• Show different angles of each room</li>
              <li>• Include outdoor spaces and amenities</li>
              <li>• Keep the space clean and clutter-free</li>
              <li>• The first image will be used as the main property photo</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
