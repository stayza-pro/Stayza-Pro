"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "react-query";
import { toast } from "react-hot-toast";
import { ArrowLeft } from "lucide-react";

import { ModernDashboardLayout } from "@/components/layout/ModernDashboardLayout";
import { useAuthStore } from "@/store/authStore";
import { PropertyForm } from "@/components/property/PropertyForm";
import { PropertyImageUpload } from "@/components/property/PropertyImageUpload";
import { Button, Card, Loading } from "@/components/ui";
import { propertyService } from "@/services";
import { CreatePropertyData } from "@/types";

interface PropertyImage {
  id?: string;
  url: string;
  isPrimary?: boolean;
  file?: File;
}

const NewProperty: React.FC = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  const [images, setImages] = useState<PropertyImage[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // Create property mutation
  const createPropertyMutation = useMutation(
    async (data: CreatePropertyData & { images?: File[] }) => {
      // First create the property
      const property = await propertyService.createProperty(data);
      
      // Then upload images if any
      if (data.images && data.images.length > 0) {
        setIsUploadingImages(true);
        try {
          await propertyService.uploadImages(property.id, data.images);
        } catch (error) {
          console.error("Error uploading images:", error);
          // Don't fail the whole process if image upload fails
          toast.error("Property created but some images failed to upload");
        } finally {
          setIsUploadingImages(false);
        }
      }
      
      return property;
    },
    {
      onSuccess: (property) => {
        toast.success("Property created successfully!");
        router.push(`/dashboard/properties/${property.id}/edit`);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to create property");
      },
    }
  );

  const handleSubmit = async (data: CreatePropertyData) => {
    const imageFiles = images
      .filter(img => img.file)
      .map(img => img.file!);

    createPropertyMutation.mutate({
      ...data,
      images: imageFiles,
    });
  };

  const handleBack = () => {
    router.push("/dashboard/properties");
  };

  if (!user) return null;

  const isLoading = createPropertyMutation.isLoading || isUploadingImages;

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
            <h1 className="text-2xl font-bold text-gray-900">Add New Property</h1>
            <p className="text-gray-600">Create a new property listing</p>
          </div>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Property Details */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Property Details
            </h2>
            <PropertyForm onSubmit={handleSubmit} isLoading={isLoading} />
          </Card>

          {/* Images */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Property Images
            </h2>
            <PropertyImageUpload
              images={images}
              onImagesChange={setImages}
              maxImages={8}
              isLoading={isUploadingImages}
            />
            <div className="mt-4 text-sm text-gray-600">
              <p className="font-medium mb-2">Photo Guidelines:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Upload high-quality photos (at least 1024x768 pixels)</li>
                <li>Include photos of all main areas (living room, bedrooms, kitchen, bathroom)</li>
                <li>Show the property's best features and unique selling points</li>
                <li>Ensure photos are well-lit and accurately represent the space</li>
                <li>The first photo will be used as the main listing image</li>
              </ul>
            </div>
          </Card>
        </div>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="p-8 text-center">
              <Loading size="lg" />
              <p className="mt-4 text-gray-600">
                {createPropertyMutation.isLoading
                  ? "Creating property..."
                  : "Uploading images..."}
              </p>
            </Card>
          </div>
        )}
      </div>
    </ModernDashboardLayout>
  );
};

export default NewProperty;