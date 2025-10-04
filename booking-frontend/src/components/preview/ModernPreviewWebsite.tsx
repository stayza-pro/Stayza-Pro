"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Search,
  Calendar,
  MapPin,
  Users,
  Star,
  Heart,
  Share2,
  ChevronLeft,
  ChevronRight,
  Wifi,
  Car,
  Coffee,
  Waves,
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
import { RealtorRegistrationFormData } from "@/app/register/realtor/schema";

interface ModernPreviewWebsiteProps {
  data: Partial<RealtorRegistrationFormData>;
  logoPreview?: string | null;
  language: string;
  currency: string;
}

export const ModernPreviewWebsite: React.FC<ModernPreviewWebsiteProps> = ({
  data,
  logoPreview,
  language,
  currency,
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Color scheme with fallbacks - solid colors only
  const primaryColor = data.primaryColor || "#374151";
  const secondaryColor = data.secondaryColor || "#059669";
  const accentColor = data.accentColor || "#f97316";

  // Currency helper - defaults to Naira
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

  // Phone number with Nigerian format first
  const getPhoneDisplay = () => {
    if (data.phoneNumber) {
      // If it doesn't start with +234, add Nigerian prefix
      if (
        !data.phoneNumber.startsWith("+234") &&
        !data.phoneNumber.startsWith("234")
      ) {
        return `+234 ${data.phoneNumber}`;
      }
      return data.phoneNumber;
    }
    return "+234 901 234 5678";
  };

  // Sample Nigeria-focused properties data
  const featuredProperties = [
    {
      id: 1,
      title: "Executive Penthouse Suite",
      location: "Victoria Island, Lagos, Nigeria",
      price: 85000,
      rating: 4.9,
      reviews: 127,
      images: [
        "/api/placeholder/400/300",
        "/api/placeholder/400/301",
        "/api/placeholder/400/302",
      ],
      amenities: [
        "Lagos Lagoon View",
        "24/7 Security",
        "High-Speed WiFi",
        "Generator Backup",
      ],
      category: "luxury",
      beds: 4,
      baths: 3,
      guests: 8,
      available: true,
      discount: 15,
    },
    {
      id: 2,
      title: "Modern Business Apartment",
      location: "Ikeja GRA, Lagos, Nigeria",
      price: 45000,
      rating: 4.8,
      reviews: 89,
      images: ["/api/placeholder/400/300", "/api/placeholder/400/301"],
      amenities: ["Business District", "Gym & Pool", "WiFi", "24/7 Concierge"],
      category: "apartment",
      beds: 2,
      baths: 2,
      guests: 4,
      available: true,
    },
    {
      id: 3,
      title: "Serene Family Duplex",
      location: "Lekki Phase 2, Lagos, Nigeria",
      price: 32000,
      rating: 4.7,
      reviews: 64,
      images: ["/api/placeholder/400/300"],
      amenities: [
        "Gated Estate",
        "Children's Playground",
        "WiFi",
        "Backup Power",
      ],
      category: "house",
      beds: 3,
      baths: 2,
      guests: 6,
      available: false,
    },
  ];

  const PropertyCard = ({ property }: { property: any }) => {
    const [isLiked, setIsLiked] = useState(false);

    return (
      <motion.div
        className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
        whileHover={{ y: -4 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Property Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={property.images[0]}
            alt={property.title}
            width={400}
            height={300}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Overlay Actions */}
          <div className="absolute top-4 right-4 flex space-x-2">
            <button
              onClick={() => setIsLiked(!isLiked)}
              className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
            >
              <Heart
                className={`w-4 h-4 ${
                  isLiked ? "fill-red-500 text-red-500" : "text-gray-600"
                }`}
              />
            </button>
            <button className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors">
              <Share2 className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Status Badges */}
          <div className="absolute top-4 left-4 flex flex-col space-y-2">
            {property.discount && (
              <span className="px-3 py-1 bg-red-500 text-white text-xs font-medium rounded-full">
                {property.discount}% OFF
              </span>
            )}
            {!property.available && (
              <span className="px-3 py-1 bg-gray-800 text-white text-xs font-medium rounded-full">
                Booked
              </span>
            )}
            {property.available && (
              <span className="px-3 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                Available
              </span>
            )}
          </div>

          {/* Image Navigation */}
          {property.images.length > 1 && (
            <div className="absolute bottom-4 left-4 right-4 flex justify-center space-x-1">
              {property.images.map((_: any, idx: number) => (
                <div
                  key={idx}
                  className={`w-2 h-2 rounded-full ${
                    idx === currentImageIndex ? "bg-white" : "bg-white/50"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Property Details */}
        <div className="p-6">
          {/* Title and Location */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
              {property.title}
            </h3>
            <div className="flex items-center text-gray-600 text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              {property.location}
            </div>
          </div>

          {/* Property Stats */}
          <div className="flex items-center justify-between mb-4 text-sm text-gray-600">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                {property.guests} guests
              </span>
              <span>{property.beds} beds</span>
              <span>{property.baths} baths</span>
            </div>
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
              <span className="font-medium text-gray-900">
                {property.rating}
              </span>
              <span className="text-gray-500 ml-1">({property.reviews})</span>
            </div>
          </div>

          {/* Amenities */}
          <div className="flex flex-wrap gap-2 mb-4">
            {property.amenities.slice(0, 3).map((amenity: string) => (
              <span
                key={amenity}
                className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg"
              >
                {amenity}
              </span>
            ))}
            {property.amenities.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                +{property.amenities.length - 3} more
              </span>
            )}
          </div>

          {/* Price and Book Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl font-bold text-gray-900">
                {getCurrencySymbol()}
                {property.price.toLocaleString()}
              </span>
              <span className="text-gray-600 text-sm">/night</span>
            </div>
            <button
              className="px-6 py-2 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor }}
              disabled={!property.available}
            >
              {property.available ? "Book Now" : "Unavailable"}
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
                href="#"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Home
              </a>
              <a
                href="#"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                Properties
              </a>
              <a
                href="#"
                className="text-gray-700 hover:text-gray-900 font-medium"
              >
                About
              </a>
              <a
                href="#"
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
              Your Perfect Nigerian{" "}
              <span style={{ color: primaryColor }}>Home</span> Awaits
            </motion.h1>
            <motion.p
              className="text-xl text-gray-600 max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              Experience the best of Nigerian hospitality with verified
              properties across Lagos, Abuja, Port Harcourt, and beyond
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Lagos, Abuja, Port Harcourt..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-in
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-out
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-between items-center mt-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <Users className="w-5 h-5 text-gray-400 mr-2" />
                    <select className="border-0 focus:ring-0 text-gray-700">
                      <option>2 guests</option>
                      <option>4 guests</option>
                      <option>6 guests</option>
                      <option>8+ guests</option>
                    </select>
                  </div>
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

      {/* Featured Properties Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Featured Properties
              </h2>
              <p className="text-gray-600">
                Handpicked luxury stays for discerning travelers
              </p>
            </div>

            {/* View Controls */}
            <div className="flex items-center space-x-4">
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

              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-400" />
                <select className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="all">All Properties</option>
                  <option value="luxury">Luxury Villas</option>
                  <option value="apartment">Apartments</option>
                  <option value="house">Houses</option>
                </select>
              </div>
            </div>
          </div>

          {/* Properties Grid */}
          <div
            className={`grid gap-8 ${
              viewMode === "grid"
                ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                : "grid-cols-1"
            }`}
          >
            {featuredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <button
              className="px-8 py-3 border-2 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors flex items-center space-x-2 mx-auto"
              style={{ borderColor: primaryColor }}
            >
              <span>View All Properties</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              {
                icon: Shield,
                title: "Naira Payments",
                desc: "Pay with card or bank transfer",
              },
              {
                icon: Award,
                title: "Verified Hosts",
                desc: "Trusted Nigerian property owners",
              },
              {
                icon: Clock,
                title: "Local Support",
                desc: "Nigerian customer service team",
              },
              {
                icon: CheckCircle,
                title: "Easy Booking",
                desc: "Book and pay in Naira",
              },
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ backgroundColor: primaryColor || "#f3f4f6" }}
                >
                  <item.icon className="w-8 h-8 text-white" />
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
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                {logoPreview ? (
                  <Image
                    src={logoPreview}
                    alt="Logo"
                    width={40}
                    height={40}
                    className="rounded-lg object-cover"
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
              <p className="text-gray-300 mb-6 max-w-md">
                Nigeria's leading platform for short-term accommodation.
                Connecting travelers with verified Nigerian hosts for authentic
                local experiences.
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-green-400">
                  <Shield className="w-5 h-5 mr-2" />
                  <span className="text-sm">Nigerian Verified</span>
                </div>
                <div className="flex items-center text-blue-400">
                  <CreditCard className="w-5 h-5 mr-2" />
                  <span className="text-sm">Naira Payments</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-semibold mb-6">Quick Links</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Properties
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="text-gray-300 hover:text-white transition-colors"
                  >
                    Support
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
                  <span className="text-gray-300">{getPhoneDisplay()}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="text-gray-300">
                    {data.businessEmail || "hello@yourname.stayza.ng"}
                  </span>
                </div>
                <div className="flex items-center">
                  <MessageCircle className="w-5 h-5 mr-3 text-gray-400" />
                  <span className="text-gray-300">Live Chat Available</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2024 {data.agencyName || "Stayza Pro"}. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <a
                href="#"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Terms of Service
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white text-sm transition-colors"
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
