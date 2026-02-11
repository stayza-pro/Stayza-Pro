"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, FileText, Image, Loader2, Play, X } from "lucide-react";
import { apiClient } from "@/services/api";
import { logError } from "@/utils/errorLogger";

interface DisputeResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  disputeId: string;
  onStatusUpdate?: (disputeId: string, status: string) => void;
}

interface DisputeDetails {
  id: string;
  bookingId: string;
  status: string;
  disputeSubject: string;
  category: string;
  writeup: string;
  claimedAmount: number;
  openedAt: string;
  openedBy?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  attachments: string[];
}

type AdminDecision = "FULL_REFUND" | "PARTIAL_REFUND" | "NO_REFUND";

const toArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value : []);

const toCurrency = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

const getAttachmentType = (url: string): "image" | "video" | "document" => {
  const normalized = url.toLowerCase();
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg") || normalized.endsWith(".png")) {
    return "image";
  }
  if (normalized.endsWith(".mp4") || normalized.endsWith(".mov") || normalized.endsWith(".webm")) {
    return "video";
  }
  return "document";
};

export default function DisputeResolutionModal({
  isOpen,
  onClose,
  disputeId,
  onStatusUpdate,
}: DisputeResolutionModalProps) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dispute, setDispute] = useState<DisputeDetails | null>(null);
  const [decision, setDecision] = useState<AdminDecision>("NO_REFUND");
  const [resolutionNotes, setResolutionNotes] = useState("");

  useEffect(() => {
    if (!isOpen || !disputeId) return;

    const loadDispute = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await apiClient.get<{ dispute?: Record<string, any> }>(
          `/admin/disputes/${disputeId}`
        );

        const raw =
          (response as any)?.dispute ||
          (response as any)?.data?.dispute ||
          (response as any)?.data?.data?.dispute;

        if (!raw) {
          throw new Error("Dispute data unavailable.");
        }

        setDispute({
          id: raw.id,
          bookingId: raw.bookingId,
          status: raw.status || "OPEN",
          disputeSubject: raw.disputeSubject || "DISPUTE",
          category: raw.category || "UNSPECIFIED",
          writeup: raw.writeup || "No writeup provided.",
          claimedAmount: Number(raw.claimedAmount || 0),
          openedAt: raw.openedAt || raw.createdAt,
          openedBy: raw.opener,
          attachments: toArray<string>(raw.attachments),
        });
      } catch (loadError) {
        logError(loadError, {
          component: "DisputeResolutionModal",
          action: "load_dispute",
          metadata: { disputeId },
        });
        setError("Failed to load dispute details.");
      } finally {
        setLoading(false);
      }
    };

    loadDispute();
  }, [isOpen, disputeId]);

  const canResolve = useMemo(
    () => Boolean(decision) && resolutionNotes.trim().length >= 10,
    [decision, resolutionNotes]
  );

  const applyTemplate = (preset: AdminDecision) => {
    setDecision(preset);

    if (preset === "FULL_REFUND") {
      setResolutionNotes("Full refund approved after review of dispute evidence.");
      return;
    }
    if (preset === "PARTIAL_REFUND") {
      setResolutionNotes("Partial refund approved based on submitted evidence.");
      return;
    }
    setResolutionNotes("No refund approved after review of dispute evidence.");
  };

  const resolveDispute = async () => {
    if (!canResolve) return;

    setSubmitting(true);
    try {
      await apiClient.post(`/admin/disputes/${disputeId}/resolve`, {
        decision,
        adminNotes: resolutionNotes.trim(),
      });

      onStatusUpdate?.(disputeId, "resolved");
      onClose();
    } catch (resolveError) {
      logError(resolveError, {
        component: "DisputeResolutionModal",
        action: "resolve_dispute",
        metadata: { disputeId, decision },
      });
      setError("Failed to resolve dispute. Ensure the dispute is escalated first.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Dispute Resolution</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-600" />
            <p className="text-gray-600 mt-2">Loading dispute details...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertTriangle className="h-8 w-8 mx-auto text-red-500 mb-2" />
            <p className="text-red-600">{error}</p>
          </div>
        ) : dispute ? (
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-88px)]">
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">{dispute.disputeSubject}</h3>
              <p className="text-sm text-gray-600 mt-1">{dispute.writeup}</p>
              <div className="mt-3 text-xs text-gray-500 flex flex-wrap gap-3">
                <span>Status: {dispute.status}</span>
                <span>Category: {dispute.category}</span>
                <span>Claimed: {toCurrency(dispute.claimedAmount)}</span>
                <span>Opened: {new Date(dispute.openedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-3">
                Evidence ({dispute.attachments.length})
              </h4>
              {dispute.attachments.length === 0 ? (
                <p className="text-sm text-gray-500">No attachments provided.</p>
              ) : (
                <div className="space-y-2">
                  {dispute.attachments.map((attachment, index) => {
                    const type = getAttachmentType(attachment);

                    return (
                      <div
                        key={`${attachment}-${index}`}
                        className="flex items-center gap-3 p-3 bg-white border rounded"
                      >
                        <div className="text-blue-500">
                          {type === "image" && <Image size={16} />}
                          {type === "document" && <FileText size={16} />}
                          {type === "video" && <Play size={16} />}
                        </div>
                        <span className="text-sm flex-1 truncate">{attachment}</span>
                        <a
                          href={attachment}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs px-2 py-1 border rounded text-blue-600 border-blue-200"
                        >
                          View
                        </a>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">Admin Resolution</h4>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={() => applyTemplate("FULL_REFUND")}
                  className="px-3 py-2 text-xs bg-red-50 text-red-700 border border-red-200 rounded"
                >
                  Full Refund
                </button>
                <button
                  onClick={() => applyTemplate("PARTIAL_REFUND")}
                  className="px-3 py-2 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded"
                >
                  Partial Refund
                </button>
                <button
                  onClick={() => applyTemplate("NO_REFUND")}
                  className="px-3 py-2 text-xs bg-green-50 text-green-700 border border-green-200 rounded"
                >
                  No Refund
                </button>
              </div>

              <div className="space-y-3">
                <select
                  value={decision}
                  onChange={(event) => setDecision(event.target.value as AdminDecision)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                >
                  <option value="FULL_REFUND">FULL_REFUND</option>
                  <option value="PARTIAL_REFUND">PARTIAL_REFUND</option>
                  <option value="NO_REFUND">NO_REFUND</option>
                </select>
                <textarea
                  value={resolutionNotes}
                  onChange={(event) => setResolutionNotes(event.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="Document your decision and reasoning (minimum 10 characters)..."
                />
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={resolveDispute}
                  disabled={!canResolve || submitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded text-sm disabled:bg-gray-300"
                >
                  {submitting ? "Resolving..." : "Resolve Dispute"}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
