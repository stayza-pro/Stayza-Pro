"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import AlertModal, { AlertType } from "@/components/ui/AlertModal";

interface AlertConfig {
  type: AlertType;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
}

interface AlertContextType {
  showAlert: (config: AlertConfig) => void;
  showSuccess: (message: string, title?: string) => void;
  showError: (message: string, title?: string) => void;
  showWarning: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  showConfirm: (message: string, onConfirm: () => void, title?: string) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<AlertConfig>({
    type: "info",
    message: "",
  });

  const showAlert = useCallback((alertConfig: AlertConfig) => {
    setConfig(alertConfig);
    setIsOpen(true);
  }, []);

  const showSuccess = useCallback(
    (message: string, title = "Success") => {
      showAlert({ type: "success", title, message });
    },
    [showAlert]
  );

  const showError = useCallback(
    (message: string, title = "Error") => {
      showAlert({ type: "error", title, message });
    },
    [showAlert]
  );

  const showWarning = useCallback(
    (message: string, title = "Warning") => {
      showAlert({ type: "warning", title, message });
    },
    [showAlert]
  );

  const showInfo = useCallback(
    (message: string, title = "Info") => {
      showAlert({ type: "info", title, message });
    },
    [showAlert]
  );

  const showConfirm = useCallback(
    (message: string, onConfirm: () => void, title = "Confirm") => {
      showAlert({
        type: "confirm",
        title,
        message,
        onConfirm,
        confirmText: "Confirm",
        cancelText: "Cancel",
      });
    },
    [showAlert]
  );

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <AlertContext.Provider
      value={{
        showAlert,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showConfirm,
      }}
    >
      {children}
      <AlertModal
        isOpen={isOpen}
        onClose={handleClose}
        onConfirm={config.onConfirm}
        type={config.type}
        title={config.title}
        message={config.message}
        confirmText={config.confirmText}
        cancelText={config.cancelText}
        showCancel={config.type === "confirm"}
      />
    </AlertContext.Provider>
  );
};
