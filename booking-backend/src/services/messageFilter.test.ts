import { MessageFilterService } from "./messageFilter";

describe("MessageFilterService", () => {
  it("sanitizes contact details and social handles", () => {
    const result = MessageFilterService.filterMessage(
      "Reach me at john@example.com, +2348012345678 and @johnhost"
    );

    expect(result.isBlocked).toBe(true);
    expect(result.violations).toEqual(
      expect.arrayContaining(["email_address", "phone_number", "social_handle"])
    );
    expect(result.filteredContent).toContain("[EMAIL REMOVED]");
    expect(result.filteredContent).toContain("[PHONE NUMBER REMOVED]");
    expect(result.filteredContent).toContain("[HANDLE REMOVED]");
  });

  it("blocks direct external payment attempts", () => {
    const result = MessageFilterService.filterMessage(
      "Please pay cash directly outside the platform"
    );

    expect(result.isBlocked).toBe(true);
    expect(result.violations).toContain("external_payment");
  });

  it("restricts messaging after 48h post-checkout", () => {
    const oldCheckout = new Date(Date.now() - 49 * 60 * 60 * 1000);
    const eligibility = MessageFilterService.canSendMessage({
      hasBooking: true,
      bookingStatus: "COMPLETED",
      checkoutDate: oldCheckout,
    });

    expect(eligibility.allowed).toBe(false);
    expect(eligibility.reason).toMatch(/48 hours/i);
  });
});
