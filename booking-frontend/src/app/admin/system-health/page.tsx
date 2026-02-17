"use client";

import React from "react";
import { SystemHealthDashboard } from "@/components/admin/SystemHealthDashboard";
import { Card } from "@/components/ui";
import {
  Activity,
  AlertTriangle,
  Mail,
  RefreshCw,
  Server,
  Shield,
} from "lucide-react";
import {
  useActiveJobLocks,
  useEmailWorkerHealth,
  useSystemHealthStats,
} from "@/hooks/useEscrow";
import { formatRelative } from "@/utils/timezone";

export default function SystemHealthPage() {
  const {
    data: jobLocks = [],
    isLoading: isLoadingLocks,
    error: jobLocksError,
  } = useActiveJobLocks(true);
  const {
    data: systemHealthStats,
    isLoading: isLoadingSystemStats,
    error: systemHealthError,
  } = useSystemHealthStats(true);
  const {
    data: emailWorkerHealth,
    isLoading: isLoadingEmailHealth,
    error: emailWorkerError,
  } = useEmailWorkerHealth(true);

  const isLoadingDashboard = isLoadingLocks || isLoadingSystemStats;
  const hasSystemDataIssue = Boolean(jobLocksError || systemHealthError);
  const hasEmailQueueIssue = Boolean(
    emailWorkerError ||
      (emailWorkerHealth?.queue.failed ?? 0) > 0 ||
      (emailWorkerHealth?.queue.stuckProcessing ?? 0) > 0,
  );

  const systemStatusLabel = hasSystemDataIssue ? "Degraded" : "Operational";
  const systemStatusTextClass = hasSystemDataIssue
    ? "text-yellow-600"
    : "text-green-600";
  const systemStatusBgClass = hasSystemDataIssue
    ? "bg-yellow-100"
    : "bg-green-100";
  const systemStatusIconClass = hasSystemDataIssue
    ? "text-yellow-600"
    : "text-green-600";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Activity className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              System Health Monitor
            </h1>
          </div>
          <p className="text-gray-600">
            Real-time monitoring of escrow system operations, webhooks, retries,
            and job locks
          </p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  System Status
                </p>
                <p className={`text-2xl font-bold ${systemStatusTextClass}`}>
                  {systemStatusLabel}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${systemStatusBgClass}`}>
                <Server className={`w-6 h-6 ${systemStatusIconClass}`} />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Escrow Protection
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {systemHealthStats ? "Active" : "Loading"}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  Auto-refresh
                </p>
                <p className="text-2xl font-bold text-purple-600">10s / 15s</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Activity className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Main Dashboard */}
        <SystemHealthDashboard
          isLoading={isLoadingDashboard}
          jobLocks={jobLocks}
          webhookStats={
            systemHealthStats
              ? {
                  ...systemHealthStats.webhooks,
                  byProvider: {
                    paystack: systemHealthStats.webhooks.byProvider.paystack,
                    flutterwave: 0,
                  },
                }
              : undefined
          }
          retryStats={
            systemHealthStats
              ? {
                  totalRetries: systemHealthStats.retries.totalRetries,
                  successRate: systemHealthStats.retries.successRate,
                  averageAttempts: systemHealthStats.retries.averageRetries,
                  criticalFailures: systemHealthStats.retries.maxRetriesReached,
                }
              : undefined
          }
          transferStats={
            systemHealthStats
              ? {
                  pending: systemHealthStats.transfers.pending,
                  confirmed: systemHealthStats.transfers.confirmed,
                  failed: systemHealthStats.transfers.failed,
                  reversed: systemHealthStats.transfers.reversed,
                }
              : undefined
          }
        />

        <Card className="p-6 mt-8">
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Email Worker & Queue
                </h2>
              </div>
              <p className="text-sm text-gray-600">
                Visibility into verification/welcome email delivery without
                Postman.
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                hasEmailQueueIssue
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {hasEmailQueueIssue ? "Needs Attention" : "Healthy"}
            </div>
          </div>

          {isLoadingEmailHealth ? (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Loading email worker metrics...
            </div>
          ) : emailWorkerError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {emailWorkerError.message ||
                "Failed to load email worker health data."}
            </div>
          ) : emailWorkerHealth ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs text-gray-500">Pending</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {emailWorkerHealth.queue.pending}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs text-gray-500">Processing</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {emailWorkerHealth.queue.processing}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs text-gray-500">Stuck</p>
                  <p className="text-xl font-semibold text-orange-600">
                    {emailWorkerHealth.queue.stuckProcessing}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs text-gray-500">Failed</p>
                  <p className="text-xl font-semibold text-red-600">
                    {emailWorkerHealth.queue.failed}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 p-3">
                  <p className="text-xs text-gray-500">Sent</p>
                  <p className="text-xl font-semibold text-green-600">
                    {emailWorkerHealth.queue.sent}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Worker Config
                  </p>
                  <div className="space-y-1 text-sm text-gray-700">
                    <p>
                      Enabled:{" "}
                      <span className="font-medium">
                        {emailWorkerHealth.worker.enabled ? "Yes" : "No"}
                      </span>
                    </p>
                    <p>
                      Interval:{" "}
                      <span className="font-medium">
                        {emailWorkerHealth.worker.intervalMs}ms
                      </span>
                    </p>
                    <p>
                      Batch size:{" "}
                      <span className="font-medium">
                        {emailWorkerHealth.worker.batchSize}
                      </span>
                    </p>
                    <p>
                      Max retries:{" "}
                      <span className="font-medium">
                        {emailWorkerHealth.worker.maxRetries}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Latest Sent
                  </p>
                  {emailWorkerHealth.latestSentJob ? (
                    <div className="space-y-1 text-sm text-gray-700">
                      <p className="truncate">
                        To: {emailWorkerHealth.latestSentJob.to.join(", ")}
                      </p>
                      <p>
                        Provider:{" "}
                        <span className="font-medium">
                          {emailWorkerHealth.latestSentJob.provider || "N/A"}
                        </span>
                      </p>
                      <p>
                        Sent:{" "}
                        <span className="font-medium">
                          {emailWorkerHealth.latestSentJob.sentAt
                            ? formatRelative(emailWorkerHealth.latestSentJob.sentAt)
                            : "N/A"}
                        </span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">
                      No sent emails recorded yet.
                    </p>
                  )}
                </div>
              </div>

              {emailWorkerHealth.nextPendingJobs.length > 0 && (
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">
                    Next Pending Jobs
                  </p>
                  <div className="space-y-2">
                    {emailWorkerHealth.nextPendingJobs
                      .slice(0, 3)
                      .map((job) => (
                        <div
                          key={job.id}
                          className="flex items-center justify-between text-sm text-gray-700"
                        >
                          <span className="truncate pr-3">
                            {job.to.join(", ")}
                          </span>
                          <span className="text-gray-500 whitespace-nowrap">
                            attempt {job.attempts}/{job.maxAttempts}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {emailWorkerHealth.recentFailedJobs.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <p className="text-sm font-medium text-red-900">
                      Recent Failed Jobs
                    </p>
                  </div>
                  <div className="space-y-2 text-sm text-red-800">
                    {emailWorkerHealth.recentFailedJobs.slice(0, 3).map((job) => (
                      <div key={job.id}>
                        <p className="font-medium truncate">{job.to.join(", ")}</p>
                        <p className="text-xs text-red-700">
                          {job.lastError || "Unknown delivery error"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-sm text-gray-500">
              Email worker health data is currently unavailable.
            </div>
          )}
        </Card>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">
                About System Health Monitoring
              </h3>
              <p className="text-sm text-blue-800">
                This dashboard provides real-time insights into the escrow
                system's operational health. It monitors webhook delivery rates,
                payment retry success rates, transfer confirmations, and active
                job locks. Data refreshes automatically every 10 seconds to
                ensure you have the latest information. If you notice any stuck
                job locks, you can force-release them directly from this
                interface.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
