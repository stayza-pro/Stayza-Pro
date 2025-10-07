"use client";

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { reviewService } from '../../services';
import { Review, ReviewResponse } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';

interface RealtorModerationDashboardProps {
  className?: string;
}

export const RealtorModerationDashboard: React.FC<RealtorModerationDashboardProps> = ({ 
  className = "" 
}) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    orderBy: 'createdAt',
    order: 'desc',
    page: 1,
    limit: 10,
  });

  // Query for reviews to moderate
  const { 
    data: reviewsData, 
    isLoading, 
    error 
  } = useQuery(
    ['realtor-reviews-moderation', filters],
    () => reviewService.getRealtorReviewsForModeration(filters),
    {
      enabled: !!user,
      refetchOnWindowFocus: false,
    }
  );

  // Flag review mutation
  const flagReviewMutation = useMutation(
    ({ reviewId, reason }: { reviewId: string; reason: string }) =>
      reviewService.flagReviewForAdmin(reviewId, reason),
    {
      onSuccess: () => {
        toast.success('Review flagged for admin review');
        queryClient.invalidateQueries(['realtor-reviews-moderation']);
      },
      onError: (error: any) => {
        toast.error(reviewService.extractErrorMessage(error));
      },
    }
  );

  // Toggle visibility mutation
  const toggleVisibilityMutation = useMutation(
    ({ reviewId, visible }: { reviewId: string; visible: boolean }) =>
      reviewService.toggleReviewVisibility(reviewId, visible),
    {
      onSuccess: () => {
        toast.success('Review visibility updated');
        queryClient.invalidateQueries(['realtor-reviews-moderation']);
      },
      onError: (error: any) => {
        toast.error(reviewService.extractErrorMessage(error));
      },
    }
  );

  // Respond to review mutation
  const respondMutation = useMutation(
    ({ reviewId, response }: { reviewId: string; response: string }) =>
      reviewService.respondToReview(reviewId, response),
    {
      onSuccess: () => {
        toast.success('Response posted successfully');
        queryClient.invalidateQueries(['realtor-reviews-moderation']);
        setSelectedReview(null);
      },
      onError: (error: any) => {
        toast.error(reviewService.extractErrorMessage(error));
      },
    }
  );

  const handleFlagReview = (reviewId: string, reason: string) => {
    flagReviewMutation.mutate({ reviewId, reason });
  };

  const handleToggleVisibility = (reviewId: string, visible: boolean) => {
    toggleVisibilityMutation.mutate({ reviewId, visible });
  };

  const handleRespond = (reviewId: string, response: string) => {
    respondMutation.mutate({ reviewId, response });
  };

  const reviews = reviewsData?.data || [];
  const pagination = reviewsData?.pagination;

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
            <h3 className="font-medium">Error loading reviews</h3>
            <p className="text-sm mt-1">
              {reviewService.extractErrorMessage(error)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Review Moderation</h1>
        <p className="text-gray-600 mt-1">
          Manage and moderate reviews for your properties
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-600">Total Reviews</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">
             {pagination?.totalItems || 0}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-600">Visible</div>
          <div className="text-2xl font-bold text-green-600 mt-1">
            {reviews.filter(r => r.isVisible !== false).length}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-600">Hidden</div>
          <div className="text-2xl font-bold text-red-600 mt-1">
            {reviews.filter(r => r.isVisible === false).length}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm font-medium text-gray-600">Needs Response</div>
          <div className="text-2xl font-bold text-yellow-600 mt-1">
            {reviews.filter(r => r.rating <= 2 && !r.hostResponse).length}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value as any, page: 1 }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Reviews</option>
              <option value="ACTIVE">Visible</option>
              <option value="HIDDEN">Hidden</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={filters.orderBy}
              onChange={(e) => setFilters((prev) => ({ ...prev, orderBy: e.target.value as any, page: 1 }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="createdAt">Date Created</option>
              <option value="rating">Rating</option>
              <option value="updatedAt">Recently Updated</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Order
            </label>
            <select
              value={filters.order}
              onChange={(e) => setFilters((prev) => ({ ...prev, order: e.target.value as any, page: 1 }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Per Page
            </label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters((prev) => ({ ...prev, limit: parseInt(e.target.value), page: 1 }))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">
            Reviews ({pagination?.totalItems || 0})
          </h2>
        </div>
        
        <div className="divide-y divide-gray-200">
          {reviews.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No reviews match the current filter criteria.
                </p>
              </div>
            </div>
          ) : (
            reviews.map((review) => (
              <div key={review.id} className="px-6 py-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="flex items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg
                            key={star}
                            className={`h-5 w-5 ${
                              star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                        <span className="ml-2 text-sm text-gray-600">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        review.isVisible !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {review.isVisible !== false ? 'Visible' : 'Hidden'}
                      </span>
                    </div>

                    {review.booking && (
                      <div className="text-sm text-gray-600 mb-2">
                        <strong>Property:</strong> {review.booking?.property?.title} •
                        <strong className="ml-2">Guest:</strong> {review.booking?.guest?.firstName} {review.booking?.guest?.lastName}
                      </div>
                    )}

                    <p className="text-gray-900 mb-3">{review.comment}</p>

                    {review.hostResponse && (
                      <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-3">
                        <p className="text-blue-800">
                          {typeof review.hostResponse === 'string'
                            ? review.hostResponse
                            : review.hostResponse?.comment || ''}
                        </p>
                      </div>
                    )}

                    {reviewService.hasPhotos && reviewService.hasPhotos(review) && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-700 mb-2">Photos:</div>
                        <div className="flex space-x-2">
                          {reviewService.getPhotoUrls(review).map((url: any, index: any) => (
                            <img
                              key={index}
                              src={url}
                              alt={`Review photo ${index + 1}`}
                              className="w-16 h-16 object-cover rounded border"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col space-y-2 ml-4">
                    <button
                      onClick={() => setSelectedReview(review)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </button>

                    <button
                      onClick={() => setSelectedReview(review)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      {review.hostResponse ? 'Edit Response' : 'Respond'}
                    </button>

                    <button
                      onClick={() => handleToggleVisibility(review.id, !review.isVisible)}
                      disabled={toggleVisibilityMutation.isLoading}
                      className={`text-sm font-medium ${
                        review.isVisible ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                      } disabled:opacity-50`}
                    >
                      {review.isVisible ? 'Hide' : 'Show'}
                    </button>

                    <button
                      onClick={() => handleFlagReview(review.id, 'Flagged by realtor for admin review')}
                      disabled={flagReviewMutation.isLoading}
                      className="text-yellow-600 hover:text-yellow-800 text-sm font-medium disabled:opacity-50"
                    >
                      Flag for Admin
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              <span>
                Showing {((pagination.currentPage - 1) * 10) + 1} to{' '}
                {Math.min(pagination.currentPage * 10, pagination.totalItems)} of{' '}
                {pagination.totalItems} results
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                disabled={!pagination.hasPrev}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled={!pagination.hasNext}
                onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Detail/Response Modal */}
      {selectedReview && (
        <ReviewResponseModal
          review={selectedReview}
          onClose={() => setSelectedReview(null)}
          onRespond={handleRespond}
          isLoading={respondMutation.isLoading}
        />
      )}
    </div>
  );
};

// Review Response Modal Component
const ReviewResponseModal: React.FC<{
  review: Review;
  onClose: () => void;
  onRespond: (reviewId: string, response: string) => void;
  isLoading: boolean;
}> = ({ review, onClose, onRespond, isLoading }) => {
  const [response, setResponse] = useState(review.hostResponse?.comment || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (response.trim()) {
      onRespond(review.id, response);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              {review.hostResponse ? 'Edit Response' : 'Respond to Review'}
            </h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4">
          {/* Original Review */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center mb-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`h-4 w-4 ${
                      star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-500">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="text-gray-900">{review.comment}</p>
          </div>

          {/* Response Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Response
              </label>
              <textarea
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                rows={4}
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Write a professional response to this review..."
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !response.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Posting...' : (review.hostResponse ? 'Update Response' : 'Post Response')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RealtorModerationDashboard;