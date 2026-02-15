"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useBranding } from "@/hooks/useBranding";
import { getRealtorSubdomain } from "@/utils/subdomain";
import { buildMainDomainUrl } from "@/utils/domains";
import { propertyService } from "@/services/properties";
import { Property, PropertyStatus } from "@/types";
import { useAlert } from "@/context/AlertContext";
import {
  Building2,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  MapPin,
  DollarSign,
  Users,
  Loader2,
  Home,
  Copy,
} from "lucide-react";

export default function PropertiesPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { branding } = useBranding();
  const { showSuccess, showError, showConfirm } = useAlert();
  const realtorSubdomain = getRealtorSubdomain();
  const previewUrl = realtorSubdomain
    ? `https://${realtorSubdomain}.stayza.pro`
    : user?.realtor?.slug
    ? buildMainDomainUrl(`/guest-landing`)
    : null;

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
    if (user?.realtor?.id) {
      fetchProperties();
    }
  }, [currentPage, searchQuery, user?.realtor?.id]);

  const fetchProperties = async () => {
    if (!user?.realtor?.id) {
      
      return;
    }

    try {
      setLoading(true);
      
      const response = await propertyService.getHostProperties(
        user.realtor.id,
        {
          page: currentPage,
          limit: 12,
          query: searchQuery || undefined,
        }
      );

      
      setProperties(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (error) {
      
      showError("Failed to load properties");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    showConfirm("Are you sure you want to delete this property?", async () => {
      try {
        await propertyService.deleteProperty(id);
        showSuccess("Property deleted successfully!");
        fetchProperties(); // Refresh list
      } catch (error) {
        
        showError("Failed to delete property");
      }
    });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchProperties();
  };

  if (loading && properties.length === 0) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading properties...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 flex-shrink-0">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Welcome back, {user?.firstName || "User"} 👋
            </h1>
            <p className="text-gray-600 flex items-center space-x-2">
              <span>Your website:</span>
              <span
                className="font-semibold px-3 py-1 rounded-md text-sm"
                style={{
                  color: brandColors.primary,
                  backgroundColor: brandColors.primary + "15",
                }}
              >
                {realtorSubdomain || "yourcompany"}.stayza.pro
              </span>
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                if (previewUrl) {
                  copyToClipboard(previewUrl);
                }
              }}
              disabled={!previewUrl}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </button>
            <button
              onClick={() => {
                if (previewUrl) {
                  window.open(previewUrl, "_blank");
                }
              }}
              disabled={!previewUrl}
              className="px-4 py-2 text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all flex items-center space-x-2"
              style={{ backgroundColor: brandColors.primary }}
            >
              <Eye className="w-4 h-4" />
              <span>Preview Site</span>
            </button>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-8">
          <div className="space-y-6">
            {/* Sub-header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  My Properties
                </h2>
                <p className="text-gray-600 mt-1">
                  Manage your property listings
                </p>
              </div>
              <button
                onClick={() => router.push("/dashboard/properties/new")}
                className="flex items-center gap-2 px-4 py-2 text-white rounded-lg hover:shadow-lg transition-all"
                style={{ backgroundColor: brandColors.primary }}
              >
                <Plus className="h-5 w-5" />
                Add Property
              </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow p-4">
              <form onSubmit={handleSearch} className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search properties by name, location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-2 text-white rounded-lg transition-all"
                  style={{ backgroundColor: brandColors.primary }}
                >
                  Search
                </button>
                <button
                  type="button"
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Filter className="h-5 w-5" />
                  Filters
                </button>
              </form>
            </div>

            {/* Properties Grid/List */}
            {properties.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <Home className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Properties Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Get started by adding your first property listing
                </p>
                <button
                  onClick={() => router.push("/dashboard/properties/new")}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="h-5 w-5" />
                  Add Your First Property
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {properties.map((property) => (
                    <div
                      key={property.id}
                      className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {/* Property Image */}
                      <div className="relative h-48 bg-gray-200">
                        {property.images && property.images.length > 0 ? (
                          <img
                            src={property.images[0].url}
                            alt={property.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Building2 className="h-12 w-12 text-gray-400" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              property.status === ("APPROVED" as PropertyStatus)
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {property.status}
                          </span>
                        </div>
                      </div>

                      {/* Property Details */}
                      <div className="p-4">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2 truncate">
                          {property.title}
                        </h3>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span className="truncate">
                              {property.city}, {property.state}
                            </span>
                          </div>

                          <div className="flex items-center text-sm text-gray-600">
                            <DollarSign className="h-4 w-4 mr-2" />
                            <span>
                              $
                              {Math.round((property.pricePerNight || 0) * 100) /
                                100}
                              /night
                            </span>
                          </div>

                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="h-4 w-4 mr-2" />
                            <span>
                              {property.maxGuests} guests • {property.bedrooms}{" "}
                              beds • {property.bathrooms} baths
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2 pt-4 border-t border-gray-200">
                          <button
                            onClick={() =>
                              router.push(
                                `/dashboard/properties/${property.id}`
                              )
                            }
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                          >
                            <Edit className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            onClick={() =>
                              window.open(
                                `/properties/${property.id}`,
                                "_blank"
                              )
                            }
                            className="flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          <button
                            onClick={() => handleDelete(property.id)}
                            className="flex items-center justify-center gap-2 px-3 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-8">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-4 py-2 rounded-lg ${
                              currentPage === page
                                ? "bg-blue-600 text-white"
                                : "border border-gray-300 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        )
                      )}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
