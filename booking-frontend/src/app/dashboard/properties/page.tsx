"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "react-query";

export const dynamic = "force-dynamic";
import { toast } from "react-hot-toast";
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
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import { ModernDashboardLayout } from "@/components/layout/ModernDashboardLayout";
import { useAuthStore } from "@/store/authStore";
import { Card, Button, Loading } from "@/components/ui";
import { propertyService } from "@/services";
import { Property, PropertyStatus } from "@/types";

const PropertyManagement: React.FC = () => {
  // Don't render on server-side
  if (typeof window === "undefined") {
    return null;
  }

  const { user } = useAuthStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | PropertyStatus>(
    "all"
  );
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Fetch user's properties
  const {
    data: propertiesResponse,
    isLoading,
    error,
  } = useQuery("host-properties", () => propertyService.getHostProperties(), {
    enabled: !!user && typeof window !== "undefined",
  });

  const properties = propertiesResponse?.data || [];

  // Delete property mutation
  const deletePropertyMutation = useMutation(
    (propertyId: string) => propertyService.deleteProperty(propertyId),
    {
      onSuccess: () => {
        toast.success("Property deleted successfully");
        queryClient.invalidateQueries("host-properties");
      },
      onError: (error: any) => {
        toast.error(
          error.response?.data?.message || "Failed to delete property"
        );
      },
    }
  );

  // Filter properties
  const filteredProperties = properties.filter((property: Property) => {
    const matchesSearch = property.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || property.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateProperty = () => {
    router.push("/dashboard/properties/new");
  };

  const handleEditProperty = (propertyId: string) => {
    router.push(`/dashboard/properties/${propertyId}/edit`);
  };

  const handleViewProperty = (propertyId: string) => {
    router.push(`/properties/${propertyId}`);
  };

  const handleDeleteProperty = async (propertyId: string) => {
    if (window.confirm("Are you sure you want to delete this property?")) {
      deletePropertyMutation.mutate(propertyId);
    }
  };

  const getStatusBadge = (status: PropertyStatus) => {
    const statusConfig = {
      DRAFT: { color: "bg-gray-100 text-gray-800", label: "Draft" },
      PENDING: {
        color: "bg-yellow-100 text-yellow-800",
        label: "Pending Review",
      },
      APPROVED: { color: "bg-green-100 text-green-800", label: "Live" },
      REJECTED: { color: "bg-red-100 text-red-800", label: "Rejected" },
    };

    const config = statusConfig[status] || statusConfig.DRAFT;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const PropertyCard = ({ property }: { property: Property }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative h-48">
          {property.images && property.images.length > 0 ? (
            <Image
              src={property.images[0].url}
              alt={property.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <ImageIcon className="h-16 w-16 text-gray-400" />
            </div>
          )}

          <div className="absolute top-4 right-4">
            {getStatusBadge(property.status)}
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {property.title}
              </h3>
              <p className="text-sm text-gray-600 flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {property.city}, {property.country}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              {property.maxGuests} guests
            </div>
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 mr-1" />
              {property.currency} {property.pricePerNight}/night
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 mr-1" />
              {property.averageRating || 0}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewProperty(property.id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEditProperty(property.id)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteProperty(property.id)}
                disabled={deletePropertyMutation.isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );

  if (!user) return null;

  return (
    <ModernDashboardLayout
      currentUser={user}
      activeRoute="properties"
      onRouteChange={() => {}}
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
            <p className="text-gray-600">Manage your property listings</p>
          </div>
          <Button onClick={handleCreateProperty}>
            <Plus className="h-4 w-4 mr-2" />
            Add Property
          </Button>
        </div>

        {/* Filters and Search */}
        <Card className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <select
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as "all" | PropertyStatus)
              }
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Live</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <div className="flex rounded-lg border border-gray-300">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 ${
                  viewMode === "grid"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                } rounded-l-lg`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 ${
                  viewMode === "list"
                    ? "bg-blue-500 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                } rounded-r-lg`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </Card>

        {/* Properties Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loading size="lg" />
          </div>
        ) : error ? (
          <Card className="p-12 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error Loading Properties
            </h3>
            <p className="text-gray-600">
              There was an error loading your properties. Please try again.
            </p>
          </Card>
        ) : filteredProperties.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-center">
              <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || filterStatus !== "all"
                  ? "No properties found"
                  : "No properties yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery || filterStatus !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start by adding your first property to get bookings"}
              </p>
              <Button onClick={handleCreateProperty}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Property
              </Button>
            </div>
          </Card>
        ) : (
          <div
            className={
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                : "space-y-4"
            }
          >
            <AnimatePresence>
              {filteredProperties.map((property: Property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </ModernDashboardLayout>
  );
};

export default PropertyManagement;
