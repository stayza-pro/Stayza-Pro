"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Ban,
  RotateCcw,
} from "lucide-react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ActionModal } from "@/components/admin/ActionModal";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import {
  getAllRealtors,
  approveRealtor,
  rejectRealtor,
  suspendRealtor,
  reinstateRealtor,
  Realtor,
  RealtorListResponse,
} from "@/services/adminService";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function RealtorsPage() {
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });

  // Modal states
  const [selectedRealtor, setSelectedRealtor] = useState<Realtor | null>(null);
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [suspendModal, setSuspendModal] = useState(false);
  const [reinstateModal, setReinstateModal] = useState(false);
  const [detailsModal, setDetailsModal] = useState(false);

  // Fetch realtors
  useEffect(() => {
    fetchRealtors();
  }, [currentPage, statusFilter, searchQuery]);

  const fetchRealtors = async () => {
    try {
      setIsLoading(true);
      const response: RealtorListResponse = await getAllRealtors({
        page: currentPage,
        limit: 10,
        status: statusFilter === "ALL" ? undefined : statusFilter,
        search: searchQuery || undefined,
      });

      setRealtors(response.realtors);
      setPagination(response.pagination);
    } catch (error: any) {
      console.error("Failed to fetch realtors:", error);
      toast.error(error.response?.data?.message || "Failed to load realtors");
    } finally {
      setIsLoading(false);
    }
  };

  // Action handlers
  const handleApprove = async () => {
    if (!selectedRealtor) return;
    try {
      await approveRealtor(selectedRealtor.id);
      toast.success(`${selectedRealtor.businessName} has been approved!`);
      fetchRealtors();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve realtor");
      throw error;
    }
  };

  const handleReject = async (reason: string) => {
    if (!selectedRealtor) return;
    try {
      await rejectRealtor(selectedRealtor.id, reason);
      toast.success(`${selectedRealtor.businessName} has been rejected`);
      fetchRealtors();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject realtor");
      throw error;
    }
  };

  const handleSuspend = async (reason: string) => {
    if (!selectedRealtor) return;
    try {
      await suspendRealtor(selectedRealtor.id, reason);
      toast.success(`${selectedRealtor.businessName} has been suspended`);
      fetchRealtors();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to suspend realtor");
      throw error;
    }
  };

  const handleReinstate = async (notes?: string) => {
    if (!selectedRealtor) return;
    try {
      await reinstateRealtor(selectedRealtor.id, notes);
      toast.success(`${selectedRealtor.businessName} has been reinstated`);
      fetchRealtors();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to reinstate realtor"
      );
      throw error;
    }
  };

  // Table columns
  const columns = [
    {
      key: "businessName",
      label: "Business",
      render: (realtor: Realtor) => (
        <div>
          <p className="font-medium text-gray-900">{realtor.businessName}</p>
          <p className="text-xs text-gray-500">{realtor.user.email}</p>
        </div>
      ),
    },
    {
      key: "user",
      label: "Owner",
      render: (realtor: Realtor) => (
        <div>
          <p className="text-gray-900">
            {realtor.user.firstName} {realtor.user.lastName}
          </p>
          <p className="text-xs text-gray-500">
            {realtor.user.phoneNumber || "N/A"}
          </p>
        </div>
      ),
    },
    {
      key: "corporateRegNumber",
      label: "CAC Number",
      render: (realtor: Realtor) => (
        <div>
          <p className="text-gray-900">{realtor.corporateRegNumber || "N/A"}</p>
          <StatusBadge status={realtor.cacStatus} size="sm" />
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (realtor: Realtor) => <StatusBadge status={realtor.status} />,
    },
    {
      key: "properties",
      label: "Properties",
      render: (realtor: Realtor) => {
        const count = realtor._count?.properties ?? 0;
        return <span className="text-gray-900">{count}</span>;
      },
    },
    {
      key: "createdAt",
      label: "Joined",
      render: (realtor: Realtor) => (
        <span className="text-gray-600 text-sm">
          {format(new Date(realtor.createdAt), "MMM dd, yyyy")}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (realtor: Realtor) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setSelectedRealtor(realtor);
              setDetailsModal(true);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>

          {realtor.status === "PENDING" && (
            <>
              <button
                onClick={() => {
                  setSelectedRealtor(realtor);
                  setApproveModal(true);
                }}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Approve"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSelectedRealtor(realtor);
                  setRejectModal(true);
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Reject"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}

          {realtor.status === "APPROVED" && (
            <button
              onClick={() => {
                setSelectedRealtor(realtor);
                setSuspendModal(true);
              }}
              className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              title="Suspend"
            >
              <Ban className="w-4 h-4" />
            </button>
          )}

          {realtor.status === "SUSPENDED" && (
            <button
              onClick={() => {
                setSelectedRealtor(realtor);
                setReinstateModal(true);
              }}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Reinstate"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminPageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Realtor Management
            </h1>
            <p className="text-gray-600 mt-1">
              Manage realtor accounts, approvals, and CAC verifications
            </p>
          </div>

          <button
            onClick={fetchRealtors}
            disabled={isLoading}
            className="mt-4 lg:mt-0 flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name, email, or business..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
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

        {/* Data Table */}
        <DataTable
          columns={columns}
          data={realtors}
          keyExtractor={(realtor) => realtor.id}
          isLoading={isLoading}
          pagination={{
            currentPage: pagination.page,
            totalPages: pagination.totalPages,
            total: pagination.total,
            onPageChange: setCurrentPage,
          }}
          emptyMessage={
            searchQuery || statusFilter !== "ALL"
              ? "No realtors found matching your filters"
              : "No realtors registered yet"
          }
        />

        {/* Approve Modal */}
        <ActionModal
          isOpen={approveModal}
          onClose={() => setApproveModal(false)}
          onConfirm={handleApprove}
          title="Approve Realtor"
          description={`Are you sure you want to approve ${selectedRealtor?.businessName}? They will be able to list properties on the platform.`}
          confirmText="Approve"
          variant="success"
        />

        {/* Reject Modal */}
        <ActionModal
          isOpen={rejectModal}
          onClose={() => setRejectModal(false)}
          onConfirm={handleReject}
          title="Reject Realtor"
          description={`Please provide a reason for rejecting ${selectedRealtor?.businessName}. This will be sent to the realtor.`}
          confirmText="Reject"
          variant="danger"
          requiresInput
          inputLabel="Rejection Reason"
          inputPlaceholder="e.g., Invalid CAC documentation, incomplete registration..."
        />

        {/* Suspend Modal */}
        <ActionModal
          isOpen={suspendModal}
          onClose={() => setSuspendModal(false)}
          onConfirm={handleSuspend}
          title="Suspend Realtor"
          description={`Suspending ${selectedRealtor?.businessName} will deactivate all their properties and cancel pending bookings. Please provide a reason.`}
          confirmText="Suspend"
          variant="danger"
          requiresInput
          inputLabel="Suspension Reason"
          inputPlaceholder="e.g., Policy violation, fraudulent activity..."
        />

        {/* Reinstate Modal */}
        <ActionModal
          isOpen={reinstateModal}
          onClose={() => setReinstateModal(false)}
          onConfirm={handleReinstate}
          title="Reinstate Realtor"
          description={`Are you sure you want to reinstate ${selectedRealtor?.businessName}? This will reactivate their account and properties.`}
          confirmText="Reinstate"
          variant="success"
          requiresInput={false}
          inputLabel="Notes (Optional)"
          inputPlaceholder="e.g., Account issues resolved, appeal approved..."
        />

        {/* Details Modal */}
        {detailsModal && selectedRealtor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">
                  Realtor Details
                </h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Business Info */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Business Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Business Name</p>
                      <p className="font-medium">
                        {selectedRealtor.businessName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">CAC Number</p>
                      <p className="font-medium">
                        {selectedRealtor.corporateRegNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Account Status</p>
                      <StatusBadge status={selectedRealtor.status} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">CAC Status</p>
                      <StatusBadge status={selectedRealtor.cacStatus} />
                    </div>
                  </div>
                </div>

                {/* Owner Info */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Owner Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">
                        {selectedRealtor.user.firstName}{" "}
                        {selectedRealtor.user.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">
                        {selectedRealtor.user.email}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">
                        {selectedRealtor.user.phoneNumber || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Properties</p>
                      <p className="font-medium">
                        {selectedRealtor._count?.properties ?? 0}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    Important Dates
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Joined</p>
                      <p className="font-medium">
                        {format(
                          new Date(selectedRealtor.createdAt),
                          "MMMM dd, yyyy"
                        )}
                      </p>
                    </div>
                    {selectedRealtor.cacVerifiedAt && (
                      <div>
                        <p className="text-sm text-gray-600">CAC Verified</p>
                        <p className="font-medium">
                          {format(
                            new Date(selectedRealtor.cacVerifiedAt),
                            "MMMM dd, yyyy"
                          )}
                        </p>
                      </div>
                    )}
                    {selectedRealtor.cacRejectedAt && (
                      <div>
                        <p className="text-sm text-gray-600">CAC Rejected</p>
                        <p className="font-medium text-red-600">
                          {format(
                            new Date(selectedRealtor.cacRejectedAt),
                            "MMMM dd, yyyy"
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Rejection/Suspension Info */}
                {selectedRealtor.cacRejectionReason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-semibold text-red-900 mb-2">
                      CAC Rejection Reason
                    </h4>
                    <p className="text-red-800">
                      {selectedRealtor.cacRejectionReason}
                    </p>
                    {selectedRealtor.canAppeal && (
                      <p className="text-sm text-red-700 mt-2">
                        ⏰ Can appeal until{" "}
                        {selectedRealtor.suspensionExpiresAt &&
                          format(
                            new Date(selectedRealtor.suspensionExpiresAt),
                            "MMMM dd, yyyy"
                          )}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
                <button
                  onClick={() => setDetailsModal(false)}
                  className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
}
