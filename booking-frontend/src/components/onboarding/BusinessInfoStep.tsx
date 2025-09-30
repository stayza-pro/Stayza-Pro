import React, { useState, ChangeEvent } from "react";
import { Button, Input, Select, TextArea } from "@/components/ui";
import { Building, MapPin, Phone, Mail } from "lucide-react";
import { OnboardingData } from "@/app/onboarding/page";

interface BusinessInfoStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  onNext: () => void;
  isSubmitting: boolean;
}

const BUSINESS_TYPES = [
  { value: "property_management", label: "Property Management Company" },
  { value: "real_estate_agent", label: "Real Estate Agent" },
  { value: "individual_host", label: "Individual Host" },
  { value: "vacation_rental", label: "Vacation Rental Business" },
  { value: "hotel_motel", label: "Hotel/Motel" },
  { value: "other", label: "Other" },
];

const COUNTRIES = [
  { value: "US", label: "United States" },
  { value: "CA", label: "Canada" },
  { value: "GB", label: "United Kingdom" },
  { value: "NG", label: "Nigeria" },
  { value: "GH", label: "Ghana" },
  { value: "KE", label: "Kenya" },
  { value: "ZA", label: "South Africa" },
];

export const BusinessInfoStep: React.FC<BusinessInfoStepProps> = ({
  data,
  onUpdate,
  onNext,
  isSubmitting,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof OnboardingData, value: string) => {
    onUpdate({ [field]: value });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!data.businessName.trim()) {
      newErrors.businessName = "Business name is required";
    }
    if (!data.businessType) {
      newErrors.businessType = "Business type is required";
    }
    if (!data.businessEmail.trim()) {
      newErrors.businessEmail = "Business email is required";
    } else if (!/\S+@\S+\.\S+/.test(data.businessEmail)) {
      newErrors.businessEmail = "Invalid email format";
    }
    if (!data.businessPhone.trim()) {
      newErrors.businessPhone = "Business phone is required";
    }
    if (!data.businessAddress.trim()) {
      newErrors.businessAddress = "Business address is required";
    }
    if (!data.businessCity.trim()) {
      newErrors.businessCity = "City is required";
    }
    if (!data.businessCountry) {
      newErrors.businessCountry = "Country is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateForm()) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Building className="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Business Information</h2>
        <p className="text-gray-600 mt-2">
          Tell us about your business so we can set up your account properly
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <Input
            label="Business Name"
            value={data.businessName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("businessName", e.target.value)}
            placeholder="Your Business Name"
            error={errors.businessName}
            required
          />
        </div>

        <Select
          label="Business Type"
          value={data.businessType}
          onChange={(value: string) => handleChange("businessType", value)}
          options={BUSINESS_TYPES}
          placeholder="Select business type"
          error={errors.businessType}
          required
        />

        <Input
          label="Business Phone"
          value={data.businessPhone}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("businessPhone", e.target.value)}
          placeholder="+1 (555) 123-4567"
          error={errors.businessPhone}
          required
          leftIcon={<Phone className="w-4 h-4" />}
        />

        <div className="md:col-span-2">
          <Input
            label="Business Email"
            type="email"
            value={data.businessEmail}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("businessEmail", e.target.value)}
            placeholder="business@example.com"
            error={errors.businessEmail}
            required
            leftIcon={<Mail className="w-4 h-4" />}
          />
        </div>

        <div className="md:col-span-2">
          <Input
            label="Business Address"
            value={data.businessAddress}
            onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("businessAddress", e.target.value)}
            placeholder="123 Main Street, Suite 100"
            error={errors.businessAddress}
            required
            leftIcon={<MapPin className="w-4 h-4" />}
          />
        </div>

        <Input
          label="City"
          value={data.businessCity}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("businessCity", e.target.value)}
          placeholder="New York"
          error={errors.businessCity}
          required
        />

        <Input
          label="State/Province"
          value={data.businessState}
          onChange={(e: ChangeEvent<HTMLInputElement>) => handleChange("businessState", e.target.value)}
          placeholder="NY"
        />

        <div className="md:col-span-2">
          <Select
            label="Country"
            value={data.businessCountry}
            onChange={(value: string) => handleChange("businessCountry", value)}
            options={COUNTRIES}
            placeholder="Select country"
            error={errors.businessCountry}
            required
          />
        </div>

        <div className="md:col-span-2">
          <TextArea
            label="Business Description"
            value={data.businessDescription}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => handleChange("businessDescription", e.target.value)}
            placeholder="Briefly describe your business and the types of properties you offer..."
            rows={4}
          />
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t">
        <Button
          onClick={handleNext}
          disabled={isSubmitting}
          className="px-8"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};