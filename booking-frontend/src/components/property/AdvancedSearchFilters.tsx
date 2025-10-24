"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button, Card } from "../ui";
import {
  Filter,
  X,
  MapPin,
  Home,
  DollarSign,
  Star,
  Wifi,
  Car,
  Utensils,
  Calendar,
  Users,
  Bed,
  Bath,
  Map,
  List,
  Grid3X3,
  SlidersHorizontal,
  Search,
  ChevronDown,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdvancedFiltersState {
  // Location filters
  location: string;
  radius: number;
  coordinates?: { lat: number; lng: number };

  // Property details
  priceRange: { min: number; max: number };
  propertyType: string;
  bedrooms: number | null;
  bathrooms: number | null;
  maxGuests: number | null;

  // Availability
  checkIn?: Date;
  checkOut?: Date;
  minNights: number | null;

  // Quality filters
  minRating: number;
  instantBook: boolean;
  superhostOnly: boolean;
  recentlyViewed: boolean;

  // Amenities
  amenities: string[];

  // Accessibility
  accessibilityFeatures: string[];

  // Host preferences
  hostLanguages: string[];

  // Sorting
  sortBy: "price" | "rating" | "distance" | "newest" | "popularity";
  sortOrder: "asc" | "desc";
}

interface AdvancedSearchFiltersProps {
  onFiltersChange?: (filters: AdvancedFiltersState) => void;
  onViewModeChange?: (mode: "list" | "grid" | "map") => void;
  viewMode?: "list" | "grid" | "map";
  className?: string;
  showMap?: boolean;
}

export const AdvancedSearchFilters: React.FC<AdvancedSearchFiltersProps> = ({
  onFiltersChange,
  onViewModeChange,
  viewMode = "grid",
  className = "",
  showMap = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilterTab, setActiveFilterTab] = useState("general");
  const [searchQuery, setSearchQuery] = useState("");

  const [filters, setFilters] = useState<AdvancedFiltersState>({
    location: "",
    radius: 25,
    priceRange: { min: 0, max: 1000 },
    propertyType: "",
    bedrooms: null,
    bathrooms: null,
    maxGuests: null,
    minNights: null,
    minRating: 0,
    instantBook: false,
    superhostOnly: false,
    recentlyViewed: false,
    amenities: [],
    accessibilityFeatures: [],
    hostLanguages: [],
    sortBy: "popularity",
    sortOrder: "desc",
  });

  const propertyTypes = [
    { value: "APARTMENT", label: "Apartment", icon: Home },
    { value: "HOUSE", label: "House", icon: Home },
    { value: "VILLA", label: "Villa", icon: Home },
    { value: "COTTAGE", label: "Cottage", icon: Home },
    { value: "STUDIO", label: "Studio", icon: Home },
    { value: "LOFT", label: "Loft", icon: Home },
    { value: "TOWNHOUSE", label: "Townhouse", icon: Home },
    { value: "OTHER", label: "Other", icon: Home },
  ];

  const amenities = [
    // Essential
    { value: "WiFi", label: "WiFi", icon: Wifi, category: "essential" },
    {
      value: "Kitchen",
      label: "Kitchen",
      icon: Utensils,
      category: "essential",
    },
    { value: "Parking", label: "Parking", icon: Car, category: "essential" },
    {
      value: "Air Conditioning",
      label: "AC",
      icon: Home,
      category: "essential",
    },
    { value: "Heating", label: "Heating", icon: Home, category: "essential" },

    // Comfort
    { value: "TV", label: "TV", icon: Home, category: "comfort" },
    {
      value: "Washing Machine",
      label: "Washer",
      icon: Home,
      category: "comfort",
    },
    { value: "Balcony", label: "Balcony", icon: Home, category: "comfort" },
    { value: "Garden", label: "Garden", icon: Home, category: "comfort" },

    // Luxury
    { value: "Pool", label: "Pool", icon: MapPin, category: "luxury" },
    { value: "Hot Tub", label: "Hot Tub", icon: Home, category: "luxury" },
    { value: "Gym", label: "Gym", icon: Home, category: "luxury" },
    { value: "BBQ Grill", label: "BBQ", icon: Home, category: "luxury" },
    {
      value: "Beach Access",
      label: "Beach Access",
      icon: Home,
      category: "luxury",
    },
  ];

  const accessibilityFeatures = [
    { value: "wheelchair_accessible", label: "Wheelchair accessible" },
    { value: "step_free_access", label: "Step-free access" },
    { value: "wide_doorways", label: "Wide doorways" },
    { value: "accessible_bathroom", label: "Accessible bathroom" },
    { value: "grab_rails", label: "Grab rails" },
    { value: "elevator_access", label: "Elevator access" },
  ];

  const hostLanguages = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
    { value: "de", label: "German" },
    { value: "it", label: "Italian" },
    { value: "pt", label: "Portuguese" },
    { value: "zh", label: "Chinese" },
    { value: "ja", label: "Japanese" },
  ];

  const sortOptions = [
    { value: "popularity", label: "Most Popular" },
    { value: "price", label: "Price" },
    { value: "rating", label: "Rating" },
    { value: "distance", label: "Distance" },
    { value: "newest", label: "Newest" },
  ];

  const filterTabs = [
    { id: "general", label: "General", icon: SlidersHorizontal },
    { id: "amenities", label: "Amenities", icon: Home },
    { id: "accessibility", label: "Accessibility", icon: Users },
    { id: "host", label: "Host", icon: Star },
  ];

  const handleFilterChange = <K extends keyof AdvancedFiltersState>(
    key: K,
    value: AdvancedFiltersState[K]
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const toggleArrayFilter = (
    key: keyof Pick<
      AdvancedFiltersState,
      "amenities" | "accessibilityFeatures" | "hostLanguages"
    >,
    value: string
  ) => {
    const currentArray = filters[key] as string[];
    const newArray = currentArray.includes(value)
      ? currentArray.filter((item) => item !== value)
      : [...currentArray, value];

    handleFilterChange(key, newArray);
  };

  const clearFilters = () => {
    const defaultFilters: AdvancedFiltersState = {
      location: "",
      radius: 25,
      priceRange: { min: 0, max: 1000 },
      propertyType: "",
      bedrooms: null,
      bathrooms: null,
      maxGuests: null,
      minNights: null,
      minRating: 0,
      instantBook: false,
      superhostOnly: false,
      recentlyViewed: false,
      amenities: [],
      accessibilityFeatures: [],
      hostLanguages: [],
      sortBy: "popularity",
      sortOrder: "desc",
    };
    setFilters(defaultFilters);
    onFiltersChange?.(defaultFilters);
  };

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.location) count++;
    if (filters.propertyType) count++;
    if (filters.priceRange.min > 0 || filters.priceRange.max < 1000) count++;
    if (filters.bedrooms !== null) count++;
    if (filters.bathrooms !== null) count++;
    if (filters.maxGuests !== null) count++;
    if (filters.minRating > 0) count++;
    if (filters.instantBook) count++;
    if (filters.superhostOnly) count++;
    if (filters.amenities.length > 0) count++;
    if (filters.accessibilityFeatures.length > 0) count++;
    if (filters.hostLanguages.length > 0) count++;
    return count;
  }, [filters]);

  return (
    <Card className={`${className}`}>
      {/* Search Bar and View Controls */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by location, property name, or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* View Mode Controls */}
          <div className="flex items-center space-x-2">
            {showMap && (
              <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                <button
                  onClick={() => onViewModeChange?.("list")}
                  className={`px-3 py-2 text-sm transition-colors ${
                    viewMode === "list"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onViewModeChange?.("grid")}
                  className={`px-3 py-2 text-sm transition-colors ${
                    viewMode === "grid"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onViewModeChange?.("map")}
                  className={`px-3 py-2 text-sm transition-colors ${
                    viewMode === "map"
                      ? "bg-blue-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Map className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Sort Options */}
            <div className="relative">
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split("-") as [
                    typeof filters.sortBy,
                    typeof filters.sortOrder
                  ];
                  handleFilterChange("sortBy", sortBy);
                  handleFilterChange("sortOrder", sortOrder);
                }}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {sortOptions.map((option) => (
                  <React.Fragment key={option.value}>
                    <option value={`${option.value}-desc`}>
                      {option.label} (High to Low)
                    </option>
                    <option value={`${option.value}-asc`}>
                      {option.label} (Low to High)
                    </option>
                  </React.Fragment>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Filter Toggle */}
            <Button
              variant={isExpanded ? "primary" : "outline"}
              onClick={() => setIsExpanded(!isExpanded)}
              className="relative"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="p-4 border-t border-gray-200">
              {/* Filter Tabs */}
              <div className="flex space-x-1 mb-6 bg-gray-100 rounded-lg p-1">
                {filterTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveFilterTab(tab.id)}
                      className={`flex-1 flex items-center justify-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeFilterTab === tab.id
                          ? "bg-white text-blue-600 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Filter Content */}
              <div className="space-y-6">
                {activeFilterTab === "general" && (
                  <div className="space-y-4">
                    {/* Location and Radius */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <MapPin className="h-4 w-4 inline mr-1" />
                          Location
                        </label>
                        <input
                          type="text"
                          placeholder="City, landmark, or address"
                          value={filters.location}
                          onChange={(e) =>
                            handleFilterChange("location", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Radius (km)
                        </label>
                        <select
                          value={filters.radius}
                          onChange={(e) =>
                            handleFilterChange(
                              "radius",
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value={5}>5 km</option>
                          <option value={10}>10 km</option>
                          <option value={25}>25 km</option>
                          <option value={50}>50 km</option>
                          <option value={100}>100 km</option>
                        </select>
                      </div>
                    </div>

                    {/* Property Details */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Home className="h-4 w-4 inline mr-1" />
                          Property Type
                        </label>
                        <select
                          value={filters.propertyType}
                          onChange={(e) =>
                            handleFilterChange("propertyType", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">All Types</option>
                          {propertyTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Bed className="h-4 w-4 inline mr-1" />
                          Bedrooms
                        </label>
                        <select
                          value={filters.bedrooms || ""}
                          onChange={(e) =>
                            handleFilterChange(
                              "bedrooms",
                              e.target.value ? parseInt(e.target.value) : null
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Any</option>
                          <option value={1}>1+</option>
                          <option value={2}>2+</option>
                          <option value={3}>3+</option>
                          <option value={4}>4+</option>
                          <option value={5}>5+</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Bath className="h-4 w-4 inline mr-1" />
                          Bathrooms
                        </label>
                        <select
                          value={filters.bathrooms || ""}
                          onChange={(e) =>
                            handleFilterChange(
                              "bathrooms",
                              e.target.value ? parseInt(e.target.value) : null
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Any</option>
                          <option value={1}>1+</option>
                          <option value={2}>2+</option>
                          <option value={3}>3+</option>
                          <option value={4}>4+</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Users className="h-4 w-4 inline mr-1" />
                          Guests
                        </label>
                        <select
                          value={filters.maxGuests || ""}
                          onChange={(e) =>
                            handleFilterChange(
                              "maxGuests",
                              e.target.value ? parseInt(e.target.value) : null
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Any</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={4}>4</option>
                          <option value={6}>6</option>
                          <option value={8}>8+</option>
                        </select>
                      </div>
                    </div>

                    {/* Price Range */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <DollarSign className="h-4 w-4 inline mr-1" />
                        Price Range (per night)
                      </label>
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <input
                            type="number"
                            min="0"
                            value={filters.priceRange.min}
                            onChange={(e) =>
                              handleFilterChange("priceRange", {
                                ...filters.priceRange,
                                min: parseInt(e.target.value) ?? 0,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Min price"
                          />
                        </div>
                        <span className="text-gray-500">to</span>
                        <div className="flex-1">
                          <input
                            type="number"
                            min="0"
                            value={filters.priceRange.max}
                            onChange={(e) =>
                              handleFilterChange("priceRange", {
                                ...filters.priceRange,
                                max: parseInt(e.target.value) || 1000,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Max price"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Availability */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="h-4 w-4 inline mr-1" />
                          Check-in
                        </label>
                        <input
                          type="date"
                          value={
                            filters.checkIn
                              ? filters.checkIn.toISOString().split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            handleFilterChange(
                              "checkIn",
                              e.target.value
                                ? new Date(e.target.value)
                                : undefined
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Check-out
                        </label>
                        <input
                          type="date"
                          value={
                            filters.checkOut
                              ? filters.checkOut.toISOString().split("T")[0]
                              : ""
                          }
                          onChange={(e) =>
                            handleFilterChange(
                              "checkOut",
                              e.target.value
                                ? new Date(e.target.value)
                                : undefined
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Min Nights
                        </label>
                        <select
                          value={filters.minNights || ""}
                          onChange={(e) =>
                            handleFilterChange(
                              "minNights",
                              e.target.value ? parseInt(e.target.value) : null
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Any</option>
                          <option value={1}>1 night</option>
                          <option value={2}>2 nights</option>
                          <option value={3}>3 nights</option>
                          <option value={7}>1 week</option>
                          <option value={30}>1 month</option>
                        </select>
                      </div>
                    </div>

                    {/* Quality Filters */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-700">
                        <Star className="h-4 w-4 inline mr-1" />
                        Quality & Features
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm text-gray-600 mb-2">
                            Minimum Rating
                          </label>
                          <select
                            value={filters.minRating}
                            onChange={(e) =>
                              handleFilterChange(
                                "minRating",
                                parseFloat(e.target.value)
                              )
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value={0}>Any Rating</option>
                            <option value={3}>3+ Stars</option>
                            <option value={4}>4+ Stars</option>
                            <option value={4.5}>4.5+ Stars</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={filters.instantBook}
                              onChange={(e) =>
                                handleFilterChange(
                                  "instantBook",
                                  e.target.checked
                                )
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                            />
                            <span className="text-sm text-gray-700">
                              Instant Book
                            </span>
                          </label>

                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={filters.superhostOnly}
                              onChange={(e) =>
                                handleFilterChange(
                                  "superhostOnly",
                                  e.target.checked
                                )
                              }
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                            />
                            <span className="text-sm text-gray-700">
                              Superhost Only
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeFilterTab === "amenities" && (
                  <div className="space-y-6">
                    {["essential", "comfort", "luxury"].map((category) => (
                      <div key={category}>
                        <h4 className="text-sm font-medium text-gray-900 mb-3 capitalize">
                          {category} Amenities
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {amenities
                            .filter((amenity) => amenity.category === category)
                            .map((amenity) => {
                              const Icon = amenity.icon;
                              return (
                                <button
                                  key={amenity.value}
                                  onClick={() =>
                                    toggleArrayFilter(
                                      "amenities",
                                      amenity.value
                                    )
                                  }
                                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                                    filters.amenities.includes(amenity.value)
                                      ? "bg-blue-100 border-blue-300 text-blue-700"
                                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                                  }`}
                                >
                                  <Icon className="h-4 w-4" />
                                  <span>{amenity.label}</span>
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeFilterTab === "accessibility" && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-3">
                      Accessibility Features
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {accessibilityFeatures.map((feature) => (
                        <label
                          key={feature.value}
                          className="flex items-center space-x-2"
                        >
                          <input
                            type="checkbox"
                            checked={filters.accessibilityFeatures.includes(
                              feature.value
                            )}
                            onChange={() =>
                              toggleArrayFilter(
                                "accessibilityFeatures",
                                feature.value
                              )
                            }
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700">
                            {feature.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {activeFilterTab === "host" && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">
                        Host Languages
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {hostLanguages.map((language) => (
                          <button
                            key={language.value}
                            onClick={() =>
                              toggleArrayFilter("hostLanguages", language.value)
                            }
                            className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                              filters.hostLanguages.includes(language.value)
                                ? "bg-blue-100 border-blue-300 text-blue-700"
                                : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            {language.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  disabled={activeFiltersCount === 0}
                >
                  Clear All Filters
                </Button>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsExpanded(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setIsExpanded(false)}
                  >
                    Apply Filters ({activeFiltersCount})
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};
