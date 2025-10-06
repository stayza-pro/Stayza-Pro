import { useState, useCallback } from 'react';
import { ToastNotification, ToastType } from '@/components/notifications/Toast';

interface UseToastReturn {
  toasts: ToastNotification[];
  addToast: (toast: Omit<ToastNotification, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  success: (title: string, message: string, options?: Partial<ToastNotification>) => string;
  error: (title: string, message: string, options?: Partial<ToastNotification>) => string;
  warning: (title: string, message: string, options?: Partial<ToastNotification>) => string;
  info: (title: string, message: string, options?: Partial<ToastNotification>) => string;
}

let toastId = 0;

export function useToast(): UseToastReturn {
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const addToast = useCallback((toast: Omit<ToastNotification, 'id'>): string => {
    const id = `toast-${++toastId}`;
    const newToast: ToastNotification = {
      id,
      duration: 5000, // Default duration
      ...toast,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const createToast = useCallback((
    type: ToastType,
    title: string,
    message: string,
    options?: Partial<ToastNotification>
  ): string => {
    return addToast({
      type,
      title,
      message,
      ...options,
    });
  }, [addToast]);

  const success = useCallback((
    title: string,
    message: string,
    options?: Partial<ToastNotification>
  ): string => {
    return createToast('success', title, message, options);
  }, [createToast]);

  const error = useCallback((
    title: string,
    message: string,
    options?: Partial<ToastNotification>
  ): string => {
    return createToast('error', title, message, { duration: 8000, ...options });
  }, [createToast]);

  const warning = useCallback((
    title: string,
    message: string,
    options?: Partial<ToastNotification>
  ): string => {
    return createToast('warning', title, message, { duration: 6000, ...options });
  }, [createToast]);

  const info = useCallback((
    title: string,
    message: string,
    options?: Partial<ToastNotification>
  ): string => {
    return createToast('info', title, message, options);
  }, [createToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
  };
}