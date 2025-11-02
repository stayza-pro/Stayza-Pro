"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import { useBranding } from "@/hooks/useBranding";
import { getRealtorSubdomain } from "@/utils/subdomain";
import { propertyService } from "@/services/properties";
import { Property, PropertyStatus } from "@/types";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Users,
  Loader2,
  Home,
  Copy,
  Grid3x3,
  List,
  Star,
  Bed,
  Bath,
  Maximize2,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Sparkles,
  LayoutGrid,
  BarChart3,
  Heart,
  Share2,
  MoreVertical,
  SlidersHorizontal,
  ChevronDown,
  X,
} from "lucide-react";

export default function PropertiesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { showSuccess, showError, showConfirm } = useAlert();
  const { branding } = useBranding();
  const realtorSubdomain = getRealtorSubdomain();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const brandColors = branding?.colors || {
    primary: "#3B82F6",
    secondary: "#1E40AF",
    accent: "#F59E0B",
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showSuccess("Copied to clipboard!");
  };

  useEffect(() => {
    fetchProperties();
  }, [currentPage, searchQuery, selectedStatus, sortBy]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const response = await propertyService.getHostProperties(undefined, {
        page: currentPage,
        limit: 12,
        query: searchQuery || undefined,
      });

      setProperties(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error("Error fetching properties:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm(
      "Are you sure you want to delete this property? This action cannot be undone.",
      async () => {
        try {
          await propertyService.deleteProperty(id);
          showSuccess("Property deleted successfully!");
          fetchProperties();
        } catch (error) {
          console.error("Error deleting property:", error);
          showError("Failed to delete property. Please try again.");
        }
      },
      "Delete Property"
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProperties();
  };

  const statusConfig = {
    active: {
      label: "Active",
      icon: CheckCircle2,
      bg: "bg-green-50",
      text: "text-green-700",
      border: "border-green-200",
    },
    inactive: {
      label: "Inactive",
      icon: XCircle,
      bg: "bg-red-50",
      text: "text-red-700",
      border: "border-red-200",
    },
  };

  if (loading && properties.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 text-gray-400 animate-spin" />
          <p className="text-gray-600 font-medium">
            Loading your properties...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header */}
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.firstName || "User"} 👋
            </h1>
            <div className="flex items-center space-x-3">
              <span className="text-gray-600 text-sm">Your website:</span>
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="relative group"
              >
                <span
                  className="font-bold px-4 py-2 rounded-lg text-sm border-2 cursor-pointer"
                  style={{
                    color: brandColors.primary,
                    backgroundColor: brandColors.primary + "10",
                    borderColor: brandColors.primary + "30",
                  }}
                  onClick={() =>
                    copyToClipboard(
                      `https://${realtorSubdomain || "yourcompany"}.stayza.pro`
                    )
                  }
                >
                  {realtorSubdomain || "yourcompany"}.stayza.pro
                </span>
              </motion.div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                copyToClipboard(
                  `https://${realtorSubdomain || "yourcompany"}.stayza.pro`
                )
              }
              className="px-5 py-2.5 border-2 border-gray-200 rounded-xl text-sm font-medium hover:border-gray-300 hover:shadow-lg transition-all flex items-center space-x-2 bg-white"
            >
              <Copy className="w-4 h-4 text-gray-600" />
              <span className="text-gray-700">Copy Link</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                window.open(
                  `https://${realtorSubdomain || "yourcompany"}.stayza.pro`,
                  "_blank"
                )
              }
              className="px-5 py-2.5 text-white rounded-xl text-sm font-bold hover:shadow-lg transition-all flex items-center space-x-2"
              style={{ backgroundColor: brandColors.primary }}
            >
              <Eye className="w-4 h-4" />
              <span>Preview Site</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="space-y-6">
            {/* Sub-header with Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2
                    className="text-3xl font-bold mb-2"
                    style={{ color: brandColors.primary }}
                  >
                    My Properties
                  </h2>
                  <p className="text-gray-600">
                    Manage and optimize your property listings
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/properties/new")}
                  className="flex items-center gap-3 px-8 py-4 text-white rounded-2xl hover:shadow-lg transition-all font-bold text-lg"
                  style={{ backgroundColor: brandColors.primary }}
                >
                  <Plus className="h-6 w-6" />
                  <span>Add New Property</span>
                </motion.button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                  {
                    label: "Total Properties",
                    value: properties.length,
                    icon: Building2,
                    color: brandColors.primary,
                  },
                  {
                    label: "Active Listings",
                    value: properties.filter((p) => p.isActive).length,
                    icon: CheckCircle2,
                    color: "#10B981", // green
                  },
                  {
                    label: "Total Views",
                    value: properties.reduce((total, p) => total + (p.views || 0), 0),
                    icon: Eye,
                    color: "#8B5CF6", // purple
                  },
                  {
                    label: "Avg. Rating",
                    value: properties.length > 0
                      ? (properties.reduce((total, p) => total + (p.averageRating || 0), 0) / properties.length).toFixed(1)
                      : "0.0",
                    icon: Star,
                    color: "#F59E0B", // amber
                  },
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + index * 0.05 }}
                      whileHover={{ scale: 1.03, y: -4 }}
                      className="bg-white rounded-2xl p-5 border border-gray-200 hover:shadow-lg transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="p-3 rounded-xl"
                          style={{ backgroundColor: stat.color + "20" }}
                        >
                          <Icon
                            className="w-6 h-6"
                            style={{ color: stat.color }}
                          />
                        </div>
                      </div>
                      <p className="text-3xl font-bold text-gray-900 mb-1">
                        {stat.value}
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        {stat.label}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Search and Filters Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100"
            >
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="flex gap-4">
                  {/* Search Input */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by name, location, or amenities..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 placeholder-gray-400 font-medium"
                    />
                  </div>

                  {/* View Toggle */}
                  <div className="flex items-center bg-gray-100 rounded-xl p-1">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => setViewMode("grid")}
                      className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                        viewMode === "grid"
                          ? "bg-white text-blue-600 shadow-md"
                          : "text-gray-600"
                      }`}
                    >
                      <LayoutGrid className="h-4 w-4" />
                      <span className="font-medium">Grid</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
                        viewMode === "list"
                          ? "bg-white text-blue-600 shadow-md"
                          : "text-gray-600"
                      }`}
                    >
                      <List className="h-4 w-4" />
                      <span className="font-medium">List</span>
                    </motion.button>
                  </div>

                  {/* Filters Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={`px-6 py-3 rounded-xl transition-all flex items-center gap-2 font-bold ${
                      showFilters
                        ? "bg-blue-600 text-white shadow-lg"
                        : "border-2 border-gray-200 hover:border-gray-300 bg-white text-gray-700"
                    }`}
                  >
                    <SlidersHorizontal className="h-5 w-5" />
                    Filters
                    <motion.div
                      animate={{ rotate: showFilters ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.div>
                  </motion.button>
                </div>

                {/* Expandable Filters */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="pt-4 border-t border-gray-200 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Status Filter */}
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              Status
                            </label>
                            <select
                              value={selectedStatus}
                              onChange={(e) =>
                                setSelectedStatus(e.target.value)
                              }
                              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                            >
                              <option value="all">All Properties</option>
                              <option value="active">Active</option>
                              <option value="inactive">Inactive</option>
                            </select>
                          </div>

                          {/* Sort By */}
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                              Sort By
                            </label>
                            <select
                              value={sortBy}
                              onChange={(e) => setSortBy(e.target.value)}
                              className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium"
                            >
                              <option value="newest">Newest First</option>
                              <option value="oldest">Oldest First</option>
                              <option value="price-high">
                                Price: High to Low
                              </option>
                              <option value="price-low">
                                Price: Low to High
                              </option>
                              <option value="popular">Most Popular</option>
                            </select>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-end gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => {
                                setSearchQuery("");
                                setSelectedStatus("all");
                                setSortBy("newest");
                              }}
                              className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-xl hover:bg-gray-50 transition-all font-bold text-gray-700"
                            >
                              Clear All
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="submit"
                              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg"
                            >
                              Apply Filters
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>

            {/* Properties Grid/List */}
            {properties.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-3xl shadow-lg p-16 text-center border-2 border-gray-100"
              >
                <motion.div
                  animate={{ y: [0, -15, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="mb-8"
                >
                  <div className="w-24 h-24 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
                    <Home className="h-16 w-16 text-gray-400" />
                  </div>
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  No Properties Yet
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">
                  Get started by adding your first property listing and start
                  earning revenue from bookings
                </p>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => router.push("/properties/new")}
                  className="inline-flex items-center gap-3 px-8 py-4 text-white rounded-2xl transition-all font-bold text-lg shadow-lg"
                  style={{ backgroundColor: brandColors.primary }}
                >
                  <Plus className="h-6 w-6" />
                  Add Your First Property
                </motion.button>
              </motion.div>
            ) : (
              <>
                {/* Grid View */}
                {viewMode === "grid" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {properties.map((property, index) => {
                      const statusKey = property.isActive
                        ? "active"
                        : "inactive";
                      const status = statusConfig[statusKey];
                      const StatusIcon = status.icon;
                      const isHovered = hoveredProperty === property.id;

                      return (
                        <motion.div
                          key={property.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 + index * 0.05 }}
                          onHoverStart={() => setHoveredProperty(property.id)}
                          onHoverEnd={() => setHoveredProperty(null)}
                          whileHover={{ scale: 1.02, y: -8 }}
                          className="bg-white rounded-3xl shadow-lg overflow-hidden border-2 border-gray-100 hover:border-transparent hover:shadow-2xl transition-all cursor-pointer group"
                        >
                          {/* Property Image */}
                          <div className="relative h-56 bg-gray-200 overflow-hidden">
                            {property.images && property.images.length > 0 ? (
                              <motion.img
                                whileHover={{ scale: 1.1 }}
                                transition={{ duration: 0.5 }}
                                src={property.images[0].url}
                                alt={property.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Building2 className="h-16 w-16 text-gray-400" />
                              </div>
                            )}

                            {/* Status Badge */}
                            <div className="absolute top-3 right-3">
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${status.bg} ${status.text} ${status.border} border-2 shadow-lg backdrop-blur-sm`}
                              >
                                <StatusIcon className="w-3.5 h-3.5" />
                                <span>{status.label}</span>
                              </motion.div>
                            </div>

                            {/* Quick View Badge */}
                            <AnimatePresence>
                              {isHovered && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0 }}
                                  className="absolute top-3 left-3"
                                >
                                  <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white/90 text-gray-800 shadow-lg backdrop-blur-sm">
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Quick View</span>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Image Count Badge */}
                            {property.images && property.images.length > 1 && (
                              <div className="absolute bottom-3 right-3">
                                <div className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-black/70 text-white backdrop-blur-sm">
                                  <Building2 className="w-3 h-3" />
                                  <span>{property.images.length} photos</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Property Details */}
                          <div className="p-5">
                            <h3 className="font-bold text-xl text-gray-900 mb-3 truncate group-hover:text-blue-600 transition-colors">
                              {property.title}
                            </h3>

                            {/* Key Info Grid */}
                            <div className="space-y-2.5 mb-4">
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="h-4 w-4 mr-2 text-gray-400 flex-shrink-0" />
                                <span className="truncate font-medium">
                                  {property.city}, {property.state}
                                </span>
                              </div>

                              <div className="flex items-center text-sm font-bold text-green-600">
                                <span className="mr-1">₦</span>
                                <span>
                                  {property.pricePerNight?.toLocaleString()}
                                  <span className="text-gray-500 font-normal">
                                    /night
                                  </span>
                                </span>
                              </div>

                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Users className="h-4 w-4 mr-1.5 text-gray-400" />
                                  <span className="font-medium">
                                    {property.maxGuests}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <Bed className="h-4 w-4 mr-1.5 text-gray-400" />
                                  <span className="font-medium">
                                    {property.bedrooms}
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <Bath className="h-4 w-4 mr-1.5 text-gray-400" />
                                  <span className="font-medium">
                                    {property.bathrooms}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Mini Stats */}
                            <div className="grid grid-cols-3 gap-2 mb-4 pt-4 border-t border-gray-100">
                              <div className="text-center">
                                <p className="text-xs text-gray-500 mb-1">
                                  Views
                                </p>
                                <p className="text-sm font-bold text-gray-900">
                                  {property.views || 0}
                                </p>
                              </div>
                              <div className="text-center border-x border-gray-100">
                                <p className="text-xs text-gray-500 mb-1">
                                  Bookings
                                </p>
                                <p className="text-sm font-bold text-gray-900">
                                  {property.bookingCount || 0}
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs text-gray-500 mb-1">
                                  Rating
                                </p>
                                <div className="flex items-center justify-center">
                                  <Star className="w-3.5 h-3.5 text-yellow-400 fill-current mr-0.5" />
                                  <p className="text-sm font-bold text-gray-900">
                                    {property.averageRating?.toFixed(1) || "0.0"}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/properties/${property.id}`);
                                }}
                                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-white rounded-xl transition-all text-sm font-bold shadow-md hover:shadow-xl"
                                style={{ backgroundColor: brandColors.primary }}
                              >
                                <Edit className="h-4 w-4" />
                                Edit
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(
                                    `/properties/${property.id}`,
                                    "_blank"
                                  );
                                }}
                                className="flex items-center justify-center px-4 py-2.5 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 text-sm font-bold text-gray-700 shadow-md hover:shadow-lg transition-all"
                              >
                                <Eye className="h-4 w-4" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(property.id);
                                }}
                                className="flex items-center justify-center px-4 py-2.5 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-300 text-sm font-bold shadow-md hover:shadow-lg transition-all"
                              >
                                <Trash2 className="h-4 w-4" />
                              </motion.button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}

                {/* List View */}
                {viewMode === "list" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    {properties.map((property, index) => {
                      const statusKey = property.isActive
                        ? "active"
                        : "inactive";
                      const status = statusConfig[statusKey];
                      const StatusIcon = status.icon;
                      const isHovered = hoveredProperty === property.id;

                      return (
                        <motion.div
                          key={property.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.03 }}
                          onHoverStart={() => setHoveredProperty(property.id)}
                          onHoverEnd={() => setHoveredProperty(null)}
                          whileHover={{ scale: 1.01, x: 4 }}
                          className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-100 hover:border-transparent hover:shadow-2xl transition-all cursor-pointer group"
                        >
                          <div className="flex">
                            {/* Property Image */}
                            <div className="relative w-80 h-56 bg-gray-200 flex-shrink-0">
                              {property.images && property.images.length > 0 ? (
                                <img
                                  src={property.images[0].url}
                                  alt={property.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Building2 className="h-16 w-16 text-gray-400" />
                                </div>
                              )}
                            </div>

                            {/* Property Details */}
                            <div className="flex-1 p-6 flex flex-col justify-between">
                              <div>
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <h3 className="font-bold text-2xl text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                      {property.title}
                                    </h3>
                                    <div className="flex items-center text-sm text-gray-600 mb-3">
                                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                      <span className="font-medium">
                                        {property.city}, {property.state}
                                      </span>
                                    </div>
                                  </div>
                                  <div
                                    className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${status.bg} ${status.text} ${status.border} border-2`}
                                  >
                                    <StatusIcon className="w-3.5 h-3.5" />
                                    <span>{status.label}</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-4 gap-4 mb-4">
                                  <div className="flex items-center text-sm">
                                    <Users className="h-4 w-4 mr-2 text-gray-400" />
                                    <span className="font-medium text-gray-700">
                                      {property.maxGuests} guests
                                    </span>
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <Bed className="h-4 w-4 mr-2 text-gray-400" />
                                    <span className="font-medium text-gray-700">
                                      {property.bedrooms} beds
                                    </span>
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <Bath className="h-4 w-4 mr-2 text-gray-400" />
                                    <span className="font-medium text-gray-700">
                                      {property.bathrooms} baths
                                    </span>
                                  </div>
                                  <div className="flex items-center text-sm font-bold text-green-600">
                                    <span className="mr-1">₦</span>
                                    <span>
                                      {property.pricePerNight?.toLocaleString()}
                                      /night
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                  <div className="text-center">
                                    <p className="text-xs text-gray-500 mb-1">
                                      Views
                                    </p>
                                    <p className="text-sm font-bold text-gray-900">
                                      {property.views || 0}
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-gray-500 mb-1">
                                      Bookings
                                    </p>
                                    <p className="text-sm font-bold text-gray-900">
                                      {property.bookingCount || 0}
                                    </p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-xs text-gray-500 mb-1">
                                      Rating
                                    </p>
                                    <div className="flex items-center">
                                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-current mr-1" />
                                      <p className="text-sm font-bold text-gray-900">
                                        {property.averageRating?.toFixed(1) || "0.0"}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex gap-2">
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() =>
                                      router.push(`/properties/${property.id}`)
                                    }
                                    className="flex items-center gap-2 px-5 py-2.5 text-white rounded-xl transition-all text-sm font-bold shadow-md hover:shadow-xl"
                                    style={{
                                      backgroundColor: brandColors.primary,
                                    }}
                                  >
                                    <Edit className="h-4 w-4" />
                                    Edit
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() =>
                                      window.open(
                                        `/properties/${property.id}`,
                                        "_blank"
                                      )
                                    }
                                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 text-sm font-bold text-gray-700"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleDelete(property.id)}
                                    className="flex items-center gap-2 px-4 py-2.5 border-2 border-red-200 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-300 text-sm font-bold"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </motion.button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center justify-center gap-3 mt-12"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05, x: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-6 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-bold text-gray-700 shadow-md transition-all"
                    >
                      Previous
                    </motion.button>

                    <div className="flex items-center gap-2">
                      {Array.from(
                        { length: Math.min(totalPages, 5) },
                        (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }

                          return (
                            <motion.button
                              key={pageNum}
                              whileHover={{ scale: 1.1, y: -2 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-12 h-12 rounded-xl font-bold transition-all shadow-md ${
                                currentPage === pageNum
                                  ? "text-white shadow-xl"
                                  : "border-2 border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-700"
                              }`}
                              style={
                                currentPage === pageNum
                                  ? { backgroundColor: brandColors.primary }
                                  : {}
                              }
                            >
                              {pageNum}
                            </motion.button>
                          );
                        }
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.05, x: 2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-6 py-3 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 font-bold text-gray-700 shadow-md transition-all"
                    >
                      Next
                    </motion.button>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
