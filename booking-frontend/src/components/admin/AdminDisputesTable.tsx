"use client";

import React from "react";
import { AlertTriangle, Eye, Loader2, Scale } from "lucide-react";
import { Card, Button } from "@/components/ui";
import {
  AdminDisputeDecision,
  AdminDisputeSummary,
  adminDisputesService,
} from "@/services/adminDisputesService";

type StatusFilter = "ALL" | "AWAITING_RESPONSE" | "ESCALATED" | "RESOLVED";

const statusStyles: Record<string, string> = {
  ESCALATED: "bg-red-100 text-red-700",
  AWAITING_RESPONSE: "bg-yellow-100 text-yellow-700",
  RESOLVED: "bg-green-100 text-green-700",
  OPEN: "bg-blue-100 text-blue-700",
};

export default function AdminDisputesTable() {
  const [disputes, setDisputes] = React.useState<AdminDisputeSummary[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [statusFilter, setStatusFilter] = React.useState<StatusFilter>("ALL");
  const [search, setSearch] = React.useState("");
  const [selectedDispute, setSelectedDispute] =
    React.useState<AdminDisputeSummary | null>(null);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const [decision, setDecision] = React.useState<AdminDisputeDecision>("NO_REFUND");
  const [adminNotes, setAdminNotes] = React.useState("");
  const [resolving, setResolving] = React.useState(false);

  const loadDisputes = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminDisputesService.getDisputes();
      setDisputes(data);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load disputes.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadDisputes();
  }, [loadDisputes]);

  const filteredDisputes = React.useMemo(() => {
    return disputes.filter((dispute) => {
      if (statusFilter !== "ALL" && dispute.status !== statusFilter) {
        return false;
      }
      if (!search.trim()) {
        return true;
      }
      const needle = search.trim().toLowerCase();
      const haystack = [
        dispute.id,
        dispute.bookingId,
        dispute.category,
        dispute.disputeSubject,
        dispute.booking?.property?.title,
        dispute.opener?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [disputes, search, statusFilter]);

  const openDisputeDetail = async (disputeId: string) => {
    try {
      setLoadingDetail(true);
      const detail = await adminDisputesService.getDisputeById(disputeId);
      setSelectedDispute(detail);
      setDecision("NO_REFUND");
      setAdminNotes("");
    } catch (detailError) {
      setError(
        detailError instanceof Error
          ? detailError.message
          : "Failed to load dispute detail.",
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  const closeModal = () => {
    if (resolving) return;
    setSelectedDispute(null);
    setAdminNotes("");
    setDecision("NO_REFUND");
  };

  const resolveDispute = async () => {
    if (!selectedDispute) return;
    if (!adminNotes.trim()) {
      setError("Admin notes are required to resolve a dispute.");
      return;
    }
    try {
      setResolving(true);
      setError(null);
      await adminDisputesService.resolveDispute(
        selectedDispute.id,
        decision,
        adminNotes.trim(),
      );
      await loadDisputes();
      closeModal();
    } catch (resolveError) {
      setError(
        resolveError instanceof Error
          ? resolveError.message
          : "Failed to resolve dispute.",
      );
    } finally {
      setResolving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="ALL">All statuses</option>
              <option value="ESCALATED">Escalated</option>
              <option value="AWAITING_RESPONSE">Awaiting Response</option>
              <option value="RESOLVED">Resolved</option>
            </select>
            <input
              type="text"
              placeholder="Search disputes..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="min-w-[260px] rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <Button size="sm" variant="outline" onClick={() => void loadDisputes()}>
            Refresh Queue
          </Button>
        </div>
      </Card>

      {error ? (
        <Card className="border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </Card>
      ) : null}

      <Card className="overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Disputes Queue</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center px-6 py-12 text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading disputes...
          </div>
        ) : filteredDisputes.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            No disputes found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Dispute
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Booking
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Opened
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredDisputes.map((dispute) => (
                  <tr key={dispute.id}>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-gray-900">{dispute.id.slice(0, 12)}...</p>
                      <p className="text-xs text-gray-500">
                        {dispute.booking?.property?.title || "Property unavailable"}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {dispute.disputeSubject}
                      <p className="text-xs text-gray-500">{dispute.category}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {dispute.bookingId.slice(0, 10)}...
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {new Date(dispute.openedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                          statusStyles[dispute.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {dispute.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void openDisputeDetail(dispute.id)}
                        loading={loadingDetail && selectedDispute?.id === dispute.id}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-5 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Dispute Detail</h3>
                <p className="text-sm text-gray-500">{selectedDispute.id}</p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg px-3 py-1 text-sm text-gray-500 hover:bg-gray-100"
              >
                Close
              </button>
            </div>

            <div className="grid gap-4 rounded-lg border border-gray-200 p-4 text-sm text-gray-700 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase text-gray-500">Status</p>
                <p className="font-semibold">{selectedDispute.status}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Subject</p>
                <p className="font-semibold">{selectedDispute.disputeSubject}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Category</p>
                <p className="font-semibold">{selectedDispute.category}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-gray-500">Opened</p>
                <p className="font-semibold">
                  {new Date(selectedDispute.openedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {selectedDispute.writeup ? (
              <div className="mt-4 rounded-lg border border-gray-200 p-4 text-sm text-gray-700">
                <p className="mb-1 text-xs uppercase text-gray-500">Guest/Realtor Writeup</p>
                <p>{selectedDispute.writeup}</p>
              </div>
            ) : null}

            <div className="mt-6 rounded-lg border border-gray-200 p-4">
              <div className="mb-3 flex items-center gap-2">
                <Scale className="h-4 w-4 text-gray-600" />
                <p className="text-sm font-semibold text-gray-900">
                  Resolve Dispute
                </p>
              </div>
              {selectedDispute.status !== "ESCALATED" ? (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-700">
                  <AlertTriangle className="mr-2 inline h-4 w-4" />
                  Only escalated disputes can be resolved by admin.
                </div>
              ) : (
                <div className="space-y-3">
                  <select
                    value={decision}
                    onChange={(event) =>
                      setDecision(event.target.value as AdminDisputeDecision)
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="NO_REFUND">No Refund</option>
                    <option value="PARTIAL_REFUND">Partial Refund</option>
                    <option value="FULL_REFUND">Full Refund</option>
                  </select>
                  <textarea
                    value={adminNotes}
                    onChange={(event) => setAdminNotes(event.target.value)}
                    rows={4}
                    placeholder="Provide clear admin notes for this resolution..."
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <Button loading={resolving} onClick={resolveDispute} size="sm">
                    Resolve Dispute
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
