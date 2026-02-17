import { create } from "zustand";

interface Modal {
  id: string;
  isOpen: boolean;
  title?: string;
  content?: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  closable?: boolean;
  onClose?: () => void;
}

interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
  duration?: number;
  isVisible: boolean;
}

interface UIState {
  // Theme
  theme: "light" | "dark" | "system";

  // Modals
  modals: Modal[];

  // Toasts/Notifications
  toasts: Toast[];

  // Sidebar (for dashboards)
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;

  // Loading states
  globalLoading: boolean;
  pageLoading: boolean;

  // Search
  searchQuery: string;
  searchFiltersOpen: boolean;

  // Mobile menu
  mobileMenuOpen: boolean;

  // Property filters drawer (mobile)
  filtersDrawerOpen: boolean;

  // User preferences
  currency: string;
  language: string;
  dateFormat: string;
}

interface UIActions {
  // Theme
  setTheme: (theme: UIState["theme"]) => void;
  toggleTheme: () => void;

  // Modals
  openModal: (modal: Omit<Modal, "isOpen">) => void;
  closeModal: (id: string) => void;
  closeAllModals: () => void;

  // Toasts
  showToast: (toast: Omit<Toast, "id" | "isVisible">) => void;
  hideToast: (id: string) => void;
  clearToasts: () => void;

  // Sidebar
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebarCollapse: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Loading
  setGlobalLoading: (loading: boolean) => void;
  setPageLoading: (loading: boolean) => void;

  // Search
  setSearchQuery: (query: string) => void;
  toggleSearchFilters: () => void;
  setSearchFiltersOpen: (open: boolean) => void;

  // Mobile menu
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;

  // Filters drawer
  toggleFiltersDrawer: () => void;
  setFiltersDrawerOpen: (open: boolean) => void;

  // User preferences
  setCurrency: (currency: string) => void;
  setLanguage: (language: string) => void;
  setDateFormat: (format: string) => void;

  // Utility
  resetUI: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useUIStore = create<UIState & UIActions>((set, get) => ({
  // Initial state
  theme: "system",
  modals: [],
  toasts: [],
  sidebarOpen: true,
  sidebarCollapsed: false,
  globalLoading: false,
  pageLoading: false,
  searchQuery: "",
  searchFiltersOpen: false,
  mobileMenuOpen: false,
  filtersDrawerOpen: false,
  currency: "NGN",
  language: "en",
  dateFormat: "MM/dd/yyyy",

  // Actions
  setTheme: (theme) => {
    set({ theme });
  },

  toggleTheme: () => {
    const { theme } = get();
    const newTheme =
      theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
    set({ theme: newTheme });
  },

  openModal: (modalData) => {
    const { modals } = get();
    const newModal: Modal = {
      ...modalData,
      isOpen: true,
      size: modalData.size || "md",
      closable: modalData.closable !== false,
    };

    set({
      modals: [...modals, newModal],
    });
  },

  closeModal: (id) => {
    const { modals } = get();
    const modal = modals.find((m) => m.id === id);

    if (modal?.onClose) {
      modal.onClose();
    }

    set({
      modals: modals.filter((m) => m.id !== id),
    });
  },

  closeAllModals: () => {
    const { modals } = get();
    modals.forEach((modal) => {
      if (modal.onClose) {
        modal.onClose();
      }
    });

    set({ modals: [] });
  },

  showToast: (toastData) => {
    const { toasts } = get();
    const newToast: Toast = {
      ...toastData,
      id: generateId(),
      isVisible: true,
      duration: toastData.duration ?? 5000,
    };

    set({
      toasts: [...toasts, newToast],
    });

    // Auto hide toast after duration
    if ((newToast.duration ?? 0) > 0) {
      setTimeout(() => {
        get().hideToast(newToast.id);
      }, newToast.duration!);
    }
  },

  hideToast: (id) => {
    const { toasts } = get();
    set({
      toasts: toasts.filter((t) => t.id !== id),
    });
  },

  clearToasts: () => {
    set({ toasts: [] });
  },

  toggleSidebar: () => {
    const { sidebarOpen } = get();
    set({ sidebarOpen: !sidebarOpen });
  },

  setSidebarOpen: (open) => {
    set({ sidebarOpen: open });
  },

  toggleSidebarCollapse: () => {
    const { sidebarCollapsed } = get();
    set({ sidebarCollapsed: !sidebarCollapsed });
  },

  setSidebarCollapsed: (collapsed) => {
    set({ sidebarCollapsed: collapsed });
  },

  setGlobalLoading: (loading) => {
    set({ globalLoading: loading });
  },

  setPageLoading: (loading) => {
    set({ pageLoading: loading });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  toggleSearchFilters: () => {
    const { searchFiltersOpen } = get();
    set({ searchFiltersOpen: !searchFiltersOpen });
  },

  setSearchFiltersOpen: (open) => {
    set({ searchFiltersOpen: open });
  },

  toggleMobileMenu: () => {
    const { mobileMenuOpen } = get();
    set({ mobileMenuOpen: !mobileMenuOpen });
  },

  setMobileMenuOpen: (open) => {
    set({ mobileMenuOpen: open });
  },

  toggleFiltersDrawer: () => {
    const { filtersDrawerOpen } = get();
    set({ filtersDrawerOpen: !filtersDrawerOpen });
  },

  setFiltersDrawerOpen: (open) => {
    set({ filtersDrawerOpen: open });
  },

  setCurrency: (currency) => {
    set({ currency });
  },

  setLanguage: (language) => {
    set({ language });
  },

  setDateFormat: (format) => {
    set({ dateFormat: format });
  },

  resetUI: () => {
    set({
      modals: [],
      toasts: [],
      sidebarOpen: true,
      sidebarCollapsed: false,
      globalLoading: false,
      pageLoading: false,
      searchQuery: "",
      searchFiltersOpen: false,
      mobileMenuOpen: false,
      filtersDrawerOpen: false,
    });
  },
}));
