"use client";

import React, { useState, useEffect } from "react";
import {
  FileCheck,
  FileX,
  Clock,
  Download,
  Eye,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Calendar,
} from "lucide-react";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { ActionModal } from "@/components/admin/ActionModal";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import {
  getAllRealtors,
  approveCac,
  rejectCac,
  Realtor,
} from "@/services/adminService";
import toast from "react-hot-toast";
import { format, differenceInDays } from "date-fns";

export default function CacVerificationPage() {
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
  const [documentModal, setDocumentModal] = useState(false);

  // Fetch realtors with pending CAC
  useEffect(() => {
    fetchRealtors();
  }, [currentPage]);

  const fetchRealtors = async () => {
    try {
      setIsLoading(true);
      // Fetch all realtors, we'll filter by CAC status on frontend
      const response = await getAllRealtors({
        page: currentPage,
        limit: 10,
      });

      // Filter to show only those needing CAC verification
      const needsVerification = response.realtors.filter(
        (r) => r.cacStatus === "PENDING" || r.cacStatus === "REJECTED"
      );

      setRealtors(needsVerification);
      setPagination({
        ...response.pagination,
        total: needsVerification.length,
      });
    } catch (error: any) {
      console.error("Failed to fetch realtors:", error);
      toast.error(
        error.response?.data?.message || "Failed to load CAC verifications"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Action handlers
  const handleApproveCac = async () => {
    if (!selectedRealtor) return;
    try {
      await approveCac(selectedRealtor.id);
      toast.success(`CAC approved for ${selectedRealtor.businessName}!`);
      fetchRealtors();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to approve CAC");
      throw error;
    }
  };

  const handleRejectCac = async (reason: string) => {
    if (!selectedRealtor) return;
    try {
      await rejectCac(selectedRealtor.id, reason);
      toast.success(`CAC rejected for ${selectedRealtor.businessName}`);
      fetchRealtors();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to reject CAC");
      throw error;
    }
  };

  // Calculate days remaining for appeal
  const getDaysRemaining = (suspensionExpiresAt: string | null) => {
    if (!suspensionExpiresAt) return null;
    const days = differenceInDays(new Date(suspensionExpiresAt), new Date());
    return days > 0 ? days : 0;
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
      key: "corporateRegNumber",
      label: "CAC Number",
      render: (realtor: Realtor) => (
        <div>
          <p className="font-medium text-gray-900">
            {realtor.corporateRegNumber || "N/A"}
          </p>
          <StatusBadge status={realtor.cacStatus} size="sm" />
        </div>
      ),
    },
    {
      key: "document",
      label: "Document",
      render: (realtor: Realtor) => (
        <div>
          {realtor.cacDocumentUrl ? (
            <button
              onClick={() => {
                setSelectedRealtor(realtor);
                setDocumentModal(true);
              }}
              className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm"
            >
              <Eye className="w-4 h-4" />
              <span>View Document</span>
            </button>
          ) : (
            <span className="text-xs text-gray-500">No document</span>
          )}
        </div>
      ),
    },
    {
      key: "submittedAt",
      label: "Submitted",
      render: (realtor: Realtor) => (
        <span className="text-sm text-gray-600">
          {format(new Date(realtor.createdAt), "MMM dd, yyyy")}
        </span>
      ),
    },
    {
      key: "appeal",
      label: "Appeal Status",
      render: (realtor: Realtor) => {
        if (realtor.cacStatus === "REJECTED" && realtor.canAppeal) {
          const daysRemaining = getDaysRemaining(realtor.suspensionExpiresAt);
          return (
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-orange-700">
                {daysRemaining} days left
              </span>
            </div>
          );
        }
        return <span className="text-xs text-gray-500">-</span>;
      },
    },
    {
      key: "actions",
      label: "Actions",
      render: (realtor: Realtor) => (
        <div className="flex items-center space-x-2">
          {realtor.cacStatus === "PENDING" && (
            <>
              <button
                onClick={() => {
                  setSelectedRealtor(realtor);
                  setApproveModal(true);
                }}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                title="Approve CAC"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSelectedRealtor(realtor);
                  setRejectModal(true);
                }}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Reject CAC"
              >
                <FileX className="w-4 h-4" />
              </button>
            </>
          )}

          {realtor.cacStatus === "REJECTED" && realtor.canAppeal && (
            <span className="text-xs text-orange-600 font-medium">
              Awaiting Appeal
            </span>
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
              CAC Verification
            </h1>
            <p className="text-gray-600 mt-1">
              Review and verify Corporate Affairs Commission (CAC) registrations
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

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {realtors.filter((r) => r.cacStatus === "PENDING").length}
                </p>
                <p className="text-sm text-gray-600">Pending Review</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    realtors.filter(
                      (r) => r.cacStatus === "REJECTED" && r.canAppeal
                    ).length
                  }
                </p>
                <p className="text-sm text-gray-600">Awaiting Appeal</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileCheck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {realtors.length}
                </p>
                <p className="text-sm text-gray-600">Total Submissions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileCheck className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                CAC Verification Process
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
                <div>
                  <p className="font-medium mb-1">1. Review Documents</p>
                  <p className="text-blue-700">
                    Verify CAC number and uploaded certificate
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">2. Make Decision</p>
                  <p className="text-blue-700">
                    Approve valid registrations or reject with reason
                  </p>
                </div>
                <div>
                  <p className="font-medium mb-1">3. Appeal Period</p>
                  <p className="text-blue-700">
                    Rejected realtors have 30 days to appeal
                  </p>
                </div>
              </div>
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
          emptyMessage="No CAC verifications pending"
        />

        {/* Approve Modal */}
        <ActionModal
          isOpen={approveModal}
          onClose={() => setApproveModal(false)}
          onConfirm={handleApproveCac}
          title="Approve CAC"
          description={`Approve CAC registration for ${selectedRealtor?.businessName}? They will be able to list properties immediately.`}
          confirmText="Approve CAC"
          variant="success"
        />

        {/* Reject Modal */}
        <ActionModal
          isOpen={rejectModal}
          onClose={() => setRejectModal(false)}
          onConfirm={handleRejectCac}
          title="Reject CAC"
          description={`Reject CAC registration for ${selectedRealtor?.businessName}. They will have 30 days to appeal with a new CAC number.`}
          confirmText="Reject CAC"
          variant="danger"
          requiresInput
          inputLabel="Rejection Reason"
          inputPlaceholder="e.g., Invalid CAC number, document not legible, information mismatch..."
        />

        {/* Document Viewer Modal */}
        {documentModal && selectedRealtor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    CAC Document - {selectedRealtor.businessName}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    CAC Number: {selectedRealtor.corporateRegNumber}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  {selectedRealtor.cacDocumentUrl && (
                    <a
                      href={selectedRealtor.cacDocumentUrl}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Download className="w-5 h-5" />
                    </a>
                  )}
                  <button
                    onClick={() => setDocumentModal(false)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                {selectedRealtor.cacDocumentUrl ? (
                  <div className="bg-gray-100 rounded-lg overflow-hidden">
                    {/* Check if PDF or image */}
                    {selectedRealtor.cacDocumentUrl
                      .toLowerCase()
                      .endsWith(".pdf") ? (
                      <iframe
                        src={selectedRealtor.cacDocumentUrl}
                        className="w-full h-[600px] border-0"
                        title="CAC Document"
                      />
                    ) : (
                      <img
                        src={selectedRealtor.cacDocumentUrl}
                        alt="CAC Document"
                        className="w-full h-auto"
                      />
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileX className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>No document available</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <StatusBadge status={selectedRealtor.cacStatus} />
                  {selectedRealtor.cacRejectedAt && (
                    <span className="text-sm text-red-600">
                      Rejected:{" "}
                      {format(
                        new Date(selectedRealtor.cacRejectedAt),
                        "MMM dd, yyyy"
                      )}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => {
                      setDocumentModal(false);
                      setRejectModal(true);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      setDocumentModal(false);
                      setApproveModal(true);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Approve
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPageLayout>
  );
}
