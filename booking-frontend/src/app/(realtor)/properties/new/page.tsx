"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useBranding } from "@/hooks/useBranding";
import { propertyService } from "@/services/properties";
import { PropertyFormData, PropertyType, PropertyAmenity } from "@/types";
import toast, { Toaster } from "react-hot-toast";
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
  Wifi,
  Tv,
  Car,
  Coffee,
  Wind,
  Waves,
  Dumbbell,
  X,
  Upload,
  AlertCircle,
  CheckCircle,
  Utensils,
  Shirt,
  Droplet,
  Flame,
  Snowflake,
  Dog,
  Cigarette,
  Accessibility,
  Shield,
  Clock,
  MonitorPlay,
  UtensilsCrossed,
  Microwave,
  CupSoda,
  BedDouble,
  Armchair,
  Sparkles,
  Building,
  ShowerHead,
  Refrigerator,
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

const STEP_CONFIG = {
  details: {
    title: "Property Details",
    icon: Home,
    description: "Basic information about your property",
  },
  location: {
    title: "Location",
    icon: MapPin,
    description: "Where is your property located?",
  },
  pricing: {
    title: "Pricing & Capacity",
    icon: DollarSign,
    description: "Set your pricing and guest capacity",
  },
  amenities: {
    title: "Amenities",
    icon: Coffee,
    description: "What does your property offer?",
  },
  photos: {
    title: "Photos",
    icon: ImageIcon,
    description: "Upload attractive photos",
  },
  review: {
    title: "Review & Submit",
    icon: CheckCircle,
    description: "Review and publish your listing",
  },
};

// Comprehensive amenities for short-term rentals
const AMENITIES_OPTIONS: {
  value: PropertyAmenity;
  label: string;
  icon: any;
  category: string;
}[] = [
  // Essential Amenities
  { value: "WIFI", label: "WiFi", icon: Wifi, category: "Essential" },
  { value: "TV", label: "TV & Streaming", icon: Tv, category: "Essential" },
  { value: "AC", label: "Air Conditioning", icon: Wind, category: "Essential" },
  { value: "HEATING", label: "Heating", icon: Flame, category: "Essential" },
  {
    value: "KITCHEN",
    label: "Full Kitchen",
    icon: Utensils,
    category: "Essential",
  },

  // Kitchen & Dining
  {
    value: "DISHWASHER",
    label: "Dishwasher",
    icon: Droplet,
    category: "Kitchen",
  },
  {
    value: "MICROWAVE",
    label: "Microwave",
    icon: Microwave,
    category: "Kitchen",
  },
  {
    value: "COFFEE_MAKER",
    label: "Coffee Maker",
    icon: CupSoda,
    category: "Kitchen",
  },

  // Bathroom
  {
    value: "HAIR_DRYER",
    label: "Hair Dryer",
    icon: Wind,
    category: "Bathroom",
  },
  { value: "SHAMPOO", label: "Shampoo", icon: Droplet, category: "Bathroom" },
  { value: "SOAP", label: "Body Soap", icon: Sparkles, category: "Bathroom" },

  // Bedroom & Laundry
  {
    value: "WASHING_MACHINE",
    label: "Washing Machine",
    icon: Shirt,
    category: "Laundry",
  },
  { value: "IRON", label: "Iron & Board", icon: Shirt, category: "Laundry" },
  {
    value: "LINENS",
    label: "Bed Linens",
    icon: BedDouble,
    category: "Bedroom",
  },
  { value: "TOWELS", label: "Towels", icon: Shirt, category: "Bedroom" },

  // Outdoor & Recreation
  { value: "PARKING", label: "Free Parking", icon: Car, category: "Outdoor" },
  { value: "POOL", label: "Swimming Pool", icon: Waves, category: "Outdoor" },
  { value: "GYM", label: "Gym/Fitness", icon: Dumbbell, category: "Outdoor" },
  { value: "BALCONY", label: "Balcony/Patio", icon: Home, category: "Outdoor" },
  {
    value: "BBQ",
    label: "BBQ Grill",
    icon: UtensilsCrossed,
    category: "Outdoor",
  },
  { value: "GARDEN", label: "Garden/Yard", icon: Home, category: "Outdoor" },

  // Luxury & Special Features
  { value: "HOT_TUB", label: "Hot Tub", icon: Waves, category: "Luxury" },
  { value: "FIREPLACE", label: "Fireplace", icon: Flame, category: "Luxury" },
  {
    value: "ELEVATOR",
    label: "Elevator Access",
    icon: Building,
    category: "Luxury",
  },
  {
    value: "CONCIERGE",
    label: "Concierge Service",
    icon: Users,
    category: "Luxury",
  },

  // Safety & Accessibility
  {
    value: "SECURITY",
    label: "24/7 Security",
    icon: Shield,
    category: "Safety",
  },
  {
    value: "WHEELCHAIR_ACCESSIBLE",
    label: "Wheelchair Accessible",
    icon: Accessibility,
    category: "Safety",
  },

  // Policies
  {
    value: "PET_FRIENDLY",
    label: "Pet Friendly",
    icon: Dog,
    category: "Policies",
  },
  {
    value: "SMOKING_ALLOWED",
    label: "Smoking Allowed",
    icon: Cigarette,
    category: "Policies",
  },
];

// Currency symbols mapping
const CURRENCY_SYMBOLS: { [key: string]: string } = {
  NGN: "₦",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

export default function AddPropertyPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { branding } = useBranding();
  const [currentStep, setCurrentStep] = useState<Step>("details");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<PropertyFormData>>({
    type: "APARTMENT" as PropertyType,
    currency: "NGN",
    amenities: [],
    customAmenities: [],
    houseRules: [],
    country: "Nigeria",
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    checkInTime: "14:00",
    checkOutTime: "11:00",
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const brandColors = branding?.colors || {
    primary: "#3B82F6",
    secondary: "#1E40AF",
    accent: "#F59E0B",
  };

  const currentStepIndex = STEPS.indexOf(currentStep);
  const isLastStep = currentStep === "review";
  const isFirstStep = currentStep === "details";

  const updateFormData = (field: keyof PropertyFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAmenity = (amenity: PropertyAmenity) => {
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
    // Validate current step before moving forward
    if (!validateCurrentStep()) {
      return;
    }

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

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case "details":
        if (!formData.title || !formData.description || !formData.type) {
          toast.error(
            "Please fill in all required fields (Title, Description, Type)"
          );
          return false;
        }
        if (formData.title.length < 10) {
          toast.error("Title must be at least 10 characters long");
          return false;
        }
        if (formData.description.length < 50) {
          toast.error("Description must be at least 50 characters long");
          return false;
        }
        return true;
      case "location":
        if (!formData.address || !formData.city || !formData.state) {
          toast.error("Please fill in all required location fields");
          return false;
        }
        return true;
      case "pricing":
        if (!formData.pricePerNight || formData.pricePerNight <= 0) {
          toast.error("Please set a valid price per night");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedFiles.length > 10) {
      toast.error("Maximum 10 photos allowed");
      return;
    }

    // Create preview URLs
    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);
    setSelectedFiles((prev) => [...prev, ...files]);
  };

  const removeFile = (index: number) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(previewUrls[index]);
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate required fields
      if (
        !formData.title ||
        !formData.description ||
        !formData.address ||
        !formData.city ||
        !formData.state ||
        !formData.pricePerNight
      ) {
        toast.error("Please fill in all required fields");
        return;
      }

      // Filter out fields not supported by backend
      const propertyData = {
        title: formData.title,
        description: formData.description,
        type: formData.type,
        pricePerNight: formData.pricePerNight,
        currency: formData.currency || "NGN",
        maxGuests: formData.maxGuests,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        amenities: formData.amenities || [],
        customAmenities: formData.customAmenities || [],
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country || "Nigeria",
        // Optional fees
        cleaningFee: formData.cleaningFee,
        securityDeposit: formData.securityDeposit,
      };

      // Create property
      const property = await propertyService.createProperty(
        propertyData as PropertyFormData
      );

      // Upload images if any
      if (selectedFiles.length > 0) {
        await propertyService.uploadImages(property.id, selectedFiles);
      }

      toast.success("🎉 Property created successfully!");
      router.push("/properties");
    } catch (error: any) {
      console.error("Error creating property:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to create property. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => {
            const StepIcon = STEP_CONFIG[step].icon;
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;

            return (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                        ? "text-white shadow-lg ring-4 ring-opacity-30"
                        : "bg-gray-200 text-gray-500"
                    }`}
                    style={
                      isActive ? { backgroundColor: brandColors.primary } : {}
                    }
                  >
                    {isCompleted ? (
                      <Check className="h-6 w-6" />
                    ) : (
                      <StepIcon className="h-6 w-6" />
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 text-center font-medium ${
                      isActive ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {STEP_CONFIG[step].title}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${
                      index < currentStepIndex ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            {STEP_CONFIG[currentStep].description}
          </p>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "details":
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Property Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title || ""}
                onChange={(e) => updateFormData("title", e.target.value)}
                placeholder="e.g., Luxury Downtown Apartment with City View"
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all ${
                  formData.title && formData.title.length < 10
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-[#c7a162]"
                }`}
                required
                minLength={10}
                maxLength={200}
              />
              <div className="flex justify-between items-center mt-1">
                <p
                  className={`text-xs ${
                    formData.title && formData.title.length < 10
                      ? "text-red-500 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  {formData.title && formData.title.length < 10
                    ? `${10 - formData.title.length} more characters required`
                    : "Minimum 10 characters required"}
                </p>
                <p className="text-xs text-gray-500">
                  {formData.title?.length || 0} / 200
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Property Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.type || "APARTMENT"}
                onChange={(e) =>
                  updateFormData("type", e.target.value as PropertyType)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all"
              >
                <option value="APARTMENT">Apartment</option>
                <option value="HOUSE">House</option>
                <option value="VILLA">Villa</option>
                <option value="STUDIO">Studio</option>
                <option value="TOWNHOUSE">Townhouse</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) => updateFormData("description", e.target.value)}
                placeholder="Describe your property in detail... Include nearby attractions, unique features, and what makes it special."
                rows={6}
                className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:border-transparent transition-all resize-none ${
                  formData.description && formData.description.length < 50
                    ? "border-red-300 focus:ring-red-200"
                    : "border-gray-300 focus:ring-[#c7a162]"
                }`}
                required
                minLength={50}
                maxLength={2000}
              />
              <div className="flex justify-between items-center mt-1">
                <p
                  className={`text-xs ${
                    formData.description && formData.description.length < 50
                      ? "text-red-500 font-medium"
                      : "text-gray-500"
                  }`}
                >
                  {formData.description && formData.description.length < 50
                    ? `${
                        50 - formData.description.length
                      } more characters required`
                    : "Minimum 50 characters required"}
                </p>
                <p className="text-xs text-gray-500">
                  {formData.description?.length || 0} / 2000
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Bed className="inline h-4 w-4 mr-1" />
                  Bedrooms <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.bedrooms || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    updateFormData(
                      "bedrooms",
                      value === "" ? "" : parseInt(value) ?? 0
                    );
                  }}
                  onBlur={(e) => {
                    if (e.target.value === "" || parseInt(e.target.value) < 0) {
                      updateFormData("bedrooms", 1);
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Bath className="inline h-4 w-4 mr-1" />
                  Bathrooms <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.bathrooms || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    updateFormData(
                      "bathrooms",
                      value === "" ? "" : parseInt(value) ?? 0
                    );
                  }}
                  onBlur={(e) => {
                    if (e.target.value === "" || parseInt(e.target.value) < 0) {
                      updateFormData("bathrooms", 1);
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Users className="inline h-4 w-4 mr-1" />
                  Max Guests <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.maxGuests || ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    updateFormData(
                      "maxGuests",
                      value === "" ? "" : parseInt(value) ?? 0
                    );
                  }}
                  onBlur={(e) => {
                    if (e.target.value === "" || parseInt(e.target.value) < 1) {
                      updateFormData("maxGuests", 2);
                    }
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all"
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
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address || ""}
                onChange={(e) => updateFormData("address", e.target.value)}
                placeholder="123 Main Street, Building Name, Apt 4B"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.city || ""}
                  onChange={(e) => updateFormData("city", e.target.value)}
                  placeholder="Lagos"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.state || ""}
                  onChange={(e) => updateFormData("state", e.target.value)}
                  placeholder="Lagos State"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.country || "Nigeria"}
                onChange={(e) => updateFormData("country", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all"
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Location Tips
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Provide accurate location details. This helps guests find
                    your property easily and improves your listing's visibility.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "pricing":
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={formData.currency || "NGN"}
                onChange={(e) => updateFormData("currency", e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all"
              >
                <option value="NGN">₦ Nigerian Naira (NGN)</option>
                <option value="USD">$ US Dollar (USD)</option>
                <option value="EUR">€ Euro (EUR)</option>
                <option value="GBP">£ British Pound (GBP)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Price Per Night <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl font-semibold text-gray-600">
                  {CURRENCY_SYMBOLS[formData.currency || "NGN"]}
                </div>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={formData.pricePerNight || ""}
                  onChange={(e) =>
                    updateFormData(
                      "pricePerNight",
                      parseFloat(e.target.value) ?? 0
                    )
                  }
                  placeholder="150.00"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all text-lg font-medium"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Set a competitive price based on your property's features and
                location
              </p>
            </div>

            {/* Optional Fees Section */}
            <div className="space-y-4 p-6 bg-blue-50 rounded-xl border-2 border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">
                  Optional Fees (All amounts are optional)
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Add optional fees that will be charged to guests. These fees are
                in addition to the nightly rate.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cleaning Fee
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lg text-gray-600">
                      {CURRENCY_SYMBOLS[formData.currency || "NGN"]}
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.cleaningFee || ""}
                      onChange={(e) =>
                        updateFormData(
                          "cleaningFee",
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      placeholder="0.00"
                      className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    One-time cleaning charge
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Security Deposit
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lg text-gray-600">
                      {CURRENCY_SYMBOLS[formData.currency || "NGN"]}
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.securityDeposit || ""}
                      onChange={(e) =>
                        updateFormData(
                          "securityDeposit",
                          e.target.value
                            ? parseFloat(e.target.value)
                            : undefined
                        )
                      }
                      placeholder="0.00"
                      className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent transition-all"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Refundable damage deposit
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Check-in Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={formData.checkInTime || "14:00"}
                    onChange={(e) =>
                      updateFormData("checkInTime", e.target.value)
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 hover:border-blue-300 group-hover:shadow-md cursor-pointer"
                    style={{
                      background:
                        "linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%)",
                    }}
                  />
                  <div className="absolute inset-0 rounded-xl pointer-events-none transition-all duration-300 group-hover:ring-2 ring-blue-200"></div>
                </div>
              </div>

              <div className="group">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-1" />
                  Check-out Time
                </label>
                <div className="relative">
                  <input
                    type="time"
                    value={formData.checkOutTime || "11:00"}
                    onChange={(e) =>
                      updateFormData("checkOutTime", e.target.value)
                    }
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:border-transparent transition-all duration-300 hover:border-purple-300 group-hover:shadow-md cursor-pointer"
                    style={{
                      background:
                        "linear-gradient(135deg, #ffffff 0%, #faf5ff 100%)",
                    }}
                  />
                  <div className="absolute inset-0 rounded-xl pointer-events-none transition-all duration-300 group-hover:ring-2 ring-purple-200"></div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Pricing Strategy
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Research similar properties in your area to set competitive
                    rates. You can always adjust pricing later.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "amenities":
        // Group amenities by category
        const categories = Array.from(
          new Set(AMENITIES_OPTIONS.map((a) => a.category))
        );

        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select Available Amenities
              </h3>
              <p className="text-sm text-gray-600 mb-6">
                Choose all amenities that your property offers. Guests often
                search by specific amenities.
              </p>

              {categories.map((category) => {
                const categoryAmenities = AMENITIES_OPTIONS.filter(
                  (a) => a.category === category
                );

                return (
                  <div key={category} className="mb-6">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <span
                        className="w-2 h-2 rounded-full mr-2"
                        style={{ backgroundColor: brandColors.primary }}
                      ></span>
                      {category}
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {categoryAmenities.map((amenity) => {
                        const AmenityIcon = amenity.icon;
                        const isSelected = formData.amenities?.includes(
                          amenity.value
                        );

                        return (
                          <button
                            key={amenity.value}
                            type="button"
                            onClick={() => toggleAmenity(amenity.value)}
                            className={`relative p-4 border-2 rounded-xl transition-all duration-200 hover:shadow-md ${
                              isSelected
                                ? "border-current shadow-lg scale-105"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            style={
                              isSelected
                                ? {
                                    borderColor: brandColors.primary,
                                    backgroundColor: brandColors.primary + "10",
                                  }
                                : {}
                            }
                          >
                            {isSelected && (
                              <div
                                className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md"
                                style={{ backgroundColor: brandColors.primary }}
                              >
                                <Check className="h-4 w-4" />
                              </div>
                            )}
                            <AmenityIcon
                              className="h-7 w-7 mb-2 mx-auto transition-transform duration-200 group-hover:scale-110"
                              style={
                                isSelected
                                  ? { color: brandColors.primary }
                                  : { color: "#6B7280" }
                              }
                            />
                            <p className="text-xs font-medium text-center leading-tight">
                              {amenity.label}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Amenities Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <span
                  className="w-2 h-2 rounded-full mr-2"
                  style={{ backgroundColor: brandColors.primary }}
                ></span>
                Other Amenities (Custom)
              </h4>
              <p className="text-xs text-gray-600 mb-4">
                Add any unique amenities not listed above. Separate each with
                Enter/Return.
              </p>

              {/* Input for new custom amenity */}
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  placeholder="e.g., Beach Access, Mountain View, Private Chef..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#c7a162] focus:border-transparent text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      e.preventDefault();
                      const value = e.currentTarget.value.trim().toUpperCase();
                      if (value && !formData.customAmenities?.includes(value)) {
                        updateFormData("customAmenities", [
                          ...(formData.customAmenities || []),
                          value,
                        ]);
                        e.currentTarget.value = "";
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    const input = e.currentTarget
                      .previousElementSibling as HTMLInputElement;
                    const value = input.value.trim().toUpperCase();
                    if (value && !formData.customAmenities?.includes(value)) {
                      updateFormData("customAmenities", [
                        ...(formData.customAmenities || []),
                        value,
                      ]);
                      input.value = "";
                    }
                  }}
                  className="px-4 py-2 text-white rounded-lg transition-colors text-sm font-medium"
                  style={{ backgroundColor: brandColors.primary }}
                >
                  Add
                </button>
              </div>

              {/* Display custom amenities */}
              {formData.customAmenities &&
                formData.customAmenities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.customAmenities.map((amenity, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border-2"
                        style={{
                          borderColor: brandColors.primary,
                          backgroundColor: brandColors.primary + "10",
                          color: brandColors.primary,
                        }}
                      >
                        <span className="font-medium">{amenity}</span>
                        <button
                          type="button"
                          onClick={() => {
                            updateFormData(
                              "customAmenities",
                              formData.customAmenities!.filter(
                                (_, i) => i !== index
                              )
                            );
                          }}
                          className="hover:opacity-70 transition-opacity"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
            </div>

            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">
                    Amenities Matter
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Properties with more amenities typically receive more
                    bookings. Select all that apply to your property. Selected:{" "}
                    {(formData.amenities?.length ?? 0) +
                      (formData.customAmenities?.length ?? 0)}{" "}
                    total ({formData.amenities?.length ?? 0} standard +{" "}
                    {formData.customAmenities?.length ?? 0} custom)
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case "photos":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Upload Property Photos
              </h3>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  id="file-upload"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, JPEG up to 5MB each (Max 10 photos)
                  </p>
                </label>
              </div>
            </div>

            {previewUrls.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Selected Photos ({previewUrls.length}/10)
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={url}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {index === 0 && (
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-green-500 text-white text-xs font-medium rounded">
                          Cover Photo
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <ImageIcon className="h-5 w-5 text-purple-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-900">
                    Photo Tips
                  </p>
                  <ul className="text-xs text-purple-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Use high-quality, well-lit photos</li>
                    <li>First photo will be the cover image</li>
                    <li>Show different angles and rooms</li>
                    <li>Include outdoor spaces if available</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );

      case "review":
        return (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Almost Done! 🎉
              </h3>
              <p className="text-sm text-gray-600">
                Review your listing details below and click "Publish Property"
                when you're ready.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <h4 className="font-semibold text-gray-900 border-b pb-2">
                Property Details
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Name</p>
                  <p className="font-medium">{formData.title || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Type</p>
                  <p className="font-medium">{formData.type || "-"}</p>
                </div>
                <div>
                  <p className="text-gray-500">Bedrooms</p>
                  <p className="font-medium">{formData.bedrooms ?? 0}</p>
                </div>
                <div>
                  <p className="text-gray-500">Bathrooms</p>
                  <p className="font-medium">{formData.bathrooms ?? 0}</p>
                </div>
                <div>
                  <p className="text-gray-500">Max Guests</p>
                  <p className="font-medium">{formData.maxGuests ?? 0}</p>
                </div>
                <div>
                  <p className="text-gray-500">Price Per Night</p>
                  <p className="font-medium">
                    {formData.currency} {formData.pricePerNight ?? 0}
                  </p>
                </div>
                {(formData.cleaningFee || formData.securityDeposit) && (
                  <>
                    {formData.cleaningFee && (
                      <div>
                        <p className="text-gray-500">Cleaning Fee</p>
                        <p className="font-medium">
                          {formData.currency} {formData.cleaningFee}
                        </p>
                      </div>
                    )}
                    {formData.securityDeposit && (
                      <div>
                        <p className="text-gray-500">
                          Security Deposit (Refundable)
                        </p>
                        <p className="font-medium">
                          {formData.currency} {formData.securityDeposit}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <h4 className="font-semibold text-gray-900 border-b pb-2">
                Location
              </h4>
              <div className="text-sm">
                <p className="text-gray-700">
                  {formData.address}, {formData.city}, {formData.state},{" "}
                  {formData.country}
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <h4 className="font-semibold text-gray-900 border-b pb-2">
                Amenities
              </h4>
              <div className="flex flex-wrap gap-2">
                {(formData.amenities && formData.amenities.length > 0) ||
                (formData.customAmenities &&
                  formData.customAmenities.length > 0) ? (
                  <>
                    {formData.amenities?.map((amenity) => (
                      <span
                        key={amenity}
                        className="px-3 py-1 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: `${brandColors.primary}20`,
                          color: brandColors.primary,
                        }}
                      >
                        {amenity}
                      </span>
                    ))}
                    {formData.customAmenities?.map((amenity) => (
                      <span
                        key={amenity}
                        className="px-3 py-1 text-xs font-medium rounded-full"
                        style={{
                          backgroundColor: `${brandColors.primary}20`,
                          color: brandColors.primary,
                        }}
                      >
                        {amenity}
                      </span>
                    ))}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">No amenities selected</p>
                )}
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
              <h4 className="font-semibold text-gray-900 border-b pb-2">
                Photos
              </h4>
              <p className="text-sm text-gray-600">
                {selectedFiles.length} photo(s) selected
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: brandColors.primary,
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Properties</span>
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Create New Property Listing
              </h1>
              <p className="text-gray-600">
                Fill in the details to list your property on{" "}
                {branding?.businessName || "Stayza"}
              </p>
            </div>
            <div className="hidden md:block">
              <div
                className="px-4 py-2 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: brandColors.primary }}
              >
                Step {currentStepIndex + 1} of {STEPS.length}
              </div>
            </div>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Progress Steps */}
          {renderStepIndicator()}

          {/* Step Content */}
          <div className="min-h-[500px] py-8">{renderStepContent()}</div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={previousStep}
              disabled={isFirstStep}
              className="flex items-center gap-2 px-6 py-3 text-gray-700 border-2 border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium"
            >
              <ArrowLeft className="h-4 w-4" />
              Previous
            </button>

            {isLastStep ? (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-8 py-3 text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold"
                style={{ backgroundColor: brandColors.primary }}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  <>
                    <Check className="h-5 w-5" />
                    Publish Property
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-8 py-3 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
                style={{ backgroundColor: brandColors.primary }}
              >
                Next Step
                <ArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            Need help? Check our{" "}
            <a href="#" className="underline hover:text-gray-700">
              Property Listing Guide
            </a>{" "}
            or{" "}
            <a href="#" className="underline hover:text-gray-700">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
