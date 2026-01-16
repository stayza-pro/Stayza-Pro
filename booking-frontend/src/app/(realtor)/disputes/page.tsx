"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import { useBranding } from "@/hooks/useBranding";
import { disputeService } from "@/services/disputes";
import { Dispute, DisputeStats } from "@/types/dispute";
import {
  AlertCircle,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Paperclip,
  X,
  Filter,
  Eye,
  Loader2,
  FileText,
  User,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function RealtorDisputesPage() {
  const { user } = useAuth();
  const { showSuccess, showError } = useAlert();
  const { branding } = useBranding();

  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [stats, setStats] = useState<DisputeStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [resolution, setResolution] = useState("");
  const [isAccepting, setIsAccepting] = useState(false);

  const brandColor = branding?.primaryColor || "#3B82F6";

  useEffect(() => {
    fetchDisputes();
    fetchStats();
  }, [statusFilter]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const filterStatus = statusFilter === "all" ? undefined : statusFilter;
      const data = await disputeService.getRealtorDisputes(filterStatus);
      setDisputes(data);
    } catch (error: any) {
      
      showError(error.response?.data?.message || "Failed to load disputes");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await disputeService.getRealtorDisputeStats();
      setStats(data);
    } catch (error) {
      
    }
  };

  const handleViewDispute = (dispute: Dispute) => {
    setSelectedDispute(dispute);
  };

  const handleRespondClick = (dispute: Dispute) => {
    if (dispute.realtorArgumentCount >= 2) {
      showError("You have reached the maximum number of responses (2)");
      return;
    }
    setSelectedDispute(dispute);
    setShowResponseModal(true);
  };

  const handleSubmitResponse = async () => {
    if (!selectedDispute || !responseMessage.trim()) {
      showError("Please enter a response message");
      return;
    }

    try {
      setIsResponding(true);
      await disputeService.respondToDispute(selectedDispute.id, {
        message: responseMessage.trim(),
      });
      showSuccess("Response submitted successfully");
      setShowResponseModal(false);
      setResponseMessage("");
      setSelectedDispute(null);
      await fetchDisputes();
      await fetchStats();
    } catch (error: any) {
      
      showError(error.response?.data?.message || "Failed to submit response");
    } finally {
      setIsResponding(false);
    }
  };

  const handleAcceptDispute = async () => {
    if (!selectedDispute || !resolution.trim()) {
      showError("Please enter a resolution message");
      return;
    }

    try {
      setIsAccepting(true);
      await disputeService.acceptDispute(selectedDispute.id, resolution.trim());
      showSuccess("Dispute accepted and resolved");
      setShowAcceptModal(false);
      setResolution("");
      setSelectedDispute(null);
      await fetchDisputes();
      await fetchStats();
    } catch (error: any) {
      
      showError(error.response?.data?.message || "Failed to accept dispute");
    } finally {
      setIsAccepting(false);
    }
  };

  const getIssueTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      PROPERTY_CONDITION: "Property Condition",
      CLEANLINESS: "Cleanliness Issue",
      AMENITIES_MISSING: "Missing Amenities",
      SAFETY_CONCERNS: "Safety Concerns",
      BOOKING_ISSUES: "Booking Issues",
      PAYMENT_DISPUTE: "Payment Dispute",
      OTHER: "Other",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; bg: string; icon: any }> = {
      OPEN: { color: "text-blue-700", bg: "bg-blue-100", icon: AlertCircle },
      PENDING_REALTOR_RESPONSE: {
        color: "text-orange-700",
        bg: "bg-orange-100",
        icon: Clock,
      },
      PENDING_GUEST_RESPONSE: {
        color: "text-purple-700",
        bg: "bg-purple-100",
        icon: MessageSquare,
      },
      RESOLVED: {
        color: "text-green-700",
        bg: "bg-green-100",
        icon: CheckCircle,
      },
      CLOSED: { color: "text-gray-700", bg: "bg-gray-100", icon: XCircle },
    };

    const config = configs[status] || configs.OPEN;
    const Icon = config.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}
      >
        <Icon className="w-3 h-3" />
        {status.replace(/_/g, " ")}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <AlertCircle className="w-8 h-8" style={{ color: brandColor }} />
          Disputes
        </h1>
        <p className="text-gray-600">Manage guest disputes and concerns</p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Disputes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalDisputes}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-blue-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open Disputes</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.openDisputes}
                </p>
              </div>
              <Clock className="w-8 h-8 text-orange-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Your Response</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.pendingResponse}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-red-500" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow p-5"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.resolvedDisputes}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </motion.div>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          >
            <option value="all">All Disputes</option>
            <option value="OPEN">Open</option>
            <option value="PENDING_REALTOR_RESPONSE">
              Pending My Response
            </option>
            <option value="PENDING_GUEST_RESPONSE">
              Pending Guest Response
            </option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Disputes List */}
      <div className="bg-white rounded-lg shadow">
        {disputes.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No disputes found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {disputes.map((dispute) => (
              <motion.div
                key={dispute.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {dispute.subject}
                      </h3>
                      {getStatusBadge(dispute.status)}
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                        {getIssueTypeLabel(dispute.issueType)}
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {dispute.description}
                    </p>

                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        <span>
                          {dispute.guest?.firstName} {dispute.guest?.lastName}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        <span>Booking: {dispute.booking?.propertyTitle}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-4 h-4" />
                        <span>{dispute.messages?.length || 0} messages</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>
                          {formatDistanceToNow(new Date(dispute.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                      <span>
                        Guest arguments: {dispute.guestArgumentCount}/2
                      </span>
                      <span>•</span>
                      <span>
                        Your arguments: {dispute.realtorArgumentCount}/2
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleViewDispute(dispute)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2 text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>

                    {dispute.status === "PENDING_REALTOR_RESPONSE" &&
                      dispute.realtorArgumentCount < 2 && (
                        <button
                          onClick={() => handleRespondClick(dispute)}
                          style={{ backgroundColor: brandColor }}
                          className="px-4 py-2 text-white rounded-lg hover:opacity-90 flex items-center gap-2 text-sm"
                        >
                          <Send className="w-4 h-4" />
                          Respond
                        </button>
                      )}

                    {dispute.status === "OPEN" && (
                      <button
                        onClick={() => {
                          setSelectedDispute(dispute);
                          setShowAcceptModal(true);
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* View Dispute Modal */}
      <AnimatePresence>
        {selectedDispute && !showResponseModal && !showAcceptModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Dispute Details
                </h2>
                <button
                  onClick={() => setSelectedDispute(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="space-y-6">
                  {/* Dispute Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {selectedDispute.subject}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {selectedDispute.description}
                    </p>
                    <div className="flex items-center gap-3 text-sm">
                      {getStatusBadge(selectedDispute.status)}
                      <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-600">
                        {getIssueTypeLabel(selectedDispute.issueType)}
                      </span>
                    </div>
                  </div>

                  {/* Messages */}
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">
                      Conversation
                    </h4>
                    <div className="space-y-4">
                      {selectedDispute.messages?.map((message) => (
                        <div
                          key={message.id}
                          className={`p-4 rounded-lg ${
                            message.senderType === "REALTOR"
                              ? "bg-blue-50 ml-8"
                              : "bg-gray-100 mr-8"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900">
                              {message.senderType === "REALTOR"
                                ? "You"
                                : "Guest"}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDistanceToNow(
                                new Date(message.createdAt),
                                { addSuffix: true }
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">
                            {message.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Argument Counts */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Guest Arguments:</span>
                        <span className="ml-2 font-semibold">
                          {selectedDispute.guestArgumentCount}/2
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Your Arguments:</span>
                        <span className="ml-2 font-semibold">
                          {selectedDispute.realtorArgumentCount}/2
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Response Modal */}
      <AnimatePresence>
        {showResponseModal && selectedDispute && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg max-w-2xl w-full"
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Respond to Dispute
                </h2>
                <button
                  onClick={() => {
                    setShowResponseModal(false);
                    setResponseMessage("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Responding to:{" "}
                    <span className="font-semibold">
                      {selectedDispute.subject}
                    </span>
                  </p>
                  <p className="text-xs text-gray-500">
                    You have {2 - selectedDispute.realtorArgumentCount}{" "}
                    response(s) remaining
                  </p>
                </div>

                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Enter your response..."
                  className="w-full min-h-[200px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowResponseModal(false);
                      setResponseMessage("");
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitResponse}
                    disabled={isResponding || !responseMessage.trim()}
                    style={{ backgroundColor: brandColor }}
                    className="px-6 py-2 text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isResponding ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Response
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Accept Modal */}
      <AnimatePresence>
        {showAcceptModal && selectedDispute && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-lg max-w-2xl w-full"
            >
              <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Accept Dispute
                </h2>
                <button
                  onClick={() => {
                    setShowAcceptModal(false);
                    setResolution("");
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    You are accepting responsibility for:{" "}
                    <span className="font-semibold">
                      {selectedDispute.subject}
                    </span>
                  </p>
                  <p className="text-sm text-yellow-600 bg-yellow-50 p-3 rounded-lg">
                    By accepting this dispute, you acknowledge the issue and
                    agree to resolve it according to your resolution plan.
                  </p>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resolution Plan <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  placeholder="Describe how you will resolve this issue..."
                  className="w-full min-h-[150px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowAcceptModal(false);
                      setResolution("");
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAcceptDispute}
                    disabled={isAccepting || !resolution.trim()}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isAccepting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Accepting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Accept & Resolve
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
