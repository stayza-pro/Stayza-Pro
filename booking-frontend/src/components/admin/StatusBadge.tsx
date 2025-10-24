import React from "react";
import { CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";

interface StatusBadgeProps {
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
  showIcon = true,
}) => {
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const statusConfig = {
    PENDING: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      border: "border-yellow-200",
      icon: Clock,
      label: "Pending",
    },
    APPROVED: {
      bg: "bg-green-100",
      text: "text-green-800",
      border: "border-green-200",
      icon: CheckCircle,
      label: "Approved",
    },
    REJECTED: {
      bg: "bg-red-100",
      text: "text-red-800",
      border: "border-red-200",
      icon: XCircle,
      label: "Rejected",
    },
    SUSPENDED: {
      bg: "bg-gray-100",
      text: "text-gray-800",
      border: "border-gray-200",
      icon: AlertTriangle,
      label: "Suspended",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]}`}
    >
      {showIcon && <Icon className={iconSizes[size]} />}
      {config.label}
    </span>
  );
};
