/* eslint-disable @next/next/no-img-element */
import { render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { BookingConfirmation } from "@/components/booking/BookingConfirmation";
import { BookingDetails } from "@/components/booking/BookingDetails";
import type { Booking } from "@/types";

jest.mock("next/image", () => ({
  __esModule: true,
  default: (
    props: ComponentProps<"img"> & {
      unoptimized?: boolean;
      fill?: boolean;
    }
  ) => {
    const sanitizedProps = { ...props } as Record<string, unknown>;
    delete sanitizedProps.unoptimized;
    delete sanitizedProps.fill;
    return <img alt={String(props.alt || "")} {...sanitizedProps} />;
  },
}));

const baseBooking: Booking = {
  id: "booking-001",
  propertyId: "property-001",
  guestId: "guest-001",
  checkInDate: "2026-03-10",
  checkOutDate: "2026-03-12",
  totalGuests: 2,
  totalPrice: 50000,
  currency: "NGN",
  status: "PENDING",
  paymentStatus: "INITIATED",
  createdAt: new Date("2026-02-01"),
  updatedAt: new Date("2026-02-01"),
  sensitiveDetailsUnlocked: false,
  property: {
    id: "property-001",
    realtorId: "realtor-001",
    title: "Ocean View",
    description: "Great place",
    type: "APARTMENT",
    pricePerNight: 25000,
    currency: "NGN",
    maxGuests: 4,
    bedrooms: 2,
    bathrooms: 2,
    address: "11 Beach Road",
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    amenities: [],
    houseRules: [],
    checkInTime: "14:00",
    checkOutTime: "11:00",
    isActive: true,
    isApproved: true,
    status: "ACTIVE",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    images: [{ id: "img-1", propertyId: "property-001", url: "/x.jpg", order: 0, createdAt: new Date() }],
  },
};

describe("Booking sensitive details gating", () => {
  it("hides exact address and disables contact when booking is still locked", () => {
    render(
      <BookingDetails
        booking={baseBooking}
        viewType="guest"
        onContactUser={() => {}}
      />
    );

    expect(
      screen.getByText(/exact address unlocks after payment/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /contact/i })
    ).toBeDisabled();
  });

  it("shows masked address copy in confirmation when booking is not unlocked", () => {
    render(<BookingConfirmation booking={baseBooking} />);

    expect(
      screen.getByText(/address unlocks after payment/i)
    ).toBeInTheDocument();
  });
});
