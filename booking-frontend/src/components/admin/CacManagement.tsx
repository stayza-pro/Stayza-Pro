"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { toast } from "react-hot-toast";
import {
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Ban,
  UserCheck,
  Calendar,
  FileText,
  Mail,
  Phone,
  Building2,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

import { Card, Button, Loading } from "@/components/ui";
import { Realtor, CacStatus, RealtorStatus } from "@/types";
import { realtorService } from "@/services";

interface CacManagementProps {
  className?: string;
}

export const CacManagement: React.FC<CacManagementProps> = ({
  className = "",
}) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CacStatus | "all">("all");
  const [realtorStatusFilter, setRealtorStatusFilter] = useState<
    RealtorStatus | "all"
  >("all");
  const [selectedRealtor, setSelectedRealtor] = useState<Realtor | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch all realtors for admin review
  const {
    data: realtorsData,
    isLoading,
    error,
  } = useQuery(
    ["admin-realtors", statusFilter, realtorStatusFilter],
    () =>
      realtorService.getAllRealtorsForAdmin({
        cacStatus: statusFilter !== "all" ? statusFilter : undefined,
        status: realtorStatusFilter !== "all" ? realtorStatusFilter : undefined,
      }),
    {
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  // Approve CAC mutation
  const approveCacMutation = useMutation(
    (realtorId: string) => realtorService.approveCac(realtorId),
    {
      onSuccess: () => {
        toast.success("CAC number approved successfully!");
        queryClient.invalidateQueries("admin-realtors");
        setSelectedRealtor(null);
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to approve CAC");
      },
    }
  );

  // Reject CAC mutation
  const rejectCacMutation = useMutation(
    ({ realtorId, reason }: { realtorId: string; reason: string }) =>
      realtorService.rejectCac(realtorId, reason),
    {
      onSuccess: () => {
        toast.success("CAC number rejected and account suspended");
        queryClient.invalidateQueries("admin-realtors");
        setSelectedRealtor(null);
        setShowRejectModal(false);
        setRejectionReason("");
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Failed to reject CAC");
      },
    }
  );

  const realtors = realtorsData?.data || [];

  // Filter realtors based on search
  const filteredRealtors = realtors.filter(
    (realtor) =>
      realtor.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      realtor.user?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      realtor.corporateRegNumber
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
  );

  const handleApproveCac = (realtor: Realtor) => {
    if (window.confirm(`Approve CAC number for ${realtor.businessName}?`)) {
      approveCacMutation.mutate(realtor.id);
    }
  };

  const handleRejectCac = () => {
    if (!selectedRealtor || !rejectionReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    rejectCacMutation.mutate({
      realtorId: selectedRealtor.id,
      reason: rejectionReason,
    });
  };

  const getStatusBadge = (status: CacStatus) => {
    const statusConfig = {
      PENDING: {
        color: "bg-yellow-100 text-yellow-800",
        icon: Clock,
        label: "Pending",
      },
      APPROVED: {
        color: "bg-green-100 text-green-800",
        icon: CheckCircle,
        label: "Approved",
      },
      REJECTED: {
        color: "bg-red-100 text-red-800",
        icon: XCircle,
        label: "Rejected",
      },
      SUSPENDED: {
        color: "bg-red-100 text-red-800",
        icon: Ban,
        label: "Suspended",
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </span>
    );
  };

  const getRealtorStatusBadge = (status: RealtorStatus) => {
    const statusConfig = {
      PENDING: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      APPROVED: { color: "bg-green-100 text-green-800", label: "Approved" },
      REJECTED: { color: "bg-red-100 text-red-800", label: "Rejected" },
      SUSPENDED: { color: "bg-red-100 text-red-800", label: "Suspended" },
    };

    const config = statusConfig[status];

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const RealtorCard = ({ realtor }: { realtor: Realtor }) => (
    <Card className="p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {realtor.businessName}
          </h3>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-2" />
              {realtor.user?.email}
            </div>
            {realtor.businessPhone && (
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                {realtor.businessPhone}
              </div>
            )}
            {realtor.corporateRegNumber && (
              <div className="flex items-center">
                <Building2 className="h-4 w-4 mr-2" />
                CAC: {realtor.corporateRegNumber}
              </div>
            )}
          </div>
        </div>
        <div className="text-right space-y-2">
          {getStatusBadge(realtor.cacStatus)}
          {getRealtorStatusBadge(realtor.status)}
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <span>
          Registered: {format(new Date(realtor.createdAt), "MMM dd, yyyy")}
        </span>
        {realtor.cacVerifiedAt && (
          <span>
            CAC Approved:{" "}
            {format(new Date(realtor.cacVerifiedAt), "MMM dd, yyyy")}
          </span>
        )}
      </div>

      {realtor.cacRejectionReason && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">
            <strong>Rejection Reason:</strong> {realtor.cacRejectionReason}
          </p>
        </div>
      )}

      {realtor.suspendedAt && realtor.suspensionExpiresAt && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-800">
            <strong>Suspended until:</strong>{" "}
            {format(
              new Date(realtor.suspensionExpiresAt),
              "MMM dd, yyyy HH:mm"
            )}
          </p>
          {realtor.canAppeal && (
            <p className="text-xs text-orange-600 mt-1">
              Account will be deleted if no appeal is submitted by the expiry
              date.
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        {realtor.cacStatus === "PENDING" && (
          <>
            <Button
              size="sm"
              onClick={() => handleApproveCac(realtor)}
              disabled={approveCacMutation.isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <UserCheck className="h-4 w-4 mr-1" />
              Approve CAC
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedRealtor(realtor);
                setShowRejectModal(true);
              }}
              disabled={rejectCacMutation.isLoading}
              className="border-red-300 text-red-600 hover:bg-red-50"
            >
              <Ban className="h-4 w-4 mr-1" />
              Reject CAC
            </Button>
          </>
        )}

        <Button
          size="sm"
          variant="outline"
          onClick={() => setSelectedRealtor(realtor)}
        >
          <Eye className="h-4 w-4 mr-1" />
          View Details
        </Button>
      </div>
    </Card>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">CAC Verification</h2>
          <p className="text-gray-600">
            Manage realtor CAC number verification
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Business name, email, CAC..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              CAC Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as CacStatus | "all")
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All CAC Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Realtor Status
            </label>
            <select
              value={realtorStatusFilter}
              onChange={(e) =>
                setRealtorStatusFilter(e.target.value as RealtorStatus | "all")
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Realtor Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setRealtorStatusFilter("all");
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center">
            <Clock className="h-8 w-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending CAC</p>
              <p className="text-2xl font-bold text-gray-900">
                {realtors.filter((r) => r.cacStatus === "PENDING").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Approved CAC</p>
              <p className="text-2xl font-bold text-gray-900">
                {realtors.filter((r) => r.cacStatus === "APPROVED").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected CAC</p>
              <p className="text-2xl font-bold text-gray-900">
                {realtors.filter((r) => r.cacStatus === "REJECTED").length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center">
            <Ban className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Suspended</p>
              <p className="text-2xl font-bold text-gray-900">
                {realtors.filter((r) => r.suspendedAt).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Realtors List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loading size="lg" />
        </div>
      ) : error ? (
        <Card className="p-12 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Realtors
          </h3>
          <p className="text-gray-600">
            There was an error loading realtor data. Please try again.
          </p>
        </Card>
      ) : filteredRealtors.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Realtors Found
          </h3>
          <p className="text-gray-600">
            No realtors match your current filter criteria.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredRealtors.map((realtor) => (
            <RealtorCard key={realtor.id} realtor={realtor} />
          ))}
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedRealtor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reject CAC Number
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Rejecting CAC for <strong>{selectedRealtor.businessName}</strong>{" "}
              will suspend their account for 5 days.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rejection Reason *
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a clear reason for rejection..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason("");
                  setSelectedRealtor(null);
                }}
                disabled={rejectCacMutation.isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRejectCac}
                disabled={
                  rejectCacMutation.isLoading || !rejectionReason.trim()
                }
                className="bg-red-600 hover:bg-red-700"
              >
                {rejectCacMutation.isLoading ? "Rejecting..." : "Reject CAC"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
