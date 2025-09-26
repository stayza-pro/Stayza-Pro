import { create } from "zustand";
import { Property, BookingFormData } from "../types";

export interface BookingStep {
  id: number;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
}

interface BookingState {
  // Current booking flow
  selectedProperty: Property | null;
  bookingData: Partial<BookingFormData>;
  currentStep: number;
  totalSteps: number;
  steps: BookingStep[];

  // Pricing calculation
  totalPrice: number;
  priceBreakdown: {
    subtotal: number;
    taxes: number;
    fees: number;
    total: number;
    currency: string;
    nights: number;
  } | null;

  // Availability checking
  isCheckingAvailability: boolean;
  availabilityError: string | null;

  // UI state
  isLoading: boolean;
  error: string | null;
}

interface BookingActions {
  // Property selection
  selectProperty: (property: Property) => void;
  clearSelectedProperty: () => void;

  // Booking data management
  updateBookingData: (data: Partial<BookingFormData>) => void;
  clearBookingData: () => void;

  // Step management
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  completeStep: (step: number) => void;

  // Price calculation
  updatePriceBreakdown: (breakdown: BookingState["priceBreakdown"]) => void;
  clearPriceBreakdown: () => void;

  // Availability
  setAvailabilityCheck: (isChecking: boolean) => void;
  setAvailabilityError: (error: string | null) => void;

  // General state
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Reset entire booking flow
  resetBookingFlow: () => void;
}

const defaultSteps: BookingStep[] = [
  {
    id: 1,
    title: "Dates & Guests",
    description: "Select check-in/out dates and number of guests",
    isCompleted: false,
    isActive: true,
  },
  {
    id: 2,
    title: "Guest Details",
    description: "Provide guest information and special requests",
    isCompleted: false,
    isActive: false,
  },
  {
    id: 3,
    title: "Payment",
    description: "Review booking and complete payment",
    isCompleted: false,
    isActive: false,
  },
  {
    id: 4,
    title: "Confirmation",
    description: "Booking confirmed!",
    isCompleted: false,
    isActive: false,
  },
];

export const useBookingStore = create<BookingState & BookingActions>(
  (set, get) => ({
    // Initial state
    selectedProperty: null,
    bookingData: {},
    currentStep: 1,
    totalSteps: defaultSteps.length,
    steps: [...defaultSteps],
    totalPrice: 0,
    priceBreakdown: null,
    isCheckingAvailability: false,
    availabilityError: null,
    isLoading: false,
    error: null,

    // Actions
    selectProperty: (property: Property) => {
      set({
        selectedProperty: property,
        bookingData: {
          propertyId: property.id,
        },
      });
    },

    clearSelectedProperty: () => {
      set({
        selectedProperty: null,
        bookingData: {},
        priceBreakdown: null,
      });
    },

    updateBookingData: (data: Partial<BookingFormData>) => {
      const { bookingData } = get();
      set({
        bookingData: { ...bookingData, ...data },
      });
    },

    clearBookingData: () => {
      set({
        bookingData: {},
        priceBreakdown: null,
      });
    },

    nextStep: () => {
      const { currentStep, totalSteps, steps } = get();
      if (currentStep < totalSteps) {
        const newStep = currentStep + 1;
        const updatedSteps = steps.map((step) => ({
          ...step,
          isActive: step.id === newStep,
          isCompleted: step.id < newStep,
        }));

        set({
          currentStep: newStep,
          steps: updatedSteps,
        });
      }
    },

    previousStep: () => {
      const { currentStep, steps } = get();
      if (currentStep > 1) {
        const newStep = currentStep - 1;
        const updatedSteps = steps.map((step) => ({
          ...step,
          isActive: step.id === newStep,
          isCompleted: step.id < newStep,
        }));

        set({
          currentStep: newStep,
          steps: updatedSteps,
        });
      }
    },

    goToStep: (step: number) => {
      const { totalSteps, steps } = get();
      if (step >= 1 && step <= totalSteps) {
        const updatedSteps = steps.map((s) => ({
          ...s,
          isActive: s.id === step,
          isCompleted: s.id < step,
        }));

        set({
          currentStep: step,
          steps: updatedSteps,
        });
      }
    },

    completeStep: (step: number) => {
      const { steps } = get();
      const updatedSteps = steps.map((s) => ({
        ...s,
        isCompleted: s.id <= step,
      }));

      set({
        steps: updatedSteps,
      });
    },

    updatePriceBreakdown: (breakdown) => {
      set({
        priceBreakdown: breakdown,
        totalPrice: breakdown?.total || 0,
      });
    },

    clearPriceBreakdown: () => {
      set({
        priceBreakdown: null,
        totalPrice: 0,
      });
    },

    setAvailabilityCheck: (isChecking: boolean) => {
      set({
        isCheckingAvailability: isChecking,
      });
    },

    setAvailabilityError: (error: string | null) => {
      set({
        availabilityError: error,
      });
    },

    setLoading: (loading: boolean) => {
      set({
        isLoading: loading,
      });
    },

    setError: (error: string | null) => {
      set({
        error,
      });
    },

    clearError: () => {
      set({
        error: null,
        availabilityError: null,
      });
    },

    resetBookingFlow: () => {
      set({
        selectedProperty: null,
        bookingData: {},
        currentStep: 1,
        steps: [...defaultSteps],
        totalPrice: 0,
        priceBreakdown: null,
        isCheckingAvailability: false,
        availabilityError: null,
        isLoading: false,
        error: null,
      });
    },
  })
);
