export interface Property {
  id: string;
  title: string;
  name?: string;
  location: string;
  type?: string;
  pricePerNight: number;
  price?: number;
  currency?: string;
  rating: number;
  features?: string;
  badge?: string;
  images: string[];
  bedrooms?: number;
  bathrooms?: number;
  amenities?: string[];
  description?: string;
  availability?: {
    startDate: string;
    endDate: string;
  };
}

export interface AgencyData {
  id?: string;
  name: string;
  tagline?: string;
  logo?: string;
  description?: string;
  fullDescription?: string;
  heroImage?: string;
  registrationNumber?: string;
  email: string;
  phone: string;
  emergencyPhone?: string;
  address?: string;
  website?: string;
  whatsappType?: "personal" | "business";
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  socialMedia?: Record<string, string>;
  customSubdomain?: string;
  businessHours?: {
    weekdays: string;
    saturday: string;
    sunday: string;
  };
  stats?: {
    totalProperties: number;
    happyGuests: number;
    yearsExperience: number;
    averageRating: number;
  };
  achievements?: string[];
}

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
  neutral: string;
}

export interface PreviewSettings {
  showHeroSection: boolean;
  showPropertiesSection: boolean;
  showAboutSection: boolean;
  showContactSection: boolean;
  showFooterSection: boolean;
  language: string;
  currency: string;
  theme: "light" | "dark" | "auto";
}

export interface PreviewData {
  agency: AgencyData;
  properties: Property[];
  colors: BrandColors;
  settings: PreviewSettings;
}

export type PreviewMode = "guest" | "dashboard";
export type PreviewRegion =
  | "hero"
  | "properties"
  | "about"
  | "contact"
  | "footer";
