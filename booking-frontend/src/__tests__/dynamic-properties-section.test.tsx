import { act, render, screen, waitFor } from "@testing-library/react";
import { DynamicPropertiesSection } from "@/components/guest/sections/DynamicPropertiesSection";
import { apiClient } from "@/services/api";

jest.mock("@/services/api", () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

const mockGet = apiClient.get as jest.Mock;

const activeProperty = {
  id: "prop-1",
  realtorId: "realtor-1",
  title: "Ocean View Apartment",
  description: "A clean apartment",
  type: "APARTMENT",
  pricePerNight: 50000,
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
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  images: [],
};

describe("DynamicPropertiesSection", () => {
  beforeEach(() => {
    mockGet.mockReset();
  });

  it("calls backend with location and date filters when search is triggered", async () => {
    mockGet
      .mockResolvedValueOnce({
        data: [activeProperty],
      })
      .mockResolvedValueOnce({
        data: [activeProperty],
      });

    render(
      <DynamicPropertiesSection
        primaryColor="#111827"
        secondaryColor="#047857"
        accentColor="#f97316"
        realtorId="realtor-1"
      />
    );

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith("/properties/host/realtor-1");
    });

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent("propertySearch", {
          detail: {
            location: "Lagos",
            checkIn: "2026-03-10",
            checkOut: "2026-03-13",
          },
        })
      );
    });

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledTimes(2);
    });

    const filteredCall = String(mockGet.mock.calls[1][0]);
    expect(filteredCall).toContain("/properties/host/realtor-1?");
    expect(filteredCall).toContain("location=Lagos");
    expect(filteredCall).toContain("checkIn=2026-03-10");
    expect(filteredCall).toContain("checkOut=2026-03-13");

    expect(
      screen.getByText(/Found 1 property matching your search/i)
    ).toBeInTheDocument();
  });

  it("shows a fallback warning when filtered fetch fails", async () => {
    mockGet
      .mockResolvedValueOnce({
        data: [activeProperty],
      })
      .mockRejectedValueOnce(new Error("Network down"));

    render(
      <DynamicPropertiesSection
        primaryColor="#111827"
        secondaryColor="#047857"
        accentColor="#f97316"
        realtorId="realtor-1"
      />
    );

    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith("/properties/host/realtor-1");
    });

    await act(async () => {
      window.dispatchEvent(
        new CustomEvent("propertySearch", {
          detail: {
            location: "Lagos",
            checkIn: "2026-04-01",
            checkOut: "2026-04-05",
          },
        })
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          /We could not apply all filters right now\. Showing locally filtered results\./i
        )
      ).toBeInTheDocument();
    });
  });
});
