import { PaymentStatus } from "@prisma/client";

export const PAYMENT_CONFIRMED_STATUSES = new Set<PaymentStatus>([
  PaymentStatus.HELD,
  PaymentStatus.PARTIALLY_RELEASED,
  PaymentStatus.SETTLED,
]);

export const BLOCKED_DATES_MARKER = "[SYSTEM_BLOCKED_DATES]";
export const LEGACY_BLOCKED_DATES_MARKER = "SYSTEM:BLOCKED_DATES";

export const isBlockedDatesSpecialRequest = (
  specialRequests?: string | null
): boolean => {
  if (!specialRequests || typeof specialRequests !== "string") {
    return false;
  }

  return (
    specialRequests.includes(BLOCKED_DATES_MARKER) ||
    specialRequests.includes(LEGACY_BLOCKED_DATES_MARKER)
  );
};

export const buildBlockedDatesSpecialRequest = (reason: string): string =>
  `${BLOCKED_DATES_MARKER} ${reason}`.trim();

export const isBookingPaymentConfirmed = (
  paymentStatus?: PaymentStatus | null,
  bookingPaymentStatus?: PaymentStatus | null
): boolean => {
  if (paymentStatus && PAYMENT_CONFIRMED_STATUSES.has(paymentStatus)) {
    return true;
  }

  if (
    bookingPaymentStatus &&
    PAYMENT_CONFIRMED_STATUSES.has(bookingPaymentStatus)
  ) {
    return true;
  }

  return false;
};

export const buildBookingVerificationCode = (bookingId: string): string => {
  return `STZ-${bookingId}`;
};

type AccessControlledProperty = {
  address?: string | null;
  accessInstructions?: string | null;
  wifiName?: string | null;
  wifiPassword?: string | null;
  parkingInstructions?: string | null;
  realtor?: {
    businessEmail?: string | null;
    user?: {
      email?: string | null;
    } | null;
  } | null;
};

type AccessControlledBooking = {
  id?: string;
  payment?: {
    status?: PaymentStatus | null;
  } | null;
  paymentStatus?: PaymentStatus | null;
  property?: AccessControlledProperty | null;
};

export const applyGuestBookingAccessControl = <T extends AccessControlledBooking>(
  booking: T,
  isGuestOwner: boolean
): T & {
  sensitiveDetailsUnlocked: boolean;
  hasVerifiedArtifact: boolean;
  bookingVerificationCode: string;
} => {
  const sensitiveDetailsUnlocked = isBookingPaymentConfirmed(
    booking?.payment?.status ?? null,
    booking?.paymentStatus ?? null
  );

  const payload: T & {
    sensitiveDetailsUnlocked: boolean;
    hasVerifiedArtifact: boolean;
    bookingVerificationCode: string;
  } = {
    ...booking,
    sensitiveDetailsUnlocked,
    hasVerifiedArtifact: sensitiveDetailsUnlocked,
    bookingVerificationCode: buildBookingVerificationCode(
      String(booking?.id || "")
    ),
  };

  if (!isGuestOwner || sensitiveDetailsUnlocked || !payload.property) {
    return payload;
  }

  payload.property = {
    ...payload.property,
    address: null,
    accessInstructions: null,
    wifiName: null,
    wifiPassword: null,
    parkingInstructions: null,
  };

  if (payload.property.realtor) {
    payload.property.realtor = {
      ...payload.property.realtor,
      businessEmail: null,
    };

    if (payload.property.realtor.user) {
      payload.property.realtor.user = {
        ...payload.property.realtor.user,
        email: null,
      };
    }
  }

  return payload;
};
