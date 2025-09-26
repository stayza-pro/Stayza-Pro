"use client";

import React, { useState, useEffect } from "react";
import { Card, Button, Loading } from "../ui";
import { PropertyCard } from "../property";
import { BookingCard } from "../booking";
import { ReviewCard } from "../review";
import {
  Shield,
  Users,
  Home,
  DollarSign,
  Star,
  AlertTriangle,
  TrendingUp,
  Calendar,
  MessageSquare,
  Settings,
  Flag,
  CheckCircle,
  XCircle,
  Eye,
  Search,
  Filter,
} from "lucide-react";
import { User as UserType, Property, Booking, Review } from "../../types";

interface AdminDashboardProps {
  currentUser: UserType;
  stats?: {
    totalUsers: number;
    totalProperties: number;
    totalBookings: number;
    totalRevenue: number;
    activeUsers: number;
    pendingApprovals: number;
    reportedContent: number;
  };
  recentUsers?: UserType[];
  recentProperties?: Property[];
  recentBookings?: Booking[];
  recentReviews?: Review[];
  reportedContent?: {
    properties: Property[];
    reviews: Review[];
    users: UserType[];
  };
  isLoading?: boolean;
  onUserSelect?: (user: UserType) => void;
  onPropertySelect?: (property: Property) => void;
  onBookingSelect?: (booking: Booking) => void;
  onReviewSelect?: (review: Review) => void;
  onApproveProperty?: (propertyId: string) => void;
  onRejectProperty?: (propertyId: string) => void;
  onBanUser?: (userId: string) => void;
  onDeleteContent?: (contentType: string, contentId: string) => void;
  className?: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  stats = {
    totalUsers: 0,
    totalProperties: 0,
    totalBookings: 0,
    totalRevenue: 0,
    activeUsers: 0,
    pendingApprovals: 0,
    reportedContent: 0,
  },
  recentUsers = [],
  recentProperties = [],
  recentBookings = [],
  recentReviews = [],
  reportedContent = { properties: [], reviews: [], users: [] },
  isLoading = false,
  onUserSelect,
  onPropertySelect,
  onBookingSelect,
  onReviewSelect,
  onApproveProperty,
  onRejectProperty,
  onBanUser,
  onDeleteContent,
  className = "",
}) => {
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "users"
    | "properties"
    | "bookings"
    | "reviews"
    | "reports"
    | "analytics"
  >("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: TrendingUp },
    { id: "users", label: "Users", icon: Users },
    { id: "properties", label: "Properties", icon: Home },
    { id: "bookings", label: "Bookings", icon: Calendar },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "reports", label: "Reports", icon: Flag },
    { id: "analytics", label: "Analytics", icon: TrendingUp },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loading size="lg" />
      </div>
    );
  }

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalUsers.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-green-600">
              {stats.activeUsers} active this month
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Properties
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalProperties.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Home className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm text-yellow-600">
              {stats.pendingApprovals} pending approval
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Bookings
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalBookings.toLocaleString()}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalRevenue)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <DollarSign className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Alerts */}
      {(stats.pendingApprovals > 0 || stats.reportedContent > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.pendingApprovals > 0 && (
            <Card className="p-6 bg-yellow-50 border-yellow-200">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800">
                    Pending Approvals
                  </h3>
                  <p className="text-yellow-700">
                    {stats.pendingApprovals} properties waiting for approval
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("properties")}
                >
                  Review
                </Button>
              </div>
            </Card>
          )}

          {stats.reportedContent > 0 && (
            <Card className="p-6 bg-red-50 border-red-200">
              <div className="flex items-center space-x-3">
                <Flag className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="text-lg font-semibold text-red-800">
                    Reported Content
                  </h3>
                  <p className="text-red-700">
                    {stats.reportedContent} items need moderation
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab("reports")}
                >
                  Review
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Users
          </h3>
          <div className="space-y-4">
            {recentUsers.slice(0, 5).map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img
                    src={user.avatar || "/default-avatar.png"}
                    alt={`${user.firstName} ${user.lastName}`}
                    className="w-8 h-8 object-cover rounded-full"
                  />
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === "HOST"
                        ? "bg-green-100 text-green-800"
                        : user.role === "ADMIN"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {user.role}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(user.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => setActiveTab("users")}
          >
            View All Users
          </Button>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Properties
          </h3>
          <div className="space-y-4">
            {recentProperties.slice(0, 5).map((property) => (
              <div
                key={property.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={property.images[0] || "/placeholder-image.jpg"}
                    alt={property.title}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <div>
                    <p className="font-medium text-gray-900 truncate max-w-48">
                      {property.title}
                    </p>
                    <p className="text-sm text-gray-600">
                      {property.city}, {property.country}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      property.status === "APPROVED"
                        ? "bg-green-100 text-green-800"
                        : property.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {property.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatCurrency(property.pricePerNight)}/night
                  </p>
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            className="w-full mt-4"
            onClick={() => setActiveTab("properties")}
          >
            View All Properties
          </Button>
        </Card>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Roles</option>
          <option value="GUEST">Guests</option>
          <option value="HOST">Hosts</option>
          <option value="ADMIN">Admins</option>
        </select>
      </div>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={user.avatar || "/default-avatar.png"}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-10 h-10 object-cover rounded-full mr-4"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.role === "HOST"
                          ? "bg-green-100 text-green-800"
                          : user.role === "ADMIN"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : user.status === "SUSPENDED"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {user.status || "ACTIVE"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button
                      variant="ghost"
                      onClick={() => onUserSelect?.(user)}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onBanUser?.(user.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Suspend
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderProperties = () => (
    <div className="space-y-6">
      {/* Pending Approvals */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Pending Approvals ({stats.pendingApprovals})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentProperties
            .filter((property) => property.status === "PENDING")
            .map((property) => (
              <div
                key={property.id}
                className="border border-yellow-200 rounded-lg overflow-hidden"
              >
                <img
                  src={property.images[0] || "/placeholder-image.jpg"}
                  alt={property.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {property.title}
                  </h4>
                  <p className="text-gray-600 text-sm mb-2">
                    {property.city}, {property.country}
                  </p>
                  <p className="text-lg font-bold text-gray-900 mb-4">
                    {formatCurrency(property.pricePerNight)}/night
                  </p>

                  <div className="flex space-x-2">
                    <Button
                      variant="primary"
                      onClick={() => onApproveProperty?.(property.id)}
                      className="flex-1"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onRejectProperty?.(property.id)}
                      className="flex-1 text-red-600 hover:text-red-700"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>

      {/* All Properties */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          All Properties
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentProperties.map((property) => (
            <div
              key={property.id}
              onClick={() => onPropertySelect?.(property)}
              className="cursor-pointer"
            >
              <PropertyCard property={property} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  );

  const renderBookings = () => (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">All Bookings</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Guest
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <img
                        src={booking.guest.avatar || "/default-avatar.png"}
                        alt={`${booking.guest.firstName} ${booking.guest.lastName}`}
                        className="w-8 h-8 object-cover rounded-full mr-3"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {booking.guest.firstName} {booking.guest.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {booking.guest.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm font-medium text-gray-900">
                      {booking.property.title}
                    </p>
                    <p className="text-sm text-gray-500">
                      {booking.property.city}, {booking.property.country}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">
                      {formatDate(booking.checkInDate)} -{" "}
                      {formatDate(booking.checkOutDate)}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        booking.status === "CONFIRMED"
                          ? "bg-green-100 text-green-800"
                          : booking.status === "PENDING"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(booking.totalPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      variant="ghost"
                      onClick={() => onBookingSelect?.(booking)}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );

  const renderReviews = () => (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Reviews
        </h3>

        <div className="space-y-4">
          {recentReviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              currentUser={currentUser}
              showPropertyName
              onReport={() => onDeleteContent?.("review", review.id)}
              onDelete={() => onDeleteContent?.("review", review.id)}
            />
          ))}
        </div>
      </Card>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Reported Properties
              </p>
              <p className="text-2xl font-bold text-red-600">
                {reportedContent.properties.length}
              </p>
            </div>
            <Flag className="h-8 w-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Reported Reviews
              </p>
              <p className="text-2xl font-bold text-red-600">
                {reportedContent.reviews.length}
              </p>
            </div>
            <MessageSquare className="h-8 w-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Reported Users
              </p>
              <p className="text-2xl font-bold text-red-600">
                {reportedContent.users.length}
              </p>
            </div>
            <Users className="h-8 w-8 text-red-600" />
          </div>
        </Card>
      </div>

      {/* Reported Content */}
      <div className="space-y-6">
        {reportedContent.properties.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reported Properties
            </h3>
            <div className="space-y-4">
              {reportedContent.properties.map((property) => (
                <div
                  key={property.id}
                  className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50"
                >
                  <div className="flex items-center space-x-4">
                    <img
                      src={property.images[0] || "/placeholder-image.jpg"}
                      alt={property.title}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {property.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {property.city}, {property.country}
                      </p>
                      <p className="text-sm text-red-600 mt-1">
                        Reported for inappropriate content
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => onPropertySelect?.(property)}
                    >
                      Review
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => onDeleteContent?.("property", property.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {reportedContent.reviews.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Reported Reviews
            </h3>
            <div className="space-y-4">
              {reportedContent.reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-4 border border-red-200 rounded-lg bg-red-50"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center space-x-3">
                      <img
                        src={review.guest.avatar || "/default-avatar.png"}
                        alt={`${review.guest.firstName} ${review.guest.lastName}`}
                        className="w-8 h-8 object-cover rounded-full"
                      />
                      <div>
                        <p className="font-medium text-gray-900">
                          {review.guest.firstName} {review.guest.lastName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {review.property?.title}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => onReviewSelect?.(review)}
                      >
                        Review
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => onDeleteContent?.("review", review.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                  <p className="text-sm text-red-600 mt-2">
                    Reported for inappropriate language
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      {/* Platform Growth */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">User Growth</p>
              <p className="text-2xl font-bold text-gray-900">+12.5%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mt-2">This month</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Revenue Growth
              </p>
              <p className="text-2xl font-bold text-gray-900">+18.2%</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-sm text-gray-600 mt-2">This month</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Booking Rate</p>
              <p className="text-2xl font-bold text-gray-900">68.4%</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-600" />
          </div>
          <p className="text-sm text-gray-600 mt-2">Average</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Platform Rating
              </p>
              <p className="text-2xl font-bold text-gray-900">4.7</p>
            </div>
            <Star className="h-8 w-8 text-yellow-600" />
          </div>
          <p className="text-sm text-gray-600 mt-2">Out of 5</p>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue Trends
          </h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">
              Revenue trends chart would be displayed here
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            User Activity
          </h3>
          <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">
              User activity chart would be displayed here
            </p>
          </div>
        </Card>
      </div>
    </div>
  );

  return (
    <div className={`bg-gray-50 min-h-screen ${className}`}>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Admin Dashboard
              </h1>
              <p className="text-gray-600">
                Platform management and system overview
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                  {tab.id === "reports" && stats.reportedContent > 0 && (
                    <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                      {stats.reportedContent}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div>
          {activeTab === "overview" && renderOverview()}
          {activeTab === "users" && renderUsers()}
          {activeTab === "properties" && renderProperties()}
          {activeTab === "bookings" && renderBookings()}
          {activeTab === "reviews" && renderReviews()}
          {activeTab === "reports" && renderReports()}
          {activeTab === "analytics" && renderAnalytics()}
        </div>
      </div>
    </div>
  );
};
