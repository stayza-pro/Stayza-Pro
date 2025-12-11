import React from "react";
import {
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Server,
} from "lucide-react";
import { formatRelative, formatDuration } from "@/utils/timezone";

interface JobLockInfo {
  id: string;
  jobName: string;
  lockedAt: string;
  lockedBy: string;
  expiresAt: string;
  bookingIds: string[];
}

interface WebhookStats {
  totalReceived: number;
  successRate: number;
  failedCount: number;
  lastReceived?: string;
  byProvider: {
    paystack: number;
    flutterwave: number;
  };
}

interface RetryStats {
  totalRetries: number;
  successRate: number;
  averageAttempts: number;
  criticalFailures: number;
}

interface TransferStats {
  pending: number;
  confirmed: number;
  failed: number;
  reversed: number;
}

interface SystemHealthProps {
  jobLocks?: JobLockInfo[];
  webhookStats?: WebhookStats;
  retryStats?: RetryStats;
  transferStats?: TransferStats;
  isLoading?: boolean;
}

export const SystemHealthDashboard: React.FC<SystemHealthProps> = ({
  jobLocks = [],
  webhookStats,
  retryStats,
  transferStats,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const isLockExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  const getHealthScore = () => {
    let score = 100;

    // Deduct for expired locks
    const expiredLocks = jobLocks.filter((lock) =>
      isLockExpired(lock.expiresAt)
    ).length;
    score -= expiredLocks * 5;

    // Deduct for low webhook success rate
    if (webhookStats && webhookStats.successRate < 95) {
      score -= 95 - webhookStats.successRate;
    }

    // Deduct for low retry success rate
    if (retryStats && retryStats.successRate < 90) {
      score -= 90 - retryStats.successRate;
    }

    // Deduct for critical failures
    if (retryStats && retryStats.criticalFailures > 0) {
      score -= retryStats.criticalFailures * 10;
    }

    return Math.max(0, Math.min(100, score));
  };

  const healthScore = getHealthScore();
  const healthColor =
    healthScore >= 90 ? "green" : healthScore >= 70 ? "yellow" : "red";

  return (
    <div className="space-y-6">
      {/* Health Score Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              System Health
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Real-time monitoring of distributed systems
            </p>
          </div>

          <div className="text-center">
            <div className={`text-4xl font-bold text-${healthColor}-600`}>
              {healthScore}%
            </div>
            <p className="text-xs text-gray-500 mt-1">Health Score</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Webhook Stats */}
        {webhookStats && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Webhooks</h3>
              <Activity className="h-5 w-5 text-blue-500" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold">
                  {webhookStats.totalReceived}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Success:</span>
                <span className="font-semibold text-green-600">
                  {webhookStats.successRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Failed:</span>
                <span className="font-semibold text-red-600">
                  {webhookStats.failedCount}
                </span>
              </div>
              {webhookStats.lastReceived && (
                <div className="text-xs text-gray-500 mt-2">
                  Last: {formatRelative(webhookStats.lastReceived)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Retry Stats */}
        {retryStats && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Retries</h3>
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total:</span>
                <span className="font-semibold">{retryStats.totalRetries}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Success:</span>
                <span className="font-semibold text-green-600">
                  {retryStats.successRate.toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Avg Attempts:</span>
                <span className="font-semibold">
                  {retryStats.averageAttempts.toFixed(1)}
                </span>
              </div>
              {retryStats.criticalFailures > 0 && (
                <div className="mt-2 p-2 bg-red-50 rounded text-xs text-red-600 font-medium">
                  ⚠️ {retryStats.criticalFailures} critical failures
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transfer Stats */}
        {transferStats && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">Transfers</h3>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Confirmed:</span>
                <span className="font-semibold text-green-600">
                  {transferStats.confirmed}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Pending:</span>
                <span className="font-semibold text-yellow-600">
                  {transferStats.pending}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Failed:</span>
                <span className="font-semibold text-red-600">
                  {transferStats.failed}
                </span>
              </div>
              {transferStats.reversed > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Reversed:</span>
                  <span className="font-semibold text-orange-600">
                    {transferStats.reversed}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Active Locks */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">Job Locks</h3>
            <Server className="h-5 w-5 text-purple-500" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Active:</span>
              <span className="font-semibold">{jobLocks.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Expired:</span>
              <span className="font-semibold text-red-600">
                {
                  jobLocks.filter((lock) => isLockExpired(lock.expiresAt))
                    .length
                }
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Healthy:</span>
              <span className="font-semibold text-green-600">
                {
                  jobLocks.filter((lock) => !isLockExpired(lock.expiresAt))
                    .length
                }
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Job Locks Table */}
      {jobLocks.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900">
              Active Job Locks
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Job Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Instance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Locked At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expires At
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bookings
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {jobLocks.map((lock) => {
                  const expired = isLockExpired(lock.expiresAt);

                  return (
                    <tr key={lock.id} className={expired ? "bg-red-50" : ""}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {lock.jobName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {lock.lockedBy}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatRelative(lock.lockedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {expired ? (
                          <span className="text-red-600 font-medium">
                            Expired
                          </span>
                        ) : (
                          formatRelative(lock.expiresAt)
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {lock.bookingIds.length} booking
                        {lock.bookingIds.length !== 1 ? "s" : ""}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {expired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <XCircle className="h-3 w-3" />
                            Expired
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Critical Alerts */}
      {retryStats && retryStats.criticalFailures > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-red-900">
                Critical Transfer Failures Detected
              </h4>
              <p className="text-sm text-red-700 mt-1">
                {retryStats.criticalFailures} critical transfer
                {retryStats.criticalFailures !== 1 ? "s have" : " has"} failed
                after all retry attempts. Immediate attention required.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
