"use client";

import React, { useState, useEffect } from "react";
import { X, Image, FileText, Play } from "lucide-react";

interface Evidence {
  id: string;
  type: "image" | "document" | "video";
  title: string;
  description: string;
  url: string;
  uploadedBy: "guest" | "host" | "admin";
  uploadedAt: string;
}

interface Dispute {
  id: string;
  bookingId: string;
  title: string;
  description: string;
  type:
    | "property_condition"
    | "misrepresentation"
    | "cancellation"
    | "refund_request"
    | "security_deposit";
  status: "open" | "in_review" | "resolved" | "closed";
  reportedBy: "guest" | "host";
  reporterName: string;
  createdAt: string;
  dueDate: string | null;
  evidence: Evidence[];
}

interface DisputeResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  disputeId: string;
  onStatusUpdate?: (disputeId: string, status: string) => void;
}

export default function DisputeResolutionModal({
  isOpen,
  onClose,
  disputeId,
  onStatusUpdate,
}: DisputeResolutionModalProps) {
  const [loading, setLoading] = useState(true);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [refundAmount, setRefundAmount] = useState(0);
  const [blacklistRealtor, setBlacklistRealtor] = useState(false);

  // Mock dispute data for demonstration
  useEffect(() => {
    if (isOpen && disputeId) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const mockDispute: Dispute = {
          id: disputeId,
          bookingId: "booking_456",
          title: "Property not as described",
          description:
            "The property had significant issues not mentioned in the listing, including broken amenities and poor cleanliness.",
          type: "property_condition",
          status: "open",
          reportedBy: "guest",
          reporterName: "John Doe",
          createdAt: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
          dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
          evidence: [
            {
              id: "ev1",
              type: "image",
              title: "Broken bathroom fixtures",
              description: "Photos showing damaged sink and toilet",
              url: "/images/evidence1.jpg",
              uploadedBy: "guest",
              uploadedAt: new Date(
                Date.now() - 2 * 24 * 60 * 60 * 1000
              ).toISOString(),
            },
            {
              id: "ev2",
              type: "image",
              title: "Dirty kitchen area",
              description: "Kitchen was not cleaned before arrival",
              url: "/images/evidence2.jpg",
              uploadedBy: "guest",
              uploadedAt: new Date(
                Date.now() - 2 * 24 * 60 * 60 * 1000
              ).toISOString(),
            },
            {
              id: "ev3",
              type: "document",
              title: "Original listing screenshots",
              description: "Screenshots of how property was advertised",
              url: "/documents/listing.pdf",
              uploadedBy: "guest",
              uploadedAt: new Date(
                Date.now() - 1 * 24 * 60 * 60 * 1000
              ).toISOString(),
            },
          ],
        };
        setDispute(mockDispute);
        setLoading(false);
      }, 1000);
    }
  }, [isOpen, disputeId]);

  const handleResolveDispute = () => {
    console.log("Resolving dispute:", {
      disputeId,
      resolutionNotes,
      refundAmount,
      blacklistRealtor,
    });

    if (onStatusUpdate) {
      onStatusUpdate(disputeId, "resolved");
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Dispute Resolution
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading dispute details...</p>
          </div>
        ) : dispute ? (
          <div className="p-6">
            {/* Simplified Core Dispute Info */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                {dispute.title}
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                {dispute.description}
              </p>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>
                  Type:{" "}
                  <strong className="text-gray-900 capitalize">
                    {dispute.type.replace("_", " ")}
                  </strong>
                </span>
                <span>
                  Reported by:{" "}
                  <strong className="text-gray-900">
                    {dispute.reporterName}
                  </strong>
                </span>
                <span>
                  Date:{" "}
                  <strong className="text-gray-900">
                    {new Date(dispute.createdAt).toLocaleDateString()}
                  </strong>
                </span>
              </div>
            </div>

            {/* Core Evidence (max 3 items) */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">
                Evidence ({dispute.evidence.length})
              </h4>
              <div className="space-y-2">
                {dispute.evidence.slice(0, 3).map((evidence) => (
                  <div
                    key={evidence.id}
                    className="flex items-center gap-3 p-2 bg-white border rounded"
                  >
                    <div className="text-blue-500">
                      {evidence.type === "image" && <Image size={16} />}
                      {evidence.type === "document" && <FileText size={16} />}
                      {evidence.type === "video" && <Play size={16} />}
                    </div>
                    <span className="text-sm font-medium flex-1">
                      {evidence.title}
                    </span>
                    <button className="text-blue-600 text-xs px-2 py-1 border rounded">
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Admin Resolution Form */}
            <div className="bg-white border rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-4">
                Admin Resolution
              </h4>

              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={() => {
                    setResolutionNotes(
                      "Full refund approved due to property misrepresentation"
                    );
                    setRefundAmount(150000);
                  }}
                  className="px-3 py-2 text-xs bg-red-50 text-red-700 border border-red-200 rounded"
                >
                  Full Refund
                </button>
                <button
                  onClick={() => {
                    setResolutionNotes(
                      "Partial refund (50%) - minor property issues"
                    );
                    setRefundAmount(75000);
                  }}
                  className="px-3 py-2 text-xs bg-yellow-50 text-yellow-700 border border-yellow-200 rounded"
                >
                  50% Refund
                </button>
                <button
                  onClick={() => {
                    setResolutionNotes(
                      "No refund - dispute not valid, property as advertised"
                    );
                    setRefundAmount(0);
                  }}
                  className="px-3 py-2 text-xs bg-green-50 text-green-700 border border-green-200 rounded"
                >
                  No Refund
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resolution Notes
                  </label>
                  <textarea
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                    placeholder="Document your decision and reasoning..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Refund Amount (₦)
                    </label>
                    <input
                      type="number"
                      value={refundAmount}
                      onChange={(e) =>
                        setRefundAmount(parseInt(e.target.value) || 0)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                      placeholder="0"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={blacklistRealtor}
                        onChange={(e) => setBlacklistRealtor(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <span className="text-sm text-gray-700">
                        Blacklist Realtor
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleResolveDispute}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded text-sm"
                >
                  Resolve Dispute
                </button>
                <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm">
                  Escalate to Manager
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-red-600">Failed to load dispute details</p>
          </div>
        )}
      </div>
    </div>
  );
}
