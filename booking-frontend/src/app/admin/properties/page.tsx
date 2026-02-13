"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Home,
  MapPin,
  DollarSign,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  MoreVertical,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  getAllProperties,
  approveProperty,
  rejectProperty,
  Property,
} from "@/services/adminService";

// Property interface is now imported from adminService

export default function PropertiesPage() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Fetch properties data from API
  useEffect(() => {
    fetchProperties();
  }, [statusFilter, searchQuery]);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const response = await getAllProperties({
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: searchQuery || undefined,
        limit: 100, // Fetch up to 100 properties
      });

      setProperties(response.properties);
    } catch (error) {
      const message = "Failed to load properties. Please try again.";
      setFetchError(message);
      setProperties([]);
      toast.error("Failed to load properties. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      case "SUSPENDED":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handleApprove = async (propertyId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to approve this property? This action will make it visible to customers."
    );

    if (!confirmed) return;

    try {
      await approveProperty(propertyId);

      // Update local state
      setProperties((prev) =>
        prev.map((p) =>
          p.id === propertyId ? { ...p, status: "APPROVED" as const } : p
        )
      );

      toast.success("Property approved successfully!");
    } catch (error) {
      
      toast.error("Failed to approve property. Please try again.");
    }
  };

  const handleReject = async (propertyId: string) => {
    const reason = prompt("Please provide a reason for rejection:");
    if (!reason) return;

    try {
      await rejectProperty(propertyId, reason);

      // Update local state
      setProperties((prev) =>
        prev.map((p) =>
          p.id === propertyId ? { ...p, status: "REJECTED" as const } : p
        )
      );

      toast.success("Property rejected successfully!");
    } catch (error) {
      
      toast.error("Failed to reject property. Please try again.");
    }
  };

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      property.realtor.businessName
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || property.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const pendingCount = properties.filter((p) => p.status === "PENDING").length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading properties...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Home className="h-8 w-8 text-blue-600" />
                Property Management
              </h1>
              <p className="text-gray-600 mt-2">
                Review and manage property listings on the platform
              </p>
            </div>
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 border border-orange-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  {pendingCount} pending approval{pendingCount !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search properties..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>
        </div>

        {fetchError && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{fetchError}</p>
          </div>
        )}

        {/* Properties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <div
              key={property.id}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              {/* Property Image */}
              <div className="h-48 bg-gray-200 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute top-3 right-3">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      property.status
                    )}`}
                  >
                    {property.status}
                  </span>
                </div>
                <div className="absolute bottom-3 left-3 text-white">
                  <p className="text-lg font-bold">
                    NGN {Number(property.pricePerNight ?? 0).toLocaleString("en-NG")}/night
                  </p>
                </div>
              </div>

              {/* Property Details */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {property.title}
                </h3>

                <div className="flex items-center text-gray-600 mb-2">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">
                    {property.city}, {property.state}
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>
                    {property.bedrooms} bed | {property.bathrooms} bath
                  </span>
                  <span>Max {property.maxGuests} guests</span>
                </div>

                <div className="border-t border-gray-200 pt-3">
                  <p className="text-sm text-gray-600 mb-2">
                    Listed by:{" "}
                    <span className="font-medium">
                      {property.realtor.businessName}
                    </span>
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedProperty(property);
                          setShowDetailsModal(true);
                        }}
                        className="p-1 text-blue-600 border border-blue-200 rounded"
                      >
                        <Eye className="h-4 w-4" />
                      </button>

                      {property.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleApprove(property.id)}
                            className="p-1 text-green-600 border border-green-200 rounded"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleReject(property.id)}
                            className="p-1 text-red-600 border border-red-200 rounded"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>

                    <span className="text-xs text-gray-500">
                      {new Date(property.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredProperties.length === 0 && (
          <div className="text-center py-12">
            <Home className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No Properties Found
            </h3>
            <p className="text-gray-500">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      {/* Property Details Modal */}
      {showDetailsModal && selectedProperty && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Property Details
              </h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 text-xl font-bold"
              >
                x
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">
                    {selectedProperty.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {selectedProperty.description}
                  </p>

                  <div className="space-y-2 mb-4">
                    <div>
                      <strong>Address:</strong> {selectedProperty.address}
                    </div>
                    <div>
                      <strong>City:</strong> {selectedProperty.city},{" "}
                      {selectedProperty.state}
                    </div>
                    <div>
                      <strong>Price:</strong> NGN 
                      {Number(selectedProperty.pricePerNight ?? 0).toLocaleString("en-NG")}/night
                    </div>
                    <div>
                      <strong>Bedrooms:</strong> {selectedProperty.bedrooms}
                    </div>
                    <div>
                      <strong>Bathrooms:</strong> {selectedProperty.bathrooms}
                    </div>
                    <div>
                      <strong>Max Guests:</strong> {selectedProperty.maxGuests}
                    </div>
                  </div>

                  <div>
                    <strong>Amenities:</strong>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedProperty.amenities.map((amenity, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 rounded text-sm"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Realtor Information</h4>
                  <div className="space-y-2 mb-4">
                    <div>
                      <strong>Name:</strong>{" "}
                      {selectedProperty.realtor.businessName}
                    </div>
                    <div>
                      <strong>Email:</strong>{" "}
                      {selectedProperty.realtor.user.email}
                    </div>
                  </div>

                  <h4 className="font-semibold mb-3">Status & Dates</h4>
                  <div className="space-y-2">
                    <div>
                      <strong>Status:</strong>
                      <span
                        className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          selectedProperty.status
                        )}`}
                      >
                        {selectedProperty.status}
                      </span>
                    </div>
                    <div>
                      <strong>Created:</strong>{" "}
                      {new Date(selectedProperty.createdAt).toLocaleString()}
                    </div>
                    <div>
                      <strong>Updated:</strong>{" "}
                      {new Date(selectedProperty.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>

              {selectedProperty.status === "PENDING" && (
                <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => {
                      handleApprove(selectedProperty.id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg"
                  >
                    Approve Property
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedProperty.id);
                      setShowDetailsModal(false);
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg"
                  >
                    Reject Property
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
