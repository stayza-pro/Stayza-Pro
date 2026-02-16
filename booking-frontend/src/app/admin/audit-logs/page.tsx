"use client";

import React, { useState, useEffect } from "react";
import {
  RefreshCw,
  Download,
  Filter,
  Search,
  FileText,
  Calendar,
  User,
} from "lucide-react";
import { AdminPageLayout } from "@/components/admin/AdminPageLayout";
import { DataTable } from "@/components/admin/DataTable";
import { getAuditLogs, AuditLog } from "@/services/adminService";
import { serviceUtils } from "@/services";
import toast from "react-hot-toast";
import { format } from "date-fns";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    action: "",
    entityType: "",
    search: "",
  });

  // Fetch audit logs
  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, filters]);

  const fetchAuditLogs = async () => {
    try {
      setIsLoading(true);
      const response = await getAuditLogs({
        page: currentPage,
        limit: 15,
        action: filters.action || undefined,
        entityType: filters.entityType || undefined,
      });

      setLogs(response.logs || []);
      setPagination(
        response.pagination || {
          page: 1,
          limit: 15,
          total: 0,
          totalPages: 0,
        },
      );
    } catch (error: any) {
      toast.error(serviceUtils.extractErrorMessage(error));
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAuditLogs();
  };

  const handleExport = () => {
    if (logs.length === 0) {
      toast.error("No data to export");
      return;
    }

    // Export to CSV
    const csvData = logs.map((log) => ({
      Date: format(new Date(log.createdAt), "yyyy-MM-dd HH:mm:ss"),
      Admin: log.admin
        ? `${log.admin.firstName} ${log.admin.lastName}`
        : "System",
      Action: log.action,
      Entity: log.entityType,
      EntityID: log.entityId,
      IPAddress: log.ipAddress || "N/A",
    }));

    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        headers
          .map((header) => `"${row[header as keyof typeof row]}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast.success("Audit logs exported successfully!");
  };

  // Get action badge color
  const getActionBadgeColor = (action: string) => {
    if (action.includes("APPROVE"))
      return "bg-green-100 text-green-800 border-green-200";
    if (action.includes("REJECT"))
      return "bg-red-100 text-red-800 border-red-200";
    if (action.includes("SUSPEND"))
      return "bg-orange-100 text-orange-800 border-orange-200";
    if (action.includes("PAYOUT"))
      return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-gray-100 text-gray-800 border-gray-200";
  };

  // Table columns
  const columns = [
    {
      key: "createdAt",
      label: "Date & Time",
      render: (log: AuditLog) => (
        <div>
          <p className="font-medium text-gray-900">
            {format(new Date(log.createdAt), "MMM dd, yyyy")}
          </p>
          <p className="text-xs text-gray-500">
            {format(new Date(log.createdAt), "HH:mm:ss")}
          </p>
        </div>
      ),
    },
    {
      key: "admin",
      label: "Admin",
      render: (log: AuditLog) => (
        <div>
          <p className="font-medium text-gray-900">
            {log.admin
              ? `${log.admin.firstName} ${log.admin.lastName}`
              : "System"}
          </p>
          <p className="text-xs text-gray-500">
            {log.admin?.email || "Automated"}
          </p>
        </div>
      ),
    },
    {
      key: "action",
      label: "Action",
      render: (log: AuditLog) => (
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getActionBadgeColor(
            log.action,
          )}`}
        >
          {log.action.replace(/_/g, " ")}
        </span>
      ),
    },
    {
      key: "entityType",
      label: "Entity Type",
      render: (log: AuditLog) => (
        <span className="text-sm text-gray-900">{log.entityType}</span>
      ),
    },
    {
      key: "entityId",
      label: "Entity ID",
      render: (log: AuditLog) => (
        <span className="text-xs font-mono text-gray-600">
          {log.entityId.substring(0, 8)}...
        </span>
      ),
    },
    {
      key: "ipAddress",
      label: "IP Address",
      render: (log: AuditLog) => (
        <span className="text-sm text-gray-600">{log.ipAddress || "N/A"}</span>
      ),
    },
    {
      key: "details",
      label: "Details",
      render: (log: AuditLog) => (
        <button
          onClick={() => {
            // Show details modal
            alert("Details: " + JSON.stringify(log.details, null, 2));
          }}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View
        </button>
      ),
    },
  ];

  return (
    <AdminPageLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-600 mt-1">
              Track all administrative actions and system events
            </p>
          </div>

          <div className="mt-4 lg:mt-0 flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExport}
              disabled={logs.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {pagination.total}
                </p>
                <p className="text-sm text-gray-600">Total Logs</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">Today</p>
                <p className="text-sm text-gray-600">
                  {format(new Date(), "MMM dd, yyyy")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <User className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(logs.map((log) => log.adminId)).size}
                </p>
                <p className="text-sm text-gray-600">Active Admins</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search logs..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Action Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filters.action}
                onChange={(e) => {
                  setFilters({ ...filters, action: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="">All Actions</option>
                <option value="REALTOR_APPROVED">Realtor Approved</option>
                <option value="REALTOR_REJECTED">Realtor Rejected</option>
                <option value="REALTOR_SUSPENDED">Realtor Suspended</option>
                <option value="PAYOUT_PROCESSED">Payout Processed</option>
                <option value="CAC_APPROVED">CAC Approved</option>
                <option value="CAC_REJECTED">CAC Rejected</option>
              </select>
            </div>

            {/* Entity Type Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={filters.entityType}
                onChange={(e) => {
                  setFilters({ ...filters, entityType: e.target.value });
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              >
                <option value="">All Entity Types</option>
                <option value="REALTOR">Realtor</option>
                <option value="PAYMENT">Payment</option>
                <option value="PROPERTY">Property</option>
                <option value="USER">User</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <DataTable
          columns={columns}
          data={logs}
          keyExtractor={(log) => log.id}
          isLoading={isLoading}
          pagination={{
            currentPage: pagination.page,
            totalPages: pagination.totalPages,
            total: pagination.total,
            onPageChange: setCurrentPage,
          }}
          emptyMessage="No audit logs found"
        />
      </div>
    </AdminPageLayout>
  );
}
