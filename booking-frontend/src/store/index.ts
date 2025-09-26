// Export all stores
export { useAuthStore } from "./authStore";
export { useBookingStore } from "./bookingStore";
export { useUIStore } from "./uiStore";

// Export store types for convenience
export type { BookingStep } from "./bookingStore";

// Custom hooks for common store operations
import { useAuthStore } from "./authStore";
import { useBookingStore } from "./bookingStore";
import { useUIStore } from "./uiStore";

// Auth helpers
export const useAuth = () => {
  const { user, isAuthenticated, login, logout, register } = useAuthStore();
  return { user, isAuthenticated, login, logout, register };
};

export const useAuthLoading = () => {
  const isLoading = useAuthStore((state) => state.isLoading);
  return isLoading;
};

export const useAuthError = () => {
  const { error, clearError } = useAuthStore();
  return { error, clearError };
};

// Booking helpers
export const useBookingFlow = () => {
  const {
    selectedProperty,
    bookingData,
    currentStep,
    steps,
    nextStep,
    previousStep,
    resetBookingFlow,
  } = useBookingStore();

  return {
    selectedProperty,
    bookingData,
    currentStep,
    steps,
    nextStep,
    previousStep,
    resetBookingFlow,
  };
};

export const useBookingPrice = () => {
  const {
    priceBreakdown,
    totalPrice,
    updatePriceBreakdown,
    clearPriceBreakdown,
  } = useBookingStore();

  return {
    priceBreakdown,
    totalPrice,
    updatePriceBreakdown,
    clearPriceBreakdown,
  };
};

// UI helpers
export const useModal = () => {
  const { openModal, closeModal, closeAllModals } = useUIStore();
  return { openModal, closeModal, closeAllModals };
};

export const useToast = () => {
  const { showToast, hideToast, clearToasts } = useUIStore();
  return { showToast, hideToast, clearToasts };
};

export const useSidebar = () => {
  const {
    sidebarOpen,
    sidebarCollapsed,
    toggleSidebar,
    setSidebarOpen,
    toggleSidebarCollapse,
    setSidebarCollapsed,
  } = useUIStore();

  return {
    sidebarOpen,
    sidebarCollapsed,
    toggleSidebar,
    setSidebarOpen,
    toggleSidebarCollapse,
    setSidebarCollapsed,
  };
};

export const useTheme = () => {
  const { theme, setTheme, toggleTheme } = useUIStore();
  return { theme, setTheme, toggleTheme };
};

export const useMobileMenu = () => {
  const { mobileMenuOpen, toggleMobileMenu, setMobileMenuOpen } = useUIStore();

  return {
    mobileMenuOpen,
    toggleMobileMenu,
    setMobileMenuOpen,
  };
};

export const useSearch = () => {
  const {
    searchQuery,
    searchFiltersOpen,
    setSearchQuery,
    toggleSearchFilters,
    setSearchFiltersOpen,
  } = useUIStore();

  return {
    searchQuery,
    searchFiltersOpen,
    setSearchQuery,
    toggleSearchFilters,
    setSearchFiltersOpen,
  };
};

// Loading state helpers
export const useGlobalLoading = () => {
  const { globalLoading, setGlobalLoading } = useUIStore();
  return { globalLoading, setGlobalLoading };
};

export const usePageLoading = () => {
  const { pageLoading, setPageLoading } = useUIStore();
  return { pageLoading, setPageLoading };
};

// User preferences helpers
export const useUserPreferences = () => {
  const {
    currency,
    language,
    dateFormat,
    setCurrency,
    setLanguage,
    setDateFormat,
  } = useUIStore();

  return {
    currency,
    language,
    dateFormat,
    setCurrency,
    setLanguage,
    setDateFormat,
  };
};
