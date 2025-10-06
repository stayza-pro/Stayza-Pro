"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Plus,
  MoreHorizontal,
  MapPin,
  Star,
  Users,
  Calendar,
  DollarSign,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Upload,
  SortAsc,
  SortDesc,
  Bed,
  Bath,
  Home,
} from "lucide-react";
import Image from "next/image";
import { CacStatusCard } from "./CacStatusCard";

interface Property {
  id: string;
  title: string;
  location: string;
  price: number;
  rating: number;
  reviews: number;
  images: string[];
  status: "APPROVED" | "PENDING" | "REJECTED" | "DRAFT";
  bedrooms: number;
  bathrooms: number;
  guests: number;
  amenities: string[];
  bookings: number;
  revenue: number;
  owner: {
    name: string;
    avatar: string;
    email: string;
  };
  createdAt: string;
  lastModified: string;
}

interface ModernPropertyManagementProps {
  properties?: Property[];
  currentUser: any;
  onPropertySelect?: (property: Property) => void;
  onPropertyApprove?: (propertyId: string) => void;
  onPropertyReject?: (propertyId: string) => void;
  onPropertyEdit?: (propertyId: string) => void;
  onPropertyDelete?: (propertyId: string) => void;
}

export const ModernPropertyManagement: React.FC<
  ModernPropertyManagementProps
> = ({
  properties = [],
  currentUser,
  onPropertySelect,
  onPropertyApprove,
  onPropertyReject,
  onPropertyEdit,
  onPropertyDelete,
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Mock data for demonstration
  const mockProperties: Property[] = [
    {
      id: "1",
      title: "Luxury Oceanfront Villa",
      location: "Lekki Phase 1, Lagos",
      price: 85000,
      rating: 4.9,
      reviews: 127,
      images: ["/api/placeholder/400/300", "/api/placeholder/400/301"],
      status: "APPROVED",
      bedrooms: 4,
      bathrooms: 3,
      guests: 8,
      amenities: ["Ocean View", "Private Pool", "WiFi", "Parking"],
      bookings: 47,
      revenue: 1200000,
      owner: {
        name: "Sarah Johnson",
        avatar: "/api/placeholder/40/40",
        email: "sarah@example.com",
      },
      createdAt: "2024-01-15",
      lastModified: "2024-02-20",
    },
    {
      id: "2",
      title: "Modern City Apartment",
      location: "Victoria Island, Lagos",
      price: 45000,
      rating: 4.8,
      reviews: 89,
      images: ["/api/placeholder/400/300"],
      status: "PENDING",
      bedrooms: 2,
      bathrooms: 2,
      guests: 4,
      amenities: ["City View", "Gym Access", "WiFi", "Concierge"],
      bookings: 32,
      revenue: 800000,
      owner: {
        name: "Michael Chen",
        avatar: "/api/placeholder/40/40",
        email: "michael@example.com",
      },
      createdAt: "2024-02-01",
      lastModified: "2024-02-18",
    },
    {
      id: "3",
      title: "Cozy Beach House",
      location: "Ikoyi, Lagos",
      price: 32000,
      rating: 4.7,
      reviews: 64,
      images: ["/api/placeholder/400/300"],
      status: "REJECTED",
      bedrooms: 3,
      bathrooms: 2,
      guests: 6,
      amenities: ["Beach Access", "BBQ Area", "WiFi", "Garden"],
      bookings: 28,
      revenue: 560000,
      owner: {
        name: "Emily Davis",
        avatar: "/api/placeholder/40/40",
        email: "emily@example.com",
      },
      createdAt: "2024-01-28",
      lastModified: "2024-02-15",
    },
  ];

  const displayProperties = properties.length > 0 ? properties : mockProperties;

  // Filter and sort properties
  const filteredProperties = displayProperties
    .filter((property) => {
      const matchesSearch =
        property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.owner.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        filterStatus === "all" || property.status === filterStatus;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let aValue = a[sortBy as keyof Property];
      let bValue = b[sortBy as keyof Property];

      if (
        sortBy === "price" ||
        sortBy === "rating" ||
        sortBy === "bookings" ||
        sortBy === "revenue"
      ) {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }

      if (sortOrder === "asc") {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const getStatusColor = (status: Property["status"]) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: Property["status"]) => {
    switch (status) {
      case "APPROVED":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "PENDING":
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "DRAFT":
        return <Edit className="w-4 h-4 text-gray-600" />;
      default:
        return null;
    }
  };

  const PropertyCard = ({ property }: { property: Property }) => (
    <motion.div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden"
      whileHover={{ y: -2 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      layoutId={`property-${property.id}`}
    >
      {/* Property Image */}
      <div className="relative aspect-[4/3]">
        <Image
          src={property.images[0]}
          alt={property.title}
          width={400}
          height={300}
          className="w-full h-full object-cover"
        />

        {/* Status Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
              property.status
            )}`}
          >
            {getStatusIcon(property.status)}
            <span className="ml-1">{property.status}</span>
          </span>
        </div>

        {/* Actions */}
        <div className="absolute top-3 right-3 flex space-x-1">
          <button
            onClick={() => onPropertySelect?.(property)}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
          >
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => onPropertyEdit?.(property.id)}
            className="p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors"
          >
            <Edit className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Property Info */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {property.title}
            </h3>
            <div className="flex items-center text-gray-600 text-sm">
              <MapPin className="w-4 h-4 mr-1" />
              {property.location}
            </div>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm font-medium">{property.rating}</span>
            <span className="text-xs text-gray-500">({property.reviews})</span>
          </div>
        </div>

        {/* Property Details */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <Bed className="w-4 h-4 mr-1" />
              {property.bedrooms}
            </span>
            <span className="flex items-center">
              <Bath className="w-4 h-4 mr-1" />
              {property.bathrooms}
            </span>
            <span className="flex items-center">
              <Users className="w-4 h-4 mr-1" />
              {property.guests}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-gray-500">Bookings</p>
            <p className="text-sm font-semibold text-gray-900">
              {property.bookings}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Revenue</p>
            <p className="text-sm font-semibold text-gray-900">
              ₦{(property.revenue / 1000).toFixed(0)}K
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Price/night</p>
            <p className="text-sm font-semibold text-gray-900">
              ₦{property.price.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Owner */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Image
              src={property.owner.avatar}
              alt={property.owner.name}
              width={24}
              height={24}
              className="w-6 h-6 rounded-full object-cover"
            />
            <span className="text-sm text-gray-600">{property.owner.name}</span>
          </div>

          {/* Action Buttons */}
          {property.status === "PENDING" && currentUser.role === "ADMIN" && (
            <div className="flex space-x-2">
              <button
                onClick={() => onPropertyApprove?.(property.id)}
                className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => onPropertyReject?.(property.id)}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const PropertyListItem = ({ property }: { property: Property }) => (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 p-6"
      whileHover={{ x: 2 }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      layoutId={`property-${property.id}`}
    >
      <div className="flex items-center space-x-6">
        <Image
          src={property.images[0]}
          alt={property.title}
          width={80}
          height={80}
          className="w-20 h-20 rounded-xl object-cover"
        />

        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {property.title}
              </h3>
              <div className="flex items-center text-gray-600 text-sm mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                {property.location}
              </div>
            </div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                property.status
              )}`}
            >
              {getStatusIcon(property.status)}
              <span className="ml-1">{property.status}</span>
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            <div className="text-center">
              <p className="text-xs text-gray-500">Price</p>
              <p className="text-sm font-semibold text-gray-900">
                ₦{property.price.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Rating</p>
              <div className="flex items-center justify-center space-x-1">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <p className="text-sm font-semibold text-gray-900">
                  {property.rating}
                </p>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Bookings</p>
              <p className="text-sm font-semibold text-gray-900">
                {property.bookings}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Revenue</p>
              <p className="text-sm font-semibold text-gray-900">
                ₦{(property.revenue / 1000).toFixed(0)}K
              </p>
            </div>
            <div className="flex items-center justify-center space-x-2">
              {property.status === "PENDING" &&
                currentUser.role === "ADMIN" && (
                  <>
                    <button
                      onClick={() => onPropertyApprove?.(property.id)}
                      className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onPropertyReject?.(property.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </>
                )}
              <button
                onClick={() => onPropertySelect?.(property)}
                className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => onPropertyEdit?.(property.id)}
                className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* CAC Status Card - Only show if user is realtor */}
      {currentUser?.realtor && <CacStatusCard realtor={currentUser.realtor} />}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Property Management
          </h1>
          <p className="text-gray-600">
            Manage and monitor all properties on your platform
          </p>
        </div>

        <div className="flex items-center space-x-3 mt-6 lg:mt-0">
          <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Property</span>
          </button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search properties, owners, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="REJECTED">Rejected</option>
              <option value="DRAFT">Draft</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt">Created Date</option>
              <option value="title">Title</option>
              <option value="price">Price</option>
              <option value="rating">Rating</option>
              <option value="bookings">Bookings</option>
              <option value="revenue">Revenue</option>
            </select>

            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {sortOrder === "asc" ? (
                <SortAsc className="w-5 h-5 text-gray-600" />
              ) : (
                <SortDesc className="w-5 h-5 text-gray-600" />
              )}
            </button>

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
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          {
            label: "Total Properties",
            value: filteredProperties.length,
            change: "+12%",
            changeType: "positive" as const,
            icon: Home,
            color: "bg-blue-500",
          },
          {
            label: "Pending Approval",
            value: filteredProperties.filter((p) => p.status === "PENDING")
              .length,
            change: "-5%",
            changeType: "negative" as const,
            icon: Clock,
            color: "bg-yellow-500",
          },
          {
            label: "Total Bookings",
            value: filteredProperties.reduce((sum, p) => sum + p.bookings, 0),
            change: "+18%",
            changeType: "positive" as const,
            icon: Calendar,
            color: "bg-green-500",
          },
          {
            label: "Total Revenue",
            value: `₦${(
              filteredProperties.reduce((sum, p) => sum + p.revenue, 0) /
              1000000
            ).toFixed(1)}M`,
            change: "+25%",
            changeType: "positive" as const,
            icon: DollarSign,
            color: "bg-purple-500",
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <span
                className={`text-sm font-medium ${
                  stat.changeType === "positive"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {stat.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">
              {stat.value}
            </p>
            <p className="text-sm text-gray-600">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Properties Grid/List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Properties ({filteredProperties.length})
          </h2>

          {selectedProperties.length > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {selectedProperties.length} selected
              </span>
              <button className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Bulk Actions
              </button>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {viewMode === "grid" ? (
            <motion.div
              key="grid"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="list"
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {filteredProperties.map((property) => (
                <PropertyListItem key={property.id} property={property} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {filteredProperties.length === 0 && (
          <motion.div
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No properties found
            </h3>
            <p className="text-gray-600 max-w-md mx-auto">
              Try adjusting your search or filters to find what you're looking
              for.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};
