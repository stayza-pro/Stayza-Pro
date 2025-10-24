"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useBranding } from "@/hooks/useBranding";
import { propertyService } from "@/services/properties";
import { PropertyFormData } from "@/types";
import {
  Building2,
  MapPin,
  DollarSign,
  Users,
  Image as ImageIcon,
  Check,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Home,
  Bed,
  Bath,
  Square,
  Wifi,
  Tv,
  Car,
  Coffee,
  Wind,
  Waves,
  Dumbbell,
  X,
  Upload,
} from "lucide-react";

type Step =
  | "details"
  | "location"
  | "pricing"
  | "amenities"
  | "photos"
  | "review";

const STEPS: Step[] = [
  "details",
  "location",
  "pricing",
  "amenities",
  "photos",
  "review",
];

const STEP_TITLES = {
  details: "Property Details",
  location: "Location Info",
  pricing: "Pricing & Capacity",
  amenities: "Amenities & Features",
  photos: "Property Photos",
  review: "Review & Submit",
};

const STEP_ICONS = {
  details: Home,
  location: MapPin,
  pricing: DollarSign,
  amenities: Coffee,
  photos: ImageIcon,
  review: Check,
};

const AMENITIES_OPTIONS = [
  { value: "wifi", label: "WiFi", icon: Wifi },
  { value: "tv", label: "TV", icon: Tv },
  { value: "kitchen", label: "Kitchen", icon: Coffee },
  { value: "parking", label: "Parking", icon: Car },
  { value: "ac", label: "Air Conditioning", icon: Wind },
  { value: "pool", label: "Swimming Pool", icon: Waves },
  { value: "gym", label: "Gym", icon: Dumbbell },
  { value: "heating", label: "Heating", icon: Wind },
  { value: "workspace", label: "Workspace", icon: Coffee },
  { value: "washer", label: "Washer", icon: Coffee },
];

export default function AddPropertyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { branding } = useBranding();
  const [currentStep, setCurrentStep] = useState<Step>("details");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<PropertyFormData>>({
    propertyType: "APARTMENT",
    status: "AVAILABLE",
    amenities: [],
    country: "Nigeria",
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const brandColors = branding?.colors || {
    primary: "#3B82F6",
    secondary: "#1E40AF",
    accent: "#F59E0B",
  };

  const currentStepIndex = STEPS.indexOf(currentStep);
  const isLastStep = currentStep === "review";
  const isFirstStep = currentStep === "details";

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormData((prev) => {
      const amenities = prev.amenities || [];
      if (amenities.includes(amenity)) {
        return { ...prev, amenities: amenities.filter((a) => a !== amenity) };
      } else {
        return { ...prev, amenities: [...amenities, amenity] };
      }
    });
  };

  const nextStep = () => {
    if (!isLastStep) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStep(STEPS[nextIndex]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const previousStep = () => {
    if (!isFirstStep) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStep(STEPS[prevIndex]);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 10) {
      alert("Maximum 10 photos allowed");
      return;
    }
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (
        !formData.name ||
        !formData.description ||
        !formData.address ||
        !formData.city ||
        !formData.state ||
        !formData.pricePerNight
      ) {
        alert("Please fill in all required fields");
        return;
      }

      // Create property
      const property = await propertyService.createProperty(
        formData as PropertyFormData
      );

      // Upload images if any
      if (selectedFiles.length > 0) {
        await propertyService.uploadImages(property.id, selectedFiles);
      }

      alert("Property created successfully!");
      router.push("/properties");
    } catch (error: any) {
      console.error("Error creating property:", error);
      alert(error.message || "Failed to create property. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "details":
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Name *
              </label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) => updateFormData("name", e.target.value)}
                placeholder="e.g., Luxury Downtown Apartment"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Type *
              </label>
              <select
                value={formData.propertyType || "APARTMENT"}
                onChange={(e) => updateFormData("propertyType", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="APARTMENT">Apartment</option>
                <option value="HOUSE">House</option>
                <option value="VILLA">Villa</option>
                <option value="CONDO">Condo</option>
                <option value="STUDIO">Studio</option>
                <option value="SHORTLET">Shortlet</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Describe your property..."
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
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
                  required
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
                  required
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
                  required
                />
              </div>
            </div>
          </div>
        );

      case "location":
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address *
              </label>
              <input
                type="text"
                value={formData.address || ""}
                onChange={(e) => updateFormData("address", e.target.value)}
                placeholder="123 Main Street"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
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
                  placeholder="Lagos"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
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
                  placeholder="Lagos State"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
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
                  value={formData.country || "Nigeria"}
                  onChange={(e) => updateFormData("country", e.target.value)}
                  placeholder="Nigeria"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={formData.postalCode || ""}
                  onChange={(e) => updateFormData("postalCode", e.target.value)}
                  placeholder="100001"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude (optional)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.latitude || ""}
                  onChange={(e) =>
                    updateFormData("latitude", parseFloat(e.target.value))
                  }
                  placeholder="6.5244"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude (optional)
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={formData.longitude || ""}
                  onChange={(e) =>
                    updateFormData("longitude", parseFloat(e.target.value))
                  }
                  placeholder="3.3792"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        );

      case "pricing":
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price per Night (USD) *
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price || ""}
                  onChange={(e) =>
                    updateFormData("price", parseFloat(e.target.value))
                  }
                  placeholder="100.00"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cleaning Fee (optional)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.cleaningFee || ""}
                  onChange={(e) =>
                    updateFormData("cleaningFee", parseFloat(e.target.value))
                  }
                  placeholder="50.00"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Stay (nights)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.minStay || 1}
                  onChange={(e) =>
                    updateFormData("minStay", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Stay (nights)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxStay || 30}
                  onChange={(e) =>
                    updateFormData("maxStay", parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amenities
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  "WiFi",
                  "Parking",
                  "Air Conditioning",
                  "Kitchen",
                  "TV",
                  "Pool",
                  "Gym",
                  "Washer",
                  "Dryer",
                  "Security",
                ].map((amenity) => (
                  <label key={amenity} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.amenities?.includes(amenity)}
                      onChange={(e) => {
                        const current = formData.amenities || [];
                        updateFormData(
                          "amenities",
                          e.target.checked
                            ? [...current, amenity]
                            : current.filter((a) => a !== amenity)
                        );
                      }}
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700">{amenity}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case "photos":
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Property Photos
              </label>
              <p className="text-sm text-gray-500 mb-4">
                Upload high-quality photos of your property. The first photo
                will be the main image.
              </p>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <label className="cursor-pointer">
                  <span className="text-blue-600 hover:text-blue-700 font-medium">
                    Click to upload
                  </span>
                  <span className="text-gray-600"> or drag and drop</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  PNG, JPG, GIF up to 10MB each
                </p>
              </div>
            </div>

            {selectedFiles.length > 0 && (
              <div>
                <h3 className="font-medium text-gray-900 mb-3">
                  Selected Photos ({selectedFiles.length})
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                          Main Photo
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case "review":
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-2">
                Review Your Property
              </h3>
              <p className="text-blue-700 text-sm">
                Please review all the information before submitting. You can go
                back to edit any section.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Details</h4>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-gray-600">Name:</dt>
                    <dd className="font-medium">{formData.name}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Type:</dt>
                    <dd className="font-medium">{formData.propertyType}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Capacity:</dt>
                    <dd className="font-medium">
                      {formData.bedrooms} beds • {formData.bathrooms} baths •{" "}
                      {formData.maxGuests} guests
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Location</h4>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-gray-600">Address:</dt>
                    <dd className="font-medium">{formData.address}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">City:</dt>
                    <dd className="font-medium">
                      {formData.city}, {formData.state}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Country:</dt>
                    <dd className="font-medium">{formData.country}</dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Pricing</h4>
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-gray-600">Price:</dt>
                    <dd className="font-medium">${formData.price}/night</dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Cleaning Fee:</dt>
                    <dd className="font-medium">
                      ${formData.cleaningFee ?? 0}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-gray-600">Stay Duration:</dt>
                    <dd className="font-medium">
                      {formData.minStay}-{formData.maxStay} nights
                    </dd>
                  </div>
                </dl>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Amenities</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.amenities?.map((amenity) => (
                    <span
                      key={amenity}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                    >
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">Photos</h4>
              <p className="text-sm text-gray-600">
                {selectedFiles.length} photo(s) ready to upload
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add New Property</h1>
          <p className="text-gray-600 mt-1">
            Fill in the details to list your property
          </p>
        </div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-8">
          {STEPS.map((step, index) => (
            <div key={step} className="flex-1 flex items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    index <= currentStepIndex
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {index < currentStepIndex ? (
                    <Check className="h-6 w-6" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span className="text-xs mt-2 text-gray-600 text-center">
                  {STEP_TITLES[step]}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`flex-1 h-1 mx-2 ${
                    index < currentStepIndex ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="min-h-[400px]">{renderStepContent()}</div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={previousStep}
            disabled={isFirstStep}
            className="flex items-center gap-2 px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </button>

          {isLastStep ? (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Create Property
                </>
              )}
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
