"use client";

import React, { useEffect } from "react";
import { X, Check, AlertTriangle, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastNotification {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
  onClose?: () => void;
  onClick?: () => void;
}

interface ToastProps extends ToastNotification {
  onClose: () => void;
}

export function Toast({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
  onClick,
}: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case "success":
        return <Check className="h-5 w-5" />;
      case "error":
        return <AlertCircle className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      case "info":
        return <Info className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getStyles = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200 text-green-800";
      case "error":
        return "bg-red-50 border-red-200 text-red-800";
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      case "info":
        return "bg-blue-50 border-blue-200 text-blue-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const getIconColor = () => {
    switch (type) {
      case "success":
        return "text-green-500";
      case "error":
        return "text-red-500";
      case "warning":
        return "text-yellow-500";
      case "info":
        return "text-blue-500";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div
      className={cn(
        "max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transform transition-all duration-300 ease-in-out",
        "hover:shadow-xl",
        onClick && "cursor-pointer"
      )}
      onClick={onClick}
    >
      <div className={cn("p-4 border-l-4", getStyles())}>
        <div className="flex items-start">
          <div className={cn("flex-shrink-0", getIconColor())}>{getIcon()}</div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">{title}</p>
            <p className="mt-1 text-sm text-gray-600">{message}</p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
            >
              <span className="sr-only">Close</span>
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Progress bar for duration */}
      {duration > 0 && (
        <div className="h-1 bg-gray-200">
          <div
            className={cn(
              "h-full transition-all ease-linear",
              type === "success" && "bg-green-500",
              type === "error" && "bg-red-500",
              type === "warning" && "bg-yellow-500",
              type === "info" && "bg-blue-500"
            )}
            style={{
              animation: `shrink ${duration}ms linear`,
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastNotification[];
  onRemoveToast: (id: string) => void;
  position?:
    | "top-right"
    | "top-left"
    | "bottom-right"
    | "bottom-left"
    | "top-center"
    | "bottom-center";
}

export function ToastContainer({
  toasts,
  onRemoveToast,
  position = "top-right",
}: ToastContainerProps) {
  const getPositionStyles = () => {
    switch (position) {
      case "top-right":
        return "top-0 right-0";
      case "top-left":
        return "top-0 left-0";
      case "bottom-right":
        return "bottom-0 right-0";
      case "bottom-left":
        return "bottom-0 left-0";
      case "top-center":
        return "top-0 left-1/2 transform -translate-x-1/2";
      case "bottom-center":
        return "bottom-0 left-1/2 transform -translate-x-1/2";
      default:
        return "top-0 right-0";
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="assertive"
      className={cn(
        "fixed z-50 inset-0 flex flex-col items-end space-y-4 pointer-events-none p-6 sm:p-6",
        getPositionStyles()
      )}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => onRemoveToast(toast.id)}
        />
      ))}
    </div>
  );
}
