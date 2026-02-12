"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  Search,
  Calendar,
  MapPin,
  Users,
  Star,
  Heart,
  Share2,
  Phone,
  Mail,
  MessageCircle,
  Shield,
  Award,
  Clock,
  CheckCircle,
  Filter,
  Grid3X3,
  List,
  ArrowRight,
  Globe,
  CreditCard,
} from "lucide-react";
import { apiClient } from "@/services/api";
import { Property } from "@/types";
import { Loading } from "@/components/ui";

interface RealtorData {
  fullName?: string;
  businessEmail?: string;
  agencyName?: string;
  customSubdomain?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  phoneNumber?: string;
  userId?: string;
}

interface RealtorWebsiteProps {
  data: RealtorData;
  logoPreview?: string | null;
  language: string;
  currency: string;
  realtorId: string;
}

const toPropertyArray = (payload: unknown): Property[] => {
  if (Array.isArray(payload)) {
    return payload as Property[];
  }

  if (payload && typeof payload === "object") {
    const typedPayload = payload as {
      properties?: Property[];
      data?: Property[];
    };

    if (Array.isArray(typedPayload.properties)) {
      return typedPayload.properties;
    }

    if (Array.isArray(typedPayload.data)) {
      return typedPayload.data;
    }
  }

  return [];
};

export const RealtorWebsite: React.FC<RealtorWebsiteProps> = ({
  data,
  logoPreview,
  currency,
  realtorId,
}) => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);

  // Color scheme with fallbacks
  const primaryColor = data.primaryColor || "#374151";
  const secondaryColor = data.secondaryColor || "#059669";
  const accentColor = data.accentColor || "#f97316";

  // Currency helper
  const getCurrencySymbol = () => {
    switch (currency?.toLowerCase()) {
      case "usd":
        return "$";
      case "eur":
        return "€";
      case "gbp":
        return "£";
      case "ngn":
      default:
        return "₦";
    }
  };

  const getNormalizedPhone = () => {
    const raw = data.phoneNumber?.trim();
    if (!raw) return "+234 901 234 5678";
    if (!raw.startsWith("+234") && !raw.startsWith("234")) {
      return `+234 ${raw}`;
    }
    return raw;
  };

  const getMaskedPhoneDisplay = () => {
    const normalized = getNormalizedPhone().replace(/\s+/g, "");
    if (normalized.length <= 6) return "Hidden until payment";
    return `${normalized.slice(0, 4)}****${normalized.slice(-2)}`;
  };

  const getMaskedEmailDisplay = () => {
    const email = (data.businessEmail || "hello@example.com").trim();
    const [local, domain] = email.split("@");
    if (!local || !domain) return "Hidden until payment";
    const safeLocal =
      local.length <= 2 ? `${local.charAt(0)}*` : `${local.slice(0, 2)}***`;
    return `${safeLocal}@${domain}`;
  };

  // Fetch realtor's properties
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get<Property[]>(
          `/properties/host/${realtorId}`
        );

        // Only show ACTIVE properties to guests
        const activeProperties = toPropertyArray(response.data).filter(
          (p: Property) => p.status === "ACTIVE"
        );

        setProperties(activeProperties);
        setFilteredProperties(activeProperties);
      } catch (error) {
        
        setProperties([]);
        setFilteredProperties([]);
      } finally {
        setLoading(false);
      }
    };

    if (realtorId) {
      fetchProperties();
    }
  }, [realtorId]);

  // Filter properties based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredProperties(properties);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = properties.filter(
      (p) =>
        p.title?.toLowerCase().includes(query) ||
        p.city?.toLowerCase().includes(query) ||
        p.address?.toLowerCase().includes(query) ||
        p.country?.toLowerCase().includes(query)
    );
    setFilteredProperties(filtered);
  }, [searchQuery, properties]);

  const PropertyCard = ({ property }: { property: Property }) => {
    const [isLiked, setIsLiked] = useState(false);
    const imageUrl = property.images?.[0]?.url || "/api/placeholder/400/300";

    const handleViewDetails = () => {
      router.push(`/browse/${property.id}`);
    };

    return (
      <motion.div
        className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer"
        whileHover={{ y: -4 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={handleViewDetails}
      >
        {/* Property Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={imageUrl}
            alt={property.title || "Property"}
            width={400}
            height={300}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            unoptimized
          />

          {/* Overlay Actions */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsLiked(!isLiked);
              }}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
            >
              <Heart
                className={`w-4 h-4 ${
                  isLiked ? "fill-red-500 text-red-500" : "text-gray-600"
                }`}
              />
            </button>
            <button
              onClick={(e) => e.stopPropagation()}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
            >
              <Share2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            <span
              className="px-3 py-1 text-white text-xs font-medium rounded-full"
              style={{ backgroundColor: secondaryColor }}
            >
              Available
            </span>
          </div>
        </div>

        {/* Property Details */}
        <div className="p-6">
          <div className="mb-4">
            <h3
              className="text-lg font-semibold text-gray-900 mb-1 transition-colors line-clamp-1 group-hover:opacity-80"
              style={{ color: "inherit" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = primaryColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "";
              }}
            >
              {property.title}
            </h3>
            <div className="flex items-center text-gray-600 text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="line-clamp-1">
                {property.city}, {property.country}
              </span>
            </div>
          </div>

          {/* Property Stats */}
          <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {property.maxGuests}
              </span>
              <span>{property.bedrooms} beds</span>
              <span>{property.bathrooms} baths</span>
            </div>
            {property.averageRating && property.averageRating > 0 && (
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                <span className="font-medium text-gray-900">
                  {property.averageRating.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Price and Book Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-gray-900">
                {getCurrencySymbol()}
                {Number(property.pricePerNight || 0).toLocaleString()}
              </span>
              <span className="text-gray-600 text-sm">/night</span>
            </div>
            <button
              className="px-6 py-2 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
              style={{ backgroundColor: primaryColor }}
              onClick={(e) => {
                e.stopPropagation();
                handleViewDetails();
              }}
            >
              View Details
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Brand */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt="Logo"
                    width={40}
                    height={40}
                    className="rounded-lg object-cover"
                    unoptimized
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {data.agencyName?.charAt(0) || "S"}
                  </div>
                )}
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    {data.agencyName || "Stayza Pro"}
                  </h1>
                  <p className="text-xs text-gray-500">
                    {data.customSubdomain || "your-domain"}.stayza.pro
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a
                href="#properties"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Properties
              </a>
              <a
                href="#about"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                About
              </a>
              <a
                href="#contact"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Contact
              </a>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-600 hover:text-gray-900 rounded-lg">
                <Globe className="w-5 h-5" />
              </button>
              <button
                onClick={() => router.push("/guest/login")}
                className="px-4 py-2 text-white font-medium rounded-lg hover:opacity-90 transition-opacity"
                style={{ backgroundColor: primaryColor }}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <motion.h1
              className="text-4xl md:text-6xl font-bold text-gray-900 mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              Find Your Perfect{" "}
              <span style={{ color: primaryColor }}>Stay</span>
            </motion.h1>
            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Discover exceptional properties handpicked for your comfort
            </motion.p>
          </div>

          {/* Search Bar */}
          <motion.div
            className="max-w-4xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by location or property name..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button
                  className="px-8 py-3 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center space-x-2"
                  style={{ backgroundColor: primaryColor }}
                >
                  <Search className="w-5 h-5" />
                  <span>Search</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Properties Section */}
      <section id="properties" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                {properties.length > 0 ? "Our Properties" : "Properties"}
              </h2>
              <p className="text-gray-600">
                {filteredProperties.length} propert
                {filteredProperties.length === 1 ? "y" : "ies"} available
              </p>
            </div>

            {/* View Controls */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-600"
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-white shadow-sm text-gray-900"
                    : "text-gray-600"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <Loading size="lg" />
            </div>
          )}

          {/* No Properties State */}
          {!loading && filteredProperties.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🏠</div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No Properties Found
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Check back soon for new listings"}
              </p>
            </div>
          )}

          {/* Properties Grid */}
          {!loading && filteredProperties.length > 0 && (
            <div
              className={`grid gap-8 ${
                viewMode === "grid"
                  ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
              }`}
            >
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              {
                icon: Shield,
                title: "Secure Booking",
                desc: "Safe and encrypted transactions",
              },
              {
                icon: Award,
                title: "Quality Verified",
                desc: "All properties are inspected",
              },
              {
                icon: Clock,
                title: "24/7 Support",
                desc: "Always here to help you",
              },
              {
                icon: CheckCircle,
                title: "Best Price",
                desc: "Competitive rates guaranteed",
              },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${primaryColor}20` }}
                >
                  <item.icon
                    className="w-8 h-8"
                    style={{ color: primaryColor }}
                  />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Company Info */}
            <div className="md:col-span-1">
              <div className="flex items-center space-x-3 mb-6">
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt="Logo"
                    width={40}
                    height={40}
                    className="rounded-lg object-cover"
                    unoptimized
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {data.agencyName?.charAt(0) || "S"}
                  </div>
                )}
                <h3 className="text-xl font-bold">
                  {data.agencyName || "Stayza Pro"}
                </h3>
              </div>
              <p className="text-gray-300 mb-6">
                Your trusted partner for exceptional accommodation experiences.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#properties"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Properties
                  </a>
                </li>
                <li>
                  <a
                    href="#about"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#contact"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Get in Touch</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Phone className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="text-gray-300">{getMaskedPhoneDisplay()}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="text-gray-300">{getMaskedEmailDisplay()}</span>
                </div>
                <p className="text-xs text-amber-300 pt-1">
                  Direct contact unlocks after a paid booking confirmation.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              © 2024 {data.agencyName || "Stayza Pro"}. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
