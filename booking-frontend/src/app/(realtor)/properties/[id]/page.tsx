"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAlert } from "@/context/AlertContext";
import { propertyService } from "@/services/properties";
import { Property, PropertyFormData } from "@/types";
import PropertyCalendarManager from "@/components/realtor/PropertyCalendarManager";
import {
  ArrowLeft,
  Save,
  Loader2,
  Trash2,
  Image as ImageIcon,
  X,
  DollarSign,
} from "lucide-react";

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const propertyId = params.id as string;
  const { showSuccess, showError, showConfirm } = useAlert();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState<Property | null>(null);
  const [formData, setFormData] = useState<PropertyFormData>({
    title: "",
    description: "",
    type: "APARTMENT",
    pricePerNight: 0,
    currency: "NGN",
    maxGuests: 1,
    bedrooms: 0,
    bathrooms: 0,
    amenities: [],
    houseRules: [],
    address: "",
    city: "",
    state: "",
    country: "",
    checkInTime: "14:00",
    checkOutTime: "11:00",
  });
  const [newImages, setNewImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<
    Array<{ id: string; url: string; order: number }>
  >([]);

  useEffect(() => {
    fetchProperty();
  }, [propertyId]);

  const fetchProperty = async () => {
    try {
      setLoading(true);
      const data = await propertyService.getProperty(propertyId);
      setProperty(data);

      // Populate form data
      setFormData({
        title: data.title,
        description: data.description,
        type: data.type,
        pricePerNight: data.pricePerNight,
        currency: data.currency,
        maxGuests: data.maxGuests,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        amenities: data.amenities,
        houseRules: data.houseRules,
        checkInTime: data.checkInTime,
        checkOutTime: data.checkOutTime,
        cleaningFee: data.cleaningFee,
        securityDeposit: data.securityDeposit,
      });

      setExistingImages(data.images || []);
    } catch (error) {
      
      showError("Failed to load property");
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setNewImages((prev) => [...prev, ...files]);
  };

  const removeNewImage = (index: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = async (imageUrl: string, index: number) => {
    showConfirm("Are you sure you want to delete this image?", async () => {
      try {
        const imageId = existingImages[index].id;
        await propertyService.deleteImage(propertyId, imageId);
        setExistingImages((prev) => prev.filter((_, i) => i !== index));
        showSuccess("Image deleted successfully");
      } catch (error: any) {
        
        showError(error.message || "Failed to delete image");
      }
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Update property details
      await propertyService.updateProperty(propertyId, formData);

      // Upload new images if any
      if (newImages.length > 0) {
        await propertyService.uploadImages(propertyId, newImages);
      }

      showSuccess("Property updated successfully!");
      router.push("/properties");
    } catch (error: any) {
      
      showError(error.message || "Failed to update property");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    showConfirm(
      "Are you sure you want to delete this property? This action cannot be undone.",
      async () => {
        try {
          await propertyService.deleteProperty(propertyId);
          showSuccess("Property deleted successfully!");
          router.push("/properties");
        } catch (error: any) {
          
          showError(error.message || "Failed to delete property");
        }
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading property...</p>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-red-800 font-semibold mb-2">Property Not Found</h2>
        <p className="text-red-600">
          The property you're looking for doesn't exist.
        </p>
        <button
          onClick={() => router.push("/properties")}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Back to Properties
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Property</h1>
          <p className="text-gray-600 mt-1">{property.title}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 space-y-8">
          {/* Basic Details */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Details
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Name *
                </label>
                <input
                  type="text"
                  value={formData.title || ""}
                  onChange={(e) => updateFormData("title", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property Type *
                  </label>
                  <select
                    value={formData.type || "APARTMENT"}
                    onChange={(e) => updateFormData("type", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="APARTMENT">Apartment</option>
                    <option value="HOUSE">House</option>
                    <option value="VILLA">Villa</option>
                    <option value="COTTAGE">Cottage</option>
                    <option value="STUDIO">Studio</option>
                    <option value="LOFT">Loft</option>
                    <option value="TOWNHOUSE">Townhouse</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={property?.status || "DRAFT"}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
                  >
                    <option value="DRAFT">Draft</option>
                    <option value="PENDING">Pending</option>
                    <option value="APPROVED">Approved</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Status is managed by admins
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={formData.description || ""}
                  onChange={(e) =>
                    updateFormData("description", e.target.value)
                  }
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bedrooms *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bedrooms ?? 0}
                    onChange={(e) =>
                      updateFormData("bedrooms", parseInt(e.target.value))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bathrooms *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.bathrooms ?? 0}
                    onChange={(e) =>
                      updateFormData("bathrooms", parseInt(e.target.value))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Guests *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxGuests || 1}
                    onChange={(e) =>
                      updateFormData("maxGuests", parseInt(e.target.value))
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Location
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address *
                </label>
                <input
                  type="text"
                  value={formData.address || ""}
                  onChange={(e) => updateFormData("address", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City *
                  </label>
                  <input
                    type="text"
                    value={formData.city || ""}
                    onChange={(e) => updateFormData("city", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <input
                    type="text"
                    value={formData.state || ""}
                    onChange={(e) => updateFormData("state", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country *
                  </label>
                  <input
                    type="text"
                    value={formData.country || ""}
                    onChange={(e) => updateFormData("country", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Pricing
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Night ({formData.currency || "₦"}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.pricePerNight || ""}
                    onChange={(e) =>
                      updateFormData(
                        "pricePerNight",
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Currency
                  </label>
                  <select
                    value={formData.currency || "NGN"}
                    onChange={(e) => updateFormData("currency", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="NGN">₦ Naira</option>
                  </select>
                </div>
              </div>

              {/* Optional Fees Section */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-4">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-900">
                    Additional Charges (Optional)
                  </h3>
                </div>
                <p className="text-xs text-gray-600 mb-4">
                  Set optional fees that will be added to the booking total.
                  Leave blank if not applicable.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cleaning Fee
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {"₦"}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.cleaningFee ?? ""}
                        onChange={(e) =>
                          updateFormData(
                            "cleaningFee",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                          )
                        }
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Security Deposit
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        {"₦"}
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.securityDeposit ?? ""}
                        onChange={(e) =>
                          updateFormData(
                            "securityDeposit",
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                          )
                        }
                        placeholder="0.00"
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Refundable after checkout
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Amenities */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Amenities
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: "WiFi", value: "WIFI" as const },
                { label: "Parking", value: "PARKING" as const },
                { label: "Pool", value: "POOL" as const },
                { label: "Gym", value: "GYM" as const },
                { label: "Air Conditioning", value: "AC" as const },
                { label: "Kitchen", value: "KITCHEN" as const },
                { label: "Washing Machine", value: "WASHING_MACHINE" as const },
                { label: "TV", value: "TV" as const },
                { label: "Security", value: "SECURITY" as const },
                { label: "Elevator", value: "ELEVATOR" as const },
              ].map((amenity) => (
                <label key={amenity.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.amenities?.includes(amenity.value)}
                    onChange={(e) => {
                      const current = formData.amenities || [];
                      updateFormData(
                        "amenities",
                        e.target.checked
                          ? [...current, amenity.value]
                          : current.filter((a) => a !== amenity.value)
                      );
                    }}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">{amenity.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Images */}
          <div className="pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Photos</h2>

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Current Photos
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  {existingImages.map((image, index) => (
                    <div key={image.id} className="relative group">
                      <img
                        src={image.url}
                        alt={`Property ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeExistingImage(image.url, index)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          Main
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload New Images */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Add New Photos
              </h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                <label className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-700 font-medium">
                    Click to upload
                  </span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {newImages.length > 0 && (
                <div className="mt-4 grid grid-cols-4 gap-4">
                  {newImages.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`New ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeNewImage(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                        New
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <PropertyCalendarManager propertyId={propertyId} />
        </div>

        {/* Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end gap-3 rounded-b-lg">
          <button
            onClick={() => router.back()}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-white"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

