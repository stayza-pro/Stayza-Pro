"use client";

import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import {
  adminService,
  analyticsService,
  type AdminRealtorResponse,
  type RealtorSuspensionData,
  type RealtorApprovalData,
  type PlatformAnalytics,
} from "@/services";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-hot-toast";

interface AdminRealtorManagementProps {
  className?: string;
}

const formatNgnAmount = (value: unknown): string => {
  const amount = Number(value);
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return safeAmount.toLocaleString("en-NG");
};

export const AdminRealtorManagement: React.FC<AdminRealtorManagementProps> = ({
  className = "",
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRealtor, setSelectedRealtor] =
    useState<AdminRealtorResponse | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);

  // Query for all realtors
  const {
    data: realtorsData,
    isLoading: realtorsLoading,
    error: realtorsError,
  } = useQuery(["admin-realtors"], () => adminService.getAllRealtors(), {
    enabled: !!user,
    refetchOnWindowFocus: false,
  });

  // Query for platform analytics
  const { data: analytics, isLoading: analyticsLoading } = useQuery(
    ["platform-analytics"],
    () => analyticsService.getPlatformAnalytics(),
    {
      enabled: !!user,
      refetchOnWindowFocus: false,
    }
  );

  // Suspend realtor mutation
  const suspendRealtorMutation = useMutation(
    ({ realtorId, data }: { realtorId: string; data: RealtorSuspensionData }) =>
      adminService.suspendRealtor(realtorId, data),
    {
      onSuccess: () => {
        toast.success("Realtor suspended successfully");
        queryClient.invalidateQueries(["admin-realtors"]);
        setShowSuspensionModal(false);
        setSelectedRealtor(null);
      },
      onError: (error: any) => {
        toast.error(adminService.extractErrorMessage(error));
      },
    }
  );

  // Approve realtor mutation
  const approveRealtorMutation = useMutation(
    ({ realtorId, data }: { realtorId: string; data: RealtorApprovalData }) =>
      adminService.approveRealtor(realtorId, data),
    {
      onSuccess: () => {
        toast.success("Realtor approved successfully");
        queryClient.invalidateQueries(["admin-realtors"]);
        setShowApprovalModal(false);
        setSelectedRealtor(null);
      },
      onError: (error: any) => {
        toast.error(adminService.extractErrorMessage(error));
      },
    }
  );

  // Reactivate realtor mutation
  const reactivateRealtorMutation = useMutation(
    (realtorId: string) => adminService.reactivateRealtor(realtorId),
    {
      onSuccess: () => {
        toast.success("Realtor reactivated successfully");
        queryClient.invalidateQueries(["admin-realtors"]);
      },
      onError: (error: any) => {
        toast.error(adminService.extractErrorMessage(error));
      },
    }
  );

  const handleSuspendRealtor = (data: RealtorSuspensionData) => {
    if (!selectedRealtor) return;
    suspendRealtorMutation.mutate({ realtorId: selectedRealtor.id, data });
  };

  const handleApproveRealtor = (data: RealtorApprovalData) => {
    if (!selectedRealtor) return;
    approveRealtorMutation.mutate({ realtorId: selectedRealtor.id, data });
  };

  const handleReactivateRealtor = (realtorId: string) => {
    reactivateRealtorMutation.mutate(realtorId);
  };

  const filteredRealtors =
    realtorsData?.data?.filter((realtor) => {
      if (filterStatus === "all") return true;
      return realtor.status === filterStatus;
    }) || [];

  if (realtorsLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (realtorsError) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
            <h3 className="font-medium">Error loading realtor data</h3>
            <p className="text-sm mt-1">
              {adminService.extractErrorMessage(realtorsError)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Realtor Management</h1>
        <p className="text-gray-600 mt-1">
          Manage realtor accounts, approvals, and platform oversight
        </p>
      </div>

      {/* Analytics Overview */}
      {analytics && !analyticsLoading && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-600">
              Total Realtors
            </div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {analytics.overview.realtors?.total ?? 0}
            </div>
            <div className="text-sm text-green-600 mt-1">
              +{analytics.overview.realtors?.growth ?? 0} this month
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-600">
              Active Realtors
            </div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {filteredRealtors.filter((r) => r.status === "APPROVED").length}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-600">
              Pending Approval
            </div>
            <div className="text-2xl font-bold text-yellow-600 mt-1">
              {filteredRealtors.filter((r) => r.status === "PENDING").length}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-sm font-medium text-gray-600">Suspended</div>
            <div className="text-2xl font-bold text-red-600 mt-1">
              {filteredRealtors.filter((r) => r.status === "SUSPENDED").length}
            </div>
          </div>
        </div>
      )}

      {/* Revenue Analytics */}
      {analytics && !analyticsLoading && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Revenue Overview
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <div className="text-sm font-medium text-gray-600">
                Total Revenue
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-1">
                ₦{formatNgnAmount(analytics.overview.revenue.total)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                All time platform revenue
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-600">
                This Month
              </div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                ₦
                {(
                  (analytics.overview.revenue.total *
                    analytics.overview.revenue.growth) /
                  100
                ).toLocaleString("en-NG")}
              </div>
              <div className="text-sm text-green-500 mt-1">
                +{analytics.overview.revenue.growth.toFixed(1)}% from last month
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-600">
                Commission Earned
              </div>
              <div className="text-2xl font-bold text-blue-600 mt-1">
                ₦{formatNgnAmount(analytics.overview.revenue.total * 0.1)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Platform commission revenue
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">
            Filter by Status:
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Realtors</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Realtors List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Realtors ({filteredRealtors.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Realtor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Business Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Properties
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRealtors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No realtors found
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No realtors match the current filter criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRealtors.map((realtor) => (
                  <tr key={realtor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {realtor.user.firstName.charAt(0)}
                            {realtor.user.lastName.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {realtor.user.firstName} {realtor.user.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {realtor.user.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {realtor.user.phone}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {realtor.businessName || "Not provided"}
                      </div>
                      {realtor.businessAddress && (
                        <div className="text-sm text-gray-500">
                          {realtor.businessAddress}
                        </div>
                      )}
                      {realtor.corporateRegNumber && (
                        <div className="text-xs text-gray-500">
                          CAC: {realtor.corporateRegNumber}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                        ${
                          adminService.getRealtorStatusColor(realtor.status) ===
                          "green"
                            ? "bg-green-100 text-green-800"
                            : adminService.getRealtorStatusColor(
                                realtor.status
                              ) === "yellow"
                            ? "bg-yellow-100 text-yellow-800"
                            : adminService.getRealtorStatusColor(
                                realtor.status
                              ) === "red"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {adminService.getRealtorStatusLabel(realtor.status)}
                      </span>
                      {realtor.user.isEmailVerified && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Email Verified
                          </span>
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {realtor._count?.properties ?? 0}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(realtor.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setSelectedRealtor(realtor)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </button>

                      {realtor.status === "PENDING" && (
                        <button
                          onClick={() => {
                            setSelectedRealtor(realtor);
                            setShowApprovalModal(true);
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          Approve
                        </button>
                      )}

                      {realtor.status === "APPROVED" && (
                        <button
                          onClick={() => {
                            setSelectedRealtor(realtor);
                            setShowSuspensionModal(true);
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          Suspend
                        </button>
                      )}

                      {realtor.status === "SUSPENDED" && (
                        <button
                          onClick={() => handleReactivateRealtor(realtor.id)}
                          disabled={reactivateRealtorMutation.isLoading}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Realtor Detail Modal */}
      {selectedRealtor && !showSuspensionModal && !showApprovalModal && (
        <RealtorDetailModal
          realtor={selectedRealtor}
          onClose={() => setSelectedRealtor(null)}
        />
      )}

      {/* Suspension Modal */}
      {showSuspensionModal && selectedRealtor && (
        <SuspensionModal
          realtor={selectedRealtor}
          onClose={() => setShowSuspensionModal(false)}
          onSubmit={handleSuspendRealtor}
          isLoading={suspendRealtorMutation.isLoading}
        />
      )}

      {/* Approval Modal */}
      {showApprovalModal && selectedRealtor && (
        <ApprovalModal
          realtor={selectedRealtor}
          onClose={() => setShowApprovalModal(false)}
          onSubmit={handleApproveRealtor}
          isLoading={approveRealtorMutation.isLoading}
        />
      )}
    </div>
  );
};

// Modal Components
const RealtorDetailModal: React.FC<{
  realtor: AdminRealtorResponse;
  onClose: () => void;
}> = ({ realtor, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              Realtor Details: {realtor.user.firstName} {realtor.user.lastName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-900">{realtor.user.email}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>
                <span className="ml-2 text-gray-900">{realtor.user.phone}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className="ml-2">
                  {adminService.getRealtorStatusLabel(realtor.status)}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">
                  Email Verified:
                </span>
                <span className="ml-2">
                  {realtor.user.isEmailVerified ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Joined:</span>
                <span className="ml-2">
                  {new Date(realtor.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Properties:</span>
                <span className="ml-2">{realtor._count?.properties ?? 0}</span>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Business Information
            </h3>
            <div className="space-y-3 text-sm">
              {realtor.businessName && (
                <div>
                  <span className="font-medium text-gray-700">
                    Business Name:
                  </span>
                  <span className="ml-2 text-gray-900">
                    {realtor.businessName}
                  </span>
                </div>
              )}
              {realtor.businessAddress && (
                <div>
                  <span className="font-medium text-gray-700">
                    Business Address:
                  </span>
                  <span className="ml-2 text-gray-900">
                    {realtor.businessAddress}
                  </span>
                </div>
              )}
              {realtor.corporateRegNumber && (
                <div>
                  <span className="font-medium text-gray-700">CAC Number:</span>
                  <span className="ml-2 text-gray-900">
                    {realtor.corporateRegNumber}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SuspensionModal: React.FC<{
  realtor: AdminRealtorResponse;
  onClose: () => void;
  onSubmit: (data: RealtorSuspensionData) => void;
  isLoading: boolean;
}> = ({ realtor, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<RealtorSuspensionData>({
    reason: "",
    notes: "",
    suspendedUntil: undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              Suspend Realtor: {realtor.user.firstName} {realtor.user.lastName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Reason for Suspension <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.reason}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, reason: e.target.value }))
              }
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Policy violation, fraud, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Suspension End Date (Optional)
            </label>
            <input
              type="date"
              value={
                formData.suspendedUntil
                  ? new Date(formData.suspendedUntil)
                      .toISOString()
                      .split("T")[0]
                  : ""
              }
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  suspendedUntil: e.target.value
                    ? new Date(e.target.value)
                    : undefined,
                }))
              }
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-sm text-gray-500 mt-1">
              Leave empty for indefinite suspension
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Additional Notes
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, notes: e.target.value }))
              }
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional context or instructions..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              {isLoading ? "Suspending..." : "Suspend Realtor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ApprovalModal: React.FC<{
  realtor: AdminRealtorResponse;
  onClose: () => void;
  onSubmit: (data: RealtorApprovalData) => void;
  isLoading: boolean;
}> = ({ realtor, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<RealtorApprovalData>({
    approvalNotes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              Approve Realtor: {realtor.user.firstName} {realtor.user.lastName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm">
              You are about to approve this realtor's account. They will be able
              to list properties and receive bookings after approval.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Approval Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={formData.approvalNotes}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  approvalNotes: e.target.value,
                }))
              }
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Welcome message or approval notes..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {isLoading ? "Approving..." : "Approve Realtor"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminRealtorManagement;

