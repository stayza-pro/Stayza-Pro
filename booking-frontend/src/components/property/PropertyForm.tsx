"use client";

import React, { useState } from "react";
import { Building2 } from "lucide-react";
import { Button, Input, Card } from "../ui";
import { PropertyFormData, Property, PropertyAmenity } from "../../types";

const propertyTypes: Array<{ value: Property["type"]; label: string }> = [
  { value: "APARTMENT", label: "Apartment" },
  { value: "HOUSE", label: "House" },
  { value: "VILLA", label: "Villa" },
  { value: "COTTAGE", label: "Cottage" },
  { value: "STUDIO", label: "Studio" },
  { value: "LOFT", label: "Loft" },
  { value: "TOWNHOUSE", label: "Townhouse" },
  { value: "OTHER", label: "Other" },
];

const commonAmenities: PropertyAmenity[] = [
  "WIFI",
  "KITCHEN",
  "PARKING",
  "POOL",
  "GYM",
  "AC",
  "HEATING",
  "BALCONY",
  "GARDEN",
  "PET_FRIENDLY",
  "WASHING_MACHINE",
  "TV",
  "HOT_TUB",
  "BBQ",
  "FIREPLACE",
];

const getAmenityDisplayName = (amenity: PropertyAmenity): string => {
  const displayNames: Record<PropertyAmenity, string> = {
    WIFI: "WiFi",
    KITCHEN: "Kitchen",
    PARKING: "Parking",
    POOL: "Pool",
    GYM: "Gym",
    AC: "Air Conditioning",
    HEATING: "Heating",
    BALCONY: "Balcony",
    GARDEN: "Garden",
    PET_FRIENDLY: "Pet Friendly",
    WASHING_MACHINE: "Washing Machine",
    TV: "TV",
    HOT_TUB: "Hot Tub",
    BBQ: "BBQ Grill",
    FIREPLACE: "Fireplace",
    WHEELCHAIR_ACCESSIBLE: "Wheelchair Accessible",
    SECURITY: "Security",
    CONCIERGE: "Concierge",
    ELEVATOR: "Elevator",
    SMOKING_ALLOWED: "Smoking Allowed",
    DISHWASHER: "Dishwasher",
    MICROWAVE: "Microwave",
    COFFEE_MAKER: "Coffee Maker",
    IRON: "Iron",
    HAIR_DRYER: "Hair Dryer",
    TOWELS: "Towels",
    LINENS: "Linens",
    SHAMPOO: "Shampoo",
    SOAP: "Soap",
  };
  return displayNames[amenity] || amenity;
};

interface PropertyFormProps {
  property?: Property;
  onSubmit: (data: PropertyFormData) => Promise<void>;
  isLoading?: boolean;
  className?: string;
  currentUser?: any; // User with realtor information
}

export const PropertyForm: React.FC<PropertyFormProps> = ({
  property,
  onSubmit,
  isLoading = false,
  className = "",
  currentUser,
}) => {
  const [formData, setFormData] = useState<PropertyFormData>({
    title: property?.title || "",
    description: property?.description || "",
    type: property?.type || "APARTMENT",
    pricePerNight: property?.pricePerNight ?? 0,
    currency: property?.currency || "NGN",
    maxGuests: property?.maxGuests || 1,
    bedrooms: property?.bedrooms || 1,
    bathrooms: property?.bathrooms || 1,
    amenities: property?.amenities || [],
    address: property?.address || "",
    city: property?.city || "",
    state: property?.state || "",
    country: property?.country || "",
    latitude: property?.latitude,
    longitude: property?.longitude,
    houseRules: property?.houseRules || [],
    checkInTime: property?.checkInTime || "15:00",
    checkOutTime: property?.checkOutTime || "11:00",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = <K extends keyof PropertyFormData>(
    field: K,
    value: PropertyFormData[K]
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  const handleAmenityToggle = (amenity: PropertyAmenity) => {
    const updatedAmenities = formData.amenities.includes(amenity)
      ? formData.amenities.filter((a) => a !== amenity)
      : [...formData.amenities, amenity];

    handleInputChange("amenities", updatedAmenities);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (formData.pricePerNight <= 0) {
      newErrors.pricePerNight = "Price must be greater than 0";
    }

    if (formData.maxGuests < 1) {
      newErrors.maxGuests = "Must accommodate at least 1 guest";
    }

    if (formData.bedrooms < 1) {
      newErrors.bedrooms = "Must have at least 1 bedroom";
    }

    if (formData.bathrooms < 1) {
      newErrors.bathrooms = "Must have at least 1 bathroom";
    }

    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }

    if (!formData.city.trim()) {
      newErrors.city = "City is required";
    }

    if (!formData.state.trim()) {
      newErrors.state = "State is required";
    }

    if (!formData.country.trim()) {
      newErrors.country = "Country is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      
    }
  };

  // Check CAC approval status for realtors
  const isRealtorCacApproved = currentUser?.realtor?.cacStatus === "APPROVED";
  const isRealtor = currentUser?.role === "REALTOR";

  // If user is a realtor but CAC is not approved, show message
  if (isRealtor && !isRealtorCacApproved) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center bg-yellow-50 border-yellow-200">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <Building2 className="w-8 h-8 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                CAC Verification Required
              </h3>
              <p className="text-gray-600 mb-4">
                Your CAC (Corporate Affairs Commission) number needs to be
                verified before you can upload properties. This ensures
                compliance with Nigerian business regulations.
              </p>
              <p className="text-sm text-yellow-800 bg-yellow-100 p-3 rounded-lg">
                Current Status:{" "}
                <strong>
                  {currentUser?.realtor?.cacStatus === "PENDING" &&
                    "Pending Verification"}
                  {currentUser?.realtor?.cacStatus === "REJECTED" &&
                    "Verification Failed"}
                  {currentUser?.realtor?.cacStatus === "SUSPENDED" &&
                    "Account Suspended"}
                </strong>
              </p>
            </div>
            {currentUser?.realtor?.cacStatus === "REJECTED" &&
              currentUser?.realtor?.canAppeal && (
                <p className="text-sm text-red-600">
                  You can submit an appeal from your dashboard if you believe
                  this rejection was incorrect.
                </p>
              )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {/* Basic Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Basic Information
        </h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Property Title *
            </label>
            <Input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Beautiful lakeside cabin..."
              disabled={isLoading}
              className={errors.title ? "border-red-500" : ""}
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description *
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={4}
              placeholder="Describe your property in detail..."
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Property Type *
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) =>
                  handleInputChange("type", e.target.value as Property["type"])
                }
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {propertyTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="currency"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Currency
              </label>
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => handleInputChange("currency", e.target.value)}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="NGN">₦ Naira</option>
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Pricing and Capacity */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Pricing & Capacity
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label
              htmlFor="pricePerNight"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Price per Night *
            </label>
            <Input
              id="pricePerNight"
              type="number"
              min="0"
              step="0.01"
              value={formData.pricePerNight}
              onChange={(e) =>
                handleInputChange(
                  "pricePerNight",
                  parseFloat(e.target.value) ?? 0
                )
              }
              disabled={isLoading}
              className={errors.pricePerNight ? "border-red-500" : ""}
            />
            {errors.pricePerNight && (
              <p className="text-red-500 text-sm mt-1">
                {errors.pricePerNight}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="maxGuests"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Max Guests *
            </label>
            <Input
              id="maxGuests"
              type="number"
              min="1"
              value={formData.maxGuests}
              onChange={(e) =>
                handleInputChange("maxGuests", parseInt(e.target.value) || 1)
              }
              disabled={isLoading}
              className={errors.maxGuests ? "border-red-500" : ""}
            />
            {errors.maxGuests && (
              <p className="text-red-500 text-sm mt-1">{errors.maxGuests}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="bedrooms"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Bedrooms *
            </label>
            <Input
              id="bedrooms"
              type="number"
              min="1"
              value={formData.bedrooms}
              onChange={(e) =>
                handleInputChange("bedrooms", parseInt(e.target.value) || 1)
              }
              disabled={isLoading}
              className={errors.bedrooms ? "border-red-500" : ""}
            />
            {errors.bedrooms && (
              <p className="text-red-500 text-sm mt-1">{errors.bedrooms}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="bathrooms"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Bathrooms *
            </label>
            <Input
              id="bathrooms"
              type="number"
              min="1"
              value={formData.bathrooms}
              onChange={(e) =>
                handleInputChange("bathrooms", parseInt(e.target.value) || 1)
              }
              disabled={isLoading}
              className={errors.bathrooms ? "border-red-500" : ""}
            />
            {errors.bathrooms && (
              <p className="text-red-500 text-sm mt-1">{errors.bathrooms}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Location */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="address"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Street Address *
            </label>
            <Input
              id="address"
              type="text"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="123 Main Street"
              disabled={isLoading}
              className={errors.address ? "border-red-500" : ""}
            />
            {errors.address && (
              <p className="text-red-500 text-sm mt-1">{errors.address}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                htmlFor="city"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                City *
              </label>
              <Input
                id="city"
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange("city", e.target.value)}
                placeholder="Lagos"
                disabled={isLoading}
                className={errors.city ? "border-red-500" : ""}
              />
              {errors.city && (
                <p className="text-red-500 text-sm mt-1">{errors.city}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="state"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                State/Province *
              </label>
              <Input
                id="state"
                type="text"
                value={formData.state}
                onChange={(e) => handleInputChange("state", e.target.value)}
                placeholder="Lagos State"
                disabled={isLoading}
                className={errors.state ? "border-red-500" : ""}
              />
              {errors.state && (
                <p className="text-red-500 text-sm mt-1">{errors.state}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="country"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Country *
              </label>
              <Input
                id="country"
                type="text"
                value={formData.country}
                onChange={(e) => handleInputChange("country", e.target.value)}
                placeholder="Nigeria"
                disabled={isLoading}
                className={errors.country ? "border-red-500" : ""}
              />
              {errors.country && (
                <p className="text-red-500 text-sm mt-1">{errors.country}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="latitude"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Latitude (Optional)
              </label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude || ""}
                onChange={(e) =>
                  handleInputChange(
                    "latitude",
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                placeholder="6.5244"
                disabled={isLoading}
              />
            </div>

            <div>
              <label
                htmlFor="longitude"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Longitude (Optional)
              </label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude || ""}
                onChange={(e) =>
                  handleInputChange(
                    "longitude",
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                placeholder="3.3792"
                disabled={isLoading}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Amenities */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Amenities</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {commonAmenities.map((amenity) => (
            <label
              key={amenity}
              className="flex items-center space-x-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={formData.amenities.includes(amenity)}
                onChange={() => handleAmenityToggle(amenity)}
                disabled={isLoading}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">
                {getAmenityDisplayName(amenity)}
              </span>
            </label>
          ))}
        </div>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={isLoading}
          disabled={isLoading}
        >
          {property ? "Update Property" : "Create Property"}
        </Button>
      </div>
    </form>
  );
};

