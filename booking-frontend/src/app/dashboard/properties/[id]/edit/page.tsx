"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { toast } from "react-hot-toast";
import { ArrowLeft, Trash2, Upload } from "lucide-react";

import { ModernDashboardLayout } from "@/components/layout/ModernDashboardLayout";
import { useAuthStore } from "@/store/authStore";
import { PropertyForm } from "@/components/property/PropertyForm";
import { PropertyImageUpload } from "@/components/property/PropertyImageUpload";
import { Button, Card, Loading } from "@/components/ui";
import { propertyService } from "@/services";
import { Property, PropertyFormData } from "@/types";

interface PropertyImage {
  id?: string;
  url: string;
  isPrimary?: boolean;
  file?: File;
}

const EditProperty: React.FC = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const propertyId = params.id as string;

  const [images, setImages] = useState<PropertyImage[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Fetch property data
  const {
    data: property,
    isLoading: isLoadingProperty,
    error,
  } = useQuery(
    ["property", propertyId],
    () => propertyService.getProperty(propertyId),
    {
      enabled: !!propertyId,
      onSuccess: (data) => {
        // Convert existing images to the format needed by the upload component
        if (data.images) {
          const existingImages = data.images.map((img) => ({
            id: img.id,
            url: img.url,
            isPrimary: img.order === 0,
          }));
          setImages(existingImages);
        }
      },
    }
  );

  // Update property mutation
  const updatePropertyMutation = useMutation(
    async (data: PropertyFormData & { imagesToUpload?: File[] }) => {
      // Update property data
      const updatedProperty = await propertyService.updateProperty(propertyId, data);
      
      // Handle image uploads if any
      if (data.imagesToUpload && data.imagesToUpload.length > 0) {
        setIsUploadingImages(true);
        try {
          await propertyService.uploadImages(propertyId, data.imagesToUpload);
          // Refresh property data to get updated images
          await queryClient.invalidateQueries(["property", propertyId]);
        } catch (error) {
          console.error("Error uploading images:", error);
          toast.error("Property updated but some images failed to upload");
        } finally {
          setIsUploadingImages(false);
        }
      }
      
      return updatedProperty;
    },
    {
      onSuccess: () => {
        toast.success("Property updated successfully!");
        queryClient.invalidateQueries("host-properties");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to update property");
      },
    }
  );

  // Delete image mutation
  const deleteImageMutation = useMutation(
    (imageId: string) => propertyService.deleteImage(propertyId, imageId),
    {
      onSuccess: () => {
        toast.success("Image deleted successfully");
        queryClient.invalidateQueries(["property", propertyId]);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to delete image");
      },
    }
  );

  const handleSubmit = async (data: PropertyFormData) => {
    const newImageFiles = images
      .filter(img => img.file && !img.id)
      .map(img => img.file!);

    updatePropertyMutation.mutate({
      ...data,
      imagesToUpload: newImageFiles,
    });
  };

  const handleBack = () => {
    router.push("/dashboard/properties");
  };

  const handleImageChange = (newImages: PropertyImage[]) => {
    setImages(newImages);
  };

  const handleDeleteExistingImage = async (imageId: string) => {
    if (window.confirm("Are you sure you want to delete this image?")) {
      deleteImageMutation.mutate(imageId);
    }
  };

  if (!user) return null;

  if (isLoadingProperty) {
    return (
      <ModernDashboardLayout currentUser={user} activeRoute="properties" onRouteChange={() => {}}>
        <div className="flex justify-center items-center min-h-[400px]">
          <Loading size="lg" />
        </div>
      </ModernDashboardLayout>
    );
  }

  if (error || !property) {
    return (
      <ModernDashboardLayout currentUser={user} activeRoute="properties" onRouteChange={() => {}}>
        <Card className="p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Property Not Found
          </h3>
          <p className="text-gray-600 mb-6">
            The property you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
        </Card>
      </ModernDashboardLayout>
    );
  }

  const isLoading = updatePropertyMutation.isLoading || isUploadingImages || deleteImageMutation.isLoading;

  return (
    <ModernDashboardLayout currentUser={user} activeRoute="properties" onRouteChange={() => {}}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Properties
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Property</h1>
            <p className="text-gray-600">Update your property listing</p>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Property Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Property Details
            </h2>
            <PropertyForm 
              property={property}
              onSubmit={handleSubmit} 
              isLoading={isLoading} 
            />
          </Card>

          {/* Images */}
          <div className="space-y-6">
            {/* Current Images */}
            {property.images && property.images.length > 0 && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Current Images
                </h2>
                <div className="grid grid-cols-2 gap-4">
                  {property.images.map((image, index) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.url}
                        alt={`Property image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeleteExistingImage(image.id)}
                          disabled={deleteImageMutation.isLoading}
                          className="bg-red-600 text-white border-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {index === 0 && (
                        <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                          Primary
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Upload New Images */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Add New Images
              </h2>
              <PropertyImageUpload
                images={images.filter(img => !img.id)} // Only show new images
                onImagesChange={handleImageChange}
                maxImages={8 - (property.images?.length || 0)}
                isLoading={isUploadingImages}
              />
              <div className="mt-4 text-sm text-gray-600">
                <p className="font-medium mb-2">Photo Guidelines:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Upload high-quality photos (at least 1024x768 pixels)</li>
                  <li>Include photos of all main areas</li>
                  <li>Show the property's best features</li>
                  <li>Ensure photos are well-lit and accurate</li>
                  <li>Maximum {8 - (property.images?.length || 0)} new images can be added</li>
                </ul>
              </div>
            </Card>
          </div>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="p-8 text-center">
              <Loading size="lg" />
              <p className="mt-4 text-gray-600">
                {updatePropertyMutation.isLoading
                  ? "Updating property..."
                  : deleteImageMutation.isLoading
                  ? "Deleting image..."
                  : "Uploading images..."}
              </p>
            </Card>
          </div>
        )}
      </div>
    </ModernDashboardLayout>
  );
};

export default EditProperty;