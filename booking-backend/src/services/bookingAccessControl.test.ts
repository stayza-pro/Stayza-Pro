import { PaymentStatus } from "@prisma/client";
import {
  applyGuestBookingAccessControl,
  buildBlockedDatesSpecialRequest,
  buildBookingVerificationCode,
  isBlockedDatesSpecialRequest,
  isBookingPaymentConfirmed,
} from "./bookingAccessControl";

describe("bookingAccessControl", () => {
  it("detects confirmed payment statuses", () => {
    expect(isBookingPaymentConfirmed(PaymentStatus.HELD, null)).toBe(true);
    expect(
      isBookingPaymentConfirmed(null, PaymentStatus.PARTIALLY_RELEASED)
    ).toBe(true);
    expect(isBookingPaymentConfirmed(PaymentStatus.SETTLED, null)).toBe(true);
    expect(isBookingPaymentConfirmed(PaymentStatus.INITIATED, null)).toBe(
      false
    );
  });

  it("redacts sensitive fields for guest owner when payment is not confirmed", () => {
    const booking = {
      id: "booking-123",
      paymentStatus: PaymentStatus.INITIATED,
      payment: { status: PaymentStatus.INITIATED },
      property: {
        address: "11 Beach Road",
        accessInstructions: "Gate code 1122",
        wifiName: "StayzaWifi",
        wifiPassword: "secret",
        parkingInstructions: "B2 slot",
        realtor: {
          businessEmail: "host@example.com",
          user: {
            email: "owner@example.com",
          },
        },
      },
    };

    const masked = applyGuestBookingAccessControl(booking, true);

    expect(masked.sensitiveDetailsUnlocked).toBe(false);
    expect(masked.hasVerifiedArtifact).toBe(false);
    expect(masked.bookingVerificationCode).toBe("STZ-booking-123");
    expect(masked.property.address).toBeNull();
    expect(masked.property.accessInstructions).toBeNull();
    expect(masked.property.wifiName).toBeNull();
    expect(masked.property.wifiPassword).toBeNull();
    expect(masked.property.parkingInstructions).toBeNull();
    expect(masked.property.realtor.businessEmail).toBeNull();
    expect(masked.property.realtor.user.email).toBeNull();
  });

  it("keeps sensitive fields when payment is confirmed", () => {
    const booking = {
      id: "booking-456",
      paymentStatus: PaymentStatus.HELD,
      payment: { status: PaymentStatus.HELD },
      property: {
        address: "22 Marina",
      },
    };

    const unlocked = applyGuestBookingAccessControl(booking, true);
    expect(unlocked.sensitiveDetailsUnlocked).toBe(true);
    expect(unlocked.property.address).toBe("22 Marina");
  });

  it("builds deterministic verification codes", () => {
    expect(buildBookingVerificationCode("abc123")).toBe("STZ-abc123");
  });

  it("detects blocked-date markers with compatibility support", () => {
    expect(
      isBlockedDatesSpecialRequest("[SYSTEM_BLOCKED_DATES] maintenance")
    ).toBe(true);
    expect(
      isBlockedDatesSpecialRequest("SYSTEM:BLOCKED_DATES maintenance")
    ).toBe(true);
    expect(isBlockedDatesSpecialRequest("guest request")).toBe(false);
  });

  it("builds canonical blocked-date marker values", () => {
    expect(buildBlockedDatesSpecialRequest("maintenance")).toBe(
      "[SYSTEM_BLOCKED_DATES] maintenance"
    );
  });
});
