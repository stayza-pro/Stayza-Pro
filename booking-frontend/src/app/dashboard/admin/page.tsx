"use client";

import React, { useState, useEffect } from "react";
import {
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Eye,
  Mail,
  Building2,
  Calendar,
  MoreVertical,
} from "lucide-react";

interface Realtor {
  id: string;
  businessName: string;
  slug: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
  };
  corporateRegNumber?: string;
  businessPhone?: string;
  description?: string;
}

interface AdminDashboardStats {
  totalRealtors: number;
  pendingRealtors: number;
  approvedRealtors: number;
  rejectedRealtors: number;
}

export default function AdminDashboardPage() {
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [stats, setStats] = useState<AdminDashboardStats>({
    totalRealtors: 0,
    pendingRealtors: 0,
    approvedRealtors: 0,
    rejectedRealtors: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRealtor, setSelectedRealtor] = useState<Realtor | null>(null);

  useEffect(() => {
    fetchRealtors();
  }, [selectedStatus, searchTerm]);

  const fetchRealtors = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (selectedStatus !== "all") params.append("status", selectedStatus);
      if (searchTerm) params.append("search", searchTerm);

      const response = await fetch(`/api/admin/realtors?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch realtors");

      const data = await response.json();
      setRealtors(data.data || []);

      // Calculate stats
      const total = data.data?.length || 0;
      const pending =
        data.data?.filter((r: Realtor) => r.status === "PENDING").length || 0;
      const approved =
        data.data?.filter((r: Realtor) => r.status === "APPROVED").length || 0;
      const rejected =
        data.data?.filter((r: Realtor) => r.status === "REJECTED").length || 0;

      setStats({
        totalRealtors: total,
        pendingRealtors: pending,
        approvedRealtors: approved,
        rejectedRealtors: rejected,
      });
    } catch (error) {
      console.error("Error fetching realtors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (
    realtorId: string,
    newStatus: "APPROVED" | "REJECTED"
  ) => {
    try {
      const endpoint = newStatus === "APPROVED" ? "approve" : "reject";
      const response = await fetch(
        `/api/admin/realtors/${realtorId}/${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({
            reason:
              newStatus === "REJECTED"
                ? "Application does not meet requirements"
                : undefined,
          }),
        }
      );

      if (!response.ok) throw new Error(`Failed to ${endpoint} realtor`);

      // Refresh the list
      await fetchRealtors();

      // Show success message
      alert(`Realtor ${newStatus.toLowerCase()} successfully!`);
    } catch (error) {
      console.error(`Error ${newStatus.toLowerCase()} realtor:`, error);
      alert(`Failed to ${newStatus.toLowerCase()} realtor`);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
      APPROVED: "bg-green-100 text-green-800 border-green-200",
      REJECTED: "bg-red-100 text-red-800 border-red-200",
    };

    const icons = {
      PENDING: Clock,
      APPROVED: CheckCircle,
      REJECTED: XCircle,
    };

    const Icon = icons[status as keyof typeof icons];

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
          styles[status as keyof typeof styles]
        }`}
      >
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <p className="mt-2 text-gray-600">
              Manage realtor applications and approvals
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Realtors
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalRealtors}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.pendingRealtors}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.approvedRealtors}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.rejectedRealtors}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or business..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Realtors Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Realtor Applications
            </h3>
          </div>

          {isLoading ? (
            <div className="p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-500">Loading...</p>
            </div>
          ) : realtors.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No realtors found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No realtor applications match your criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Business
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applied
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {realtors.map((realtor) => (
                    <tr key={realtor.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {realtor.businessName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {realtor.slug}.stayza.com
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {realtor.user.firstName} {realtor.user.lastName}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {realtor.user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(realtor.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(realtor.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedRealtor(realtor)}
                            className="text-blue-600 hover:text-blue-900 p-1 rounded"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {realtor.status === "PENDING" && (
                            <>
                              <button
                                onClick={() =>
                                  handleStatusChange(realtor.id, "APPROVED")
                                }
                                className="text-green-600 hover:text-green-900 px-3 py-1 rounded-md border border-green-300 hover:bg-green-50"
                                title="Approve"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() =>
                                  handleStatusChange(realtor.id, "REJECTED")
                                }
                                className="text-red-600 hover:text-red-900 px-3 py-1 rounded-md border border-red-300 hover:bg-red-50"
                                title="Reject"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Realtor Details Modal */}
      {selectedRealtor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Realtor Details
                </h3>
                <button
                  onClick={() => setSelectedRealtor(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Business Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Business Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Business Name:</span>
                      <p className="font-medium">
                        {selectedRealtor.businessName}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Subdomain:</span>
                      <p className="font-medium">
                        {selectedRealtor.slug}.stayza.com
                      </p>
                    </div>
                    {selectedRealtor.corporateRegNumber && (
                      <div>
                        <span className="text-gray-500">
                          Registration Number:
                        </span>
                        <p className="font-medium">
                          {selectedRealtor.corporateRegNumber}
                        </p>
                      </div>
                    )}
                    {selectedRealtor.businessPhone && (
                      <div>
                        <span className="text-gray-500">Business Phone:</span>
                        <p className="font-medium">
                          {selectedRealtor.businessPhone}
                        </p>
                      </div>
                    )}
                  </div>
                  {selectedRealtor.description && (
                    <div className="mt-3">
                      <span className="text-gray-500">Description:</span>
                      <p className="mt-1">{selectedRealtor.description}</p>
                    </div>
                  )}
                </div>

                {/* Contact Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Full Name:</span>
                      <p className="font-medium">
                        {selectedRealtor.user.firstName}{" "}
                        {selectedRealtor.user.lastName}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="font-medium">
                        {selectedRealtor.user.email}
                      </p>
                    </div>
                    {selectedRealtor.user.phone && (
                      <div>
                        <span className="text-gray-500">Phone:</span>
                        <p className="font-medium">
                          {selectedRealtor.user.phone}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status & Actions */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Status & Actions
                  </h4>
                  <div className="flex items-center justify-between">
                    <div>{getStatusBadge(selectedRealtor.status)}</div>

                    {selectedRealtor.status === "PENDING" && (
                      <div className="space-x-3">
                        <button
                          onClick={() => {
                            handleStatusChange(selectedRealtor.id, "APPROVED");
                            setSelectedRealtor(null);
                          }}
                          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                        >
                          Approve Application
                        </button>
                        <button
                          onClick={() => {
                            handleStatusChange(selectedRealtor.id, "REJECTED");
                            setSelectedRealtor(null);
                          }}
                          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
                        >
                          Reject Application
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
