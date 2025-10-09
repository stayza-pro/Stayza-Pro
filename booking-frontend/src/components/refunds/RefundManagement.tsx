"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  refundService, 
  type RefundRequest, 
  type RefundRequestInput, 
  type RealtorDecisionInput,
  type AdminProcessInput 
} from '@/services';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'react-hot-toast';

interface RefundManagementProps {
  userRole: 'GUEST' | 'REALTOR' | 'ADMIN';
  className?: string;
}

export const RefundManagement: React.FC<RefundManagementProps> = ({ 
  userRole, 
  className = "" 
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedRefund, setSelectedRefund] = useState<RefundRequest | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Query for refunds based on user role
  const { 
    data: refunds, 
    isLoading, 
    error 
  } = useQuery(
    ['refunds', userRole],
    () => {
      switch (userRole) {
        case 'GUEST':
          return refundService.getMyRefundRequests();
        case 'REALTOR':
          return refundService.getRealtorRefundRequests();
        case 'ADMIN':
          return refundService.getAdminRefundRequests();
        default:
          throw new Error('Invalid user role');
      }
    },
    {
      enabled: !!user,
      refetchOnWindowFocus: false,
    }
  );

  // Request refund mutation (Guest only)
  const requestRefundMutation = useMutation(
    (data: RefundRequestInput) => refundService.requestRefund(data),
    {
      onSuccess: () => {
        toast.success('Refund request submitted successfully');
        queryClient.invalidateQueries(['refunds']);
        setShowRequestForm(false);
      },
      onError: (error: any) => {
        toast.error(refundService.extractErrorMessage(error));
      },
    }
  );

  // Realtor decision mutation
  const realtorDecisionMutation = useMutation(
    ({ id, decision }: { id: string; decision: RealtorDecisionInput }) =>
      refundService.realtorDecision(id, decision),
    {
      onSuccess: () => {
        toast.success('Decision recorded successfully');
        queryClient.invalidateQueries(['refunds']);
        setSelectedRefund(null);
      },
      onError: (error: any) => {
        toast.error(refundService.extractErrorMessage(error));
      },
    }
  );

  // Admin process mutation
  const processRefundMutation = useMutation(
    ({ id, data }: { id: string; data?: AdminProcessInput }) =>
      refundService.processRefund(id, data),
    {
      onSuccess: () => {
        toast.success('Refund processed successfully');
        queryClient.invalidateQueries(['refunds']);
        setSelectedRefund(null);
      },
      onError: (error: any) => {
        toast.error(refundService.extractErrorMessage(error));
      },
    }
  );

  const handleRealtorDecision = (approved: boolean, reason: string, notes?: string) => {
    if (!selectedRefund) return;
    
    realtorDecisionMutation.mutate({
      id: selectedRefund.id,
      decision: { approved, realtorReason: reason, realtorNotes: notes }
    });
  };

  const handleAdminProcess = (actualRefundAmount?: number, adminNotes?: string) => {
    if (!selectedRefund) return;
    
    processRefundMutation.mutate({
      id: selectedRefund.id,
      data: { actualRefundAmount, adminNotes }
    });
  };

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-red-800">
            <h3 className="font-medium">Error loading refunds</h3>
            <p className="text-sm mt-1">
              {refundService.extractErrorMessage(error)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {userRole === 'GUEST' && 'My Refund Requests'}
            {userRole === 'REALTOR' && 'Refund Requests to Review'}
            {userRole === 'ADMIN' && 'Refund Processing'}
          </h1>
          <p className="text-gray-600 mt-1">
            {userRole === 'GUEST' && 'Track your refund requests and their status'}
            {userRole === 'REALTOR' && 'Review and approve/reject refund requests for your properties'}
            {userRole === 'ADMIN' && 'Process approved refunds and handle final transactions'}
          </p>
        </div>
        
        {userRole === 'GUEST' && (
          <button
            onClick={() => setShowRequestForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Request Refund
          </button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-600">Total Requests</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
            {refunds?.data?.length || 0}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-600">Pending</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {refunds?.data?.filter(r => 
              ['PENDING_REALTOR_APPROVAL', 'ADMIN_PROCESSING'].includes(r.status)
            ).length || 0}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-600">Completed</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {refunds?.data?.filter(r => r.status === 'COMPLETED').length || 0}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-600">Rejected</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {refunds?.data?.filter(r => r.status === 'REALTOR_REJECTED').length || 0}
          </div>
        </div>
      </div>

      {/* Refunds List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Refund Requests
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {refunds?.data?.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No refund requests</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {userRole === 'GUEST' ? 'You haven\'t made any refund requests yet.' : 'No refund requests to review.'}
                </p>
              </div>
            </div>
          ) : (
            refunds?.data?.map((refund) => (
              <div
                key={refund.id}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedRefund(refund)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          Refund Request #{refund.id.slice(-8)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {refundService.getReasonLabel(refund.reason)} • 
                          {new Intl.NumberFormat('en-NG', {
                            style: 'currency',
                            currency: refund.currency,
                          }).format(refund.requestedAmount)}
                        </p>
                      </div>
                    </div>
                    
                    {refund.booking && (
                      <div className="mt-2 text-sm text-gray-600">
                        Property: {refund.booking.property.title}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${refundService.getStatusColor(refund.status) === 'green' ? 'bg-green-100 text-green-800' :
                        refundService.getStatusColor(refund.status) === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        refundService.getStatusColor(refund.status) === 'red' ? 'bg-red-100 text-red-800' :
                        refundService.getStatusColor(refund.status) === 'blue' ? 'bg-blue-100 text-blue-800' :
                        refundService.getStatusColor(refund.status) === 'purple' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'}`}
                    >
                      {refundService.getStatusLabel(refund.status)}
                    </span>
                    
                    <div className="text-sm text-gray-500">
                      {new Date(refund.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Refund Detail Modal */}
      {selectedRefund && (
        <RefundDetailModal
          refund={selectedRefund}
          userRole={userRole}
          onClose={() => setSelectedRefund(null)}
          onRealtorDecision={handleRealtorDecision}
          onAdminProcess={handleAdminProcess}
          isProcessing={realtorDecisionMutation.isLoading || processRefundMutation.isLoading}
        />
      )}

      {/* Request Refund Modal */}
      {showRequestForm && userRole === 'GUEST' && (
        <RequestRefundModal
          onClose={() => setShowRequestForm(false)}
          onSubmit={(data) => requestRefundMutation.mutate(data)}
          isLoading={requestRefundMutation.isLoading}
        />
      )}
    </div>
  );
};

// Modal Components (simplified for brevity)
const RefundDetailModal: React.FC<{
  refund: RefundRequest;
  userRole: string;
  onClose: () => void;
  onRealtorDecision: (approved: boolean, reason: string, notes?: string) => void;
  onAdminProcess: (amount?: number, notes?: string) => void;
  isProcessing: boolean;
}> = ({ refund, userRole, onClose, onRealtorDecision, onAdminProcess, isProcessing }) => {
  const [decision, setDecision] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [amount, setAmount] = useState(refund.requestedAmount);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              Refund Request Details
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4 space-y-4">
          {/* Refund details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Amount:</span>
              <span className="ml-2 text-gray-900">
                {new Intl.NumberFormat('en-NG', {
                  style: 'currency',
                  currency: refund.currency,
                }).format(refund.requestedAmount)}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Status:</span>
              <span className="ml-2">
                {refundService.getStatusLabel(refund.status)}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Reason:</span>
              <span className="ml-2">{refundService.getReasonLabel(refund.reason)}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Created:</span>
              <span className="ml-2">{new Date(refund.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {refund.customerNotes && (
            <div>
              <span className="font-medium text-gray-700">Customer Notes:</span>
              <p className="mt-1 text-gray-900">{refund.customerNotes}</p>
            </div>
          )}

          {/* Action buttons based on role and status */}
          {userRole === 'REALTOR' && refundService.canRealtorReview(refund.status) && (
            <div className="border-t border-gray-200 pt-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Decision</label>
                  <div className="mt-2 space-x-4">
                    <button
                      onClick={() => setDecision('approve')}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        decision === 'approve' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setDecision('reject')}
                      className={`px-4 py-2 rounded text-sm font-medium ${
                        decision === 'reject' 
                          ? 'bg-red-600 text-white' 
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Reject
                    </button>
                  </div>
                </div>

                {decision && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Reason <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={decision === 'approve' ? 'Reason for approval' : 'Reason for rejection'}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={3}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Optional additional notes"
                      />
                    </div>

                    <button
                      onClick={() => onRealtorDecision(decision === 'approve', reason, notes)}
                      disabled={!reason || isProcessing}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? 'Processing...' : `${decision === 'approve' ? 'Approve' : 'Reject'} Refund`}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {userRole === 'ADMIN' && refundService.canAdminProcess(refund.status) && (
            <div className="border-t border-gray-200 pt-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Refund Amount ({refund.currency})
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value))}
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Admin Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Processing notes (optional)"
                  />
                </div>

                <button
                  onClick={() => onAdminProcess(amount, notes)}
                  disabled={isProcessing}
                  className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? 'Processing...' : 'Process Refund'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RequestRefundModal: React.FC<{
  onClose: () => void;
  onSubmit: (data: RefundRequestInput) => void;
  isLoading: boolean;
}> = ({ onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState<RefundRequestInput>({
    bookingId: '',
    paymentId: '',
    requestedAmount: 0,
    reason: 'OTHER' as const,
    customerNotes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">Request Refund</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Booking ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.bookingId}
              onChange={(e) => setFormData(prev => ({ ...prev, bookingId: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Payment ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.paymentId}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentId: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Refund Amount <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              value={formData.requestedAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, requestedAmount: parseFloat(e.target.value) }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value as any }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="BOOKING_CANCELLED">Booking Cancelled</option>
              <option value="SERVICE_ISSUE">Service Issue</option>
              <option value="PROPERTY_UNAVAILABLE">Property Unavailable</option>
              <option value="OVERCHARGE">Overcharge</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Additional Notes</label>
            <textarea
              rows={3}
              value={formData.customerNotes}
              onChange={(e) => setFormData(prev => ({ ...prev, customerNotes: e.target.value }))}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Please provide details about your refund request..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RefundManagement;