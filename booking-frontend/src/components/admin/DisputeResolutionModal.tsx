"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  MessageSquare,
  Upload,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  Download,
} from "lucide-react";

interface DisputeEvidence {
  id: string;
  type: "image" | "document" | "message";
  title: string;
  description?: string;
  url: string;
  uploadedBy: "guest" | "host" | "admin";
  uploadedAt: string;
}

interface DisputeMessage {
  id: string;
  sender: "guest" | "host" | "admin";
  senderName: string;
  message: string;
  timestamp: string;
  isResolution?: boolean;
}

interface DisputeDetails {
  id: string;
  bookingId: string;
  bookingReference: string;
  type:
    | "cancellation"
    | "refund"
    | "property_issue"
    | "guest_behavior"
    | "host_behavior"
    | "payment"
    | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status:
    | "open"
    | "in_review"
    | "pending_evidence"
    | "escalated"
    | "resolved"
    | "closed";
  title: string;
  description: string;
  reportedBy: "guest" | "host";
  reporterName: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
  assignedAdmin?: string;
  evidence: DisputeEvidence[];
  messages: DisputeMessage[];
  resolution?: {
    decision: string;
    reasoning: string;
    compensation?: {
      toGuest: number;
      toHost: number;
    };
    resolvedBy: string;
    resolvedAt: string;
  };
}

interface DisputeResolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  disputeId: string;
  onResolveDispute: (disputeId: string, resolution: any) => void;
}

const DisputeResolutionModal: React.FC<DisputeResolutionModalProps> = ({
  isOpen,
  onClose,
  disputeId,
  onResolveDispute,
}) => {
  const [dispute, setDispute] = useState<DisputeDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "evidence" | "communication" | "resolution"
  >("overview");
  const [showResolutionForm, setShowResolutionForm] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [resolutionDecision, setResolutionDecision] = useState("");
  const [resolutionReasoning, setResolutionReasoning] = useState("");
  const [compensationToGuest, setCompensationToGuest] = useState(0);
  const [compensationToHost, setCompensationToHost] = useState(0);
  const [newStatus, setNewStatus] = useState("");
  const [requestingEvidence, setRequestingEvidence] = useState(false);
  const [evidenceRequest, setEvidenceRequest] = useState("");

  useEffect(() => {
    if (isOpen && disputeId) {
      loadDisputeDetails();
    }
  }, [isOpen, disputeId]);

  const loadDisputeDetails = async () => {
    setLoading(true);
    try {
      // Mock data for demonstration
      const mockDispute: DisputeDetails = {
        id: disputeId,
        bookingId: "booking-123",
        bookingReference: "BK123456789",
        type: "property_issue",
        priority: "high",
        status: "in_review",
        title: "Property not matching description",
        description:
          "The property did not match the photos and description on the listing. The apartment was dirty, had broken amenities, and was in a different location than advertised.",
        reportedBy: "guest",
        reporterName: "John Doe",
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        assignedAdmin: "Admin Support Team",
        evidence: [
          {
            id: "ev1",
            type: "image",
            title: "Dirty bathroom photo",
            description: "Shows unclean bathroom conditions",
            url: "/images/evidence1.jpg",
            uploadedBy: "guest",
            uploadedAt: new Date(
              Date.now() - 2 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "ev2",
            type: "image",
            title: "Broken kitchen appliances",
            description: "Non-functional refrigerator and stove",
            url: "/images/evidence2.jpg",
            uploadedBy: "guest",
            uploadedAt: new Date(
              Date.now() - 2 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "ev3",
            type: "document",
            title: "Property listing comparison",
            description: "Screenshots of original listing vs reality",
            url: "/documents/comparison.pdf",
            uploadedBy: "guest",
            uploadedAt: new Date(
              Date.now() - 1 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        ],
        messages: [
          {
            id: "msg1",
            sender: "guest",
            senderName: "John Doe",
            message:
              "I am extremely disappointed with this booking. The property was nothing like advertised and I had to find alternative accommodation.",
            timestamp: new Date(
              Date.now() - 2 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "msg2",
            sender: "host",
            senderName: "Sarah Johnson",
            message:
              "I apologize for the inconvenience. Our cleaning service failed to properly prepare the property. I am willing to provide a partial refund.",
            timestamp: new Date(
              Date.now() - 1 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
          {
            id: "msg3",
            sender: "admin",
            senderName: "Support Team",
            message:
              "Thank you both for your patience. I am reviewing the evidence and will provide a resolution within 24 hours.",
            timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          },
        ],
      };

      setDispute(mockDispute);
      setNewStatus(mockDispute.status);
    } catch (error) {
      console.error("Failed to load dispute details:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const message: DisputeMessage = {
      id: Date.now().toString(),
      sender: "admin",
      senderName: "Admin Support",
      message: newMessage,
      timestamp: new Date().toISOString(),
    };

    if (dispute) {
      setDispute({
        ...dispute,
        messages: [...dispute.messages, message],
      });
    }
    setNewMessage("");
  };

  const handleRequestEvidence = async () => {
    if (!evidenceRequest.trim()) return;

    const message: DisputeMessage = {
      id: Date.now().toString(),
      sender: "admin",
      senderName: "Admin Support",
      message: `Evidence requested: ${evidenceRequest}`,
      timestamp: new Date().toISOString(),
    };

    if (dispute) {
      setDispute({
        ...dispute,
        status: "pending_evidence",
        messages: [...dispute.messages, message],
      });
    }
    setRequestingEvidence(false);
    setEvidenceRequest("");
  };

  const handleResolveDispute = async () => {
    if (!resolutionDecision || !resolutionReasoning) return;

    const resolution = {
      decision: resolutionDecision,
      reasoning: resolutionReasoning,
      compensation:
        compensationToGuest > 0 || compensationToHost > 0
          ? {
              toGuest: compensationToGuest,
              toHost: compensationToHost,
            }
          : undefined,
      resolvedBy: "Admin Support",
      resolvedAt: new Date().toISOString(),
    };

    onResolveDispute(disputeId, resolution);
    setShowResolutionForm(false);
    onClose();
  };

  const handleUpdateStatus = async () => {
    if (dispute && newStatus !== dispute.status) {
      setDispute({
        ...dispute,
        status: newStatus as any,
        updatedAt: new Date().toISOString(),
      });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in_review":
        return "bg-yellow-100 text-yellow-800";
      case "pending_evidence":
        return "bg-orange-100 text-orange-800";
      case "escalated":
        return "bg-red-100 text-red-800";
      case "resolved":
        return "bg-green-100 text-green-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Dispute Resolution
            </h2>
            {dispute && (
              <div className="flex items-center gap-4 mt-2">
                <span className="text-gray-600">
                  Booking: {dispute.bookingReference}
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(
                    dispute.priority
                  )}`}
                >
                  {dispute.priority} priority
                </span>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    dispute.status
                  )}`}
                >
                  {dispute.status.replace("_", " ")}
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading dispute details...</p>
          </div>
        ) : dispute ? (
          <div className="flex flex-col h-[calc(90vh-120px)]">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-6 py-3 font-medium text-sm transition-colors ${
                  activeTab === "overview"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("evidence")}
                className={`px-6 py-3 font-medium text-sm transition-colors ${
                  activeTab === "evidence"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Evidence ({dispute.evidence.length})
              </button>
              <button
                onClick={() => setActiveTab("communication")}
                className={`px-6 py-3 font-medium text-sm transition-colors ${
                  activeTab === "communication"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Communication ({dispute.messages.length})
              </button>
              <button
                onClick={() => setActiveTab("resolution")}
                className={`px-6 py-3 font-medium text-sm transition-colors ${
                  activeTab === "resolution"
                    ? "border-b-2 border-blue-600 text-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Resolution
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    {/* Dispute Details */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Dispute Details
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {dispute.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {dispute.description}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Type:</span>
                            <span className="ml-2 font-medium capitalize">
                              {dispute.type.replace("_", " ")}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Reported by:</span>
                            <span className="ml-2 font-medium">
                              {dispute.reporterName} ({dispute.reportedBy})
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Created:</span>
                            <span className="ml-2 font-medium">
                              {new Date(dispute.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Due date:</span>
                            <span className="ml-2 font-medium">
                              {dispute.dueDate
                                ? new Date(dispute.dueDate).toLocaleDateString()
                                : "Not set"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Status Management */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Status Management
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Current Status
                          </label>
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="open">Open</option>
                            <option value="in_review">In Review</option>
                            <option value="pending_evidence">
                              Pending Evidence
                            </option>
                            <option value="escalated">Escalated</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                        {newStatus !== dispute.status && (
                          <button
                            onClick={handleUpdateStatus}
                            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Update Status
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    {/* Quick Actions */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Quick Actions
                      </h3>
                      <div className="space-y-2">
                        <button
                          onClick={() => setRequestingEvidence(true)}
                          className="w-full flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                        >
                          <Upload className="h-4 w-4" />
                          Request Evidence
                        </button>
                        <button
                          onClick={() => setShowResolutionForm(true)}
                          className="w-full flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Resolve Dispute
                        </button>
                        <button className="w-full flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                          <AlertTriangle className="h-4 w-4" />
                          Escalate to Manager
                        </button>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Recent Activity
                      </h3>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Clock className="h-4 w-4 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Dispute created
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(dispute.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <MessageSquare className="h-4 w-4 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Last message
                            </p>
                            <p className="text-xs text-gray-500">
                              {dispute.messages.length > 0
                                ? new Date(
                                    dispute.messages[
                                      dispute.messages.length - 1
                                    ].timestamp
                                  ).toLocaleString()
                                : "No messages yet"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Upload className="h-4 w-4 text-gray-400 mt-1" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              Evidence submitted
                            </p>
                            <p className="text-xs text-gray-500">
                              {dispute.evidence.length} items
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "evidence" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Evidence ({dispute.evidence.length})
                    </h3>
                    <button
                      onClick={() => setRequestingEvidence(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Upload className="h-4 w-4" />
                      Request More Evidence
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dispute.evidence.map((evidence) => (
                      <div
                        key={evidence.id}
                        className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {evidence.type === "image" && (
                              <Eye className="h-4 w-4 text-blue-500" />
                            )}
                            {evidence.type === "document" && (
                              <Download className="h-4 w-4 text-green-500" />
                            )}
                            {evidence.type === "message" && (
                              <MessageSquare className="h-4 w-4 text-gray-500" />
                            )}
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                evidence.uploadedBy === "guest"
                                  ? "bg-blue-100 text-blue-800"
                                  : evidence.uploadedBy === "host"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-purple-100 text-purple-800"
                              }`}
                            >
                              {evidence.uploadedBy}
                            </span>
                          </div>
                        </div>
                        <h4 className="font-medium text-gray-900 text-sm mb-1">
                          {evidence.title}
                        </h4>
                        {evidence.description && (
                          <p className="text-xs text-gray-600 mb-2">
                            {evidence.description}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mb-3">
                          {new Date(evidence.uploadedAt).toLocaleString()}
                        </p>
                        <button className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">
                          {evidence.type === "image" ? (
                            <Eye className="h-4 w-4" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                          {evidence.type === "image" ? "View" : "Download"}
                        </button>
                      </div>
                    ))}
                  </div>

                  {dispute.evidence.length === 0 && (
                    <div className="text-center py-8">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="font-medium text-gray-900 mb-1">
                        No Evidence Submitted
                      </h3>
                      <p className="text-gray-500">
                        No evidence has been provided for this dispute yet.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "communication" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Communication ({dispute.messages.length})
                    </h3>
                  </div>

                  {/* Messages */}
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {dispute.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.sender === "admin"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.sender === "admin"
                              ? "bg-blue-600 text-white"
                              : message.sender === "guest"
                              ? "bg-gray-100 text-gray-900"
                              : "bg-green-100 text-green-900"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-3 w-3" />
                            <span className="text-xs font-medium">
                              {message.senderName}
                            </span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                          <p
                            className={`text-xs mt-1 ${
                              message.sender === "admin"
                                ? "text-blue-100"
                                : "text-gray-500"
                            }`}
                          >
                            {new Date(message.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Message Input */}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex gap-3">
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        rows={3}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        <MessageSquare className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "resolution" && (
                <div className="space-y-6">
                  {dispute.resolution ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                        <h3 className="text-lg font-semibold text-green-900">
                          Dispute Resolved
                        </h3>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-medium text-green-900">
                            Decision:
                          </h4>
                          <p className="text-green-800">
                            {dispute.resolution.decision}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-medium text-green-900">
                            Reasoning:
                          </h4>
                          <p className="text-green-800">
                            {dispute.resolution.reasoning}
                          </p>
                        </div>
                        {dispute.resolution.compensation && (
                          <div>
                            <h4 className="font-medium text-green-900">
                              Compensation:
                            </h4>
                            <div className="text-green-800">
                              {dispute.resolution.compensation.toGuest > 0 && (
                                <p>
                                  To Guest: ₦
                                  {dispute.resolution.compensation.toGuest.toLocaleString()}
                                </p>
                              )}
                              {dispute.resolution.compensation.toHost > 0 && (
                                <p>
                                  To Host: ₦
                                  {dispute.resolution.compensation.toHost.toLocaleString()}
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                        <div className="text-sm text-green-700">
                          Resolved by {dispute.resolution.resolvedBy} on{" "}
                          {new Date(
                            dispute.resolution.resolvedAt
                          ).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">
                          Resolution Center
                        </h3>
                        <button
                          onClick={() => setShowResolutionForm(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="h-4 w-4" />
                          Create Resolution
                        </button>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-yellow-900">
                              Resolution Guidelines
                            </h4>
                            <ul className="text-sm text-yellow-800 mt-2 space-y-1">
                              <li>
                                • Review all evidence and communication before
                                making a decision
                              </li>
                              <li>
                                • Consider platform policies and terms of
                                service
                              </li>
                              <li>
                                • Aim for fair outcomes that protect both
                                parties
                              </li>
                              <li>
                                • Document reasoning clearly for future
                                reference
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Common Resolutions
                          </h4>
                          <div className="space-y-2">
                            <button
                              onClick={() => {
                                setResolutionDecision("Full refund to guest");
                                setCompensationToGuest(150000);
                                setShowResolutionForm(true);
                              }}
                              className="w-full text-left px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Full refund to guest
                            </button>
                            <button
                              onClick={() => {
                                setResolutionDecision(
                                  "Partial refund to guest"
                                );
                                setCompensationToGuest(75000);
                                setShowResolutionForm(true);
                              }}
                              className="w-full text-left px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              Partial refund (50%)
                            </button>
                            <button
                              onClick={() => {
                                setResolutionDecision(
                                  "No refund - dispute not valid"
                                );
                                setShowResolutionForm(true);
                              }}
                              className="w-full text-left px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              No refund required
                            </button>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="font-medium text-gray-900 mb-2">
                            Escalation Options
                          </h4>
                          <div className="space-y-2">
                            <button className="w-full text-left px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              Escalate to senior admin
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              Request legal review
                            </button>
                            <button className="w-full text-left px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                              Mark for manager review
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-red-600">Failed to load dispute details</p>
          </div>
        )}

        {/* Evidence Request Modal */}
        {requestingEvidence && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Request Additional Evidence
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Evidence Request
                  </label>
                  <textarea
                    value={evidenceRequest}
                    onChange={(e) => setEvidenceRequest(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Please describe what additional evidence you need..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setRequestingEvidence(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRequestEvidence}
                    disabled={!evidenceRequest.trim()}
                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Send Request
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resolution Form Modal */}
        {showResolutionForm && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Create Resolution
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Decision
                  </label>
                  <textarea
                    value={resolutionDecision}
                    onChange={(e) => setResolutionDecision(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={2}
                    placeholder="Brief summary of your decision..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Detailed Reasoning
                  </label>
                  <textarea
                    value={resolutionReasoning}
                    onChange={(e) => setResolutionReasoning(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Explain your reasoning, reference evidence, and cite relevant policies..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Compensation to Guest (₦)
                    </label>
                    <input
                      type="number"
                      value={compensationToGuest}
                      onChange={(e) =>
                        setCompensationToGuest(Number(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Compensation to Host (₦)
                    </label>
                    <input
                      type="number"
                      value={compensationToHost}
                      onChange={(e) =>
                        setCompensationToHost(Number(e.target.value))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min={0}
                    />
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowResolutionForm(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResolveDispute}
                    disabled={!resolutionDecision || !resolutionReasoning}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Resolve Dispute
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DisputeResolutionModal;
