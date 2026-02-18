import { isAllowedMainDomainPath } from "@/lib/mainDomainRoutes";

describe("main-domain route guard", () => {
  it("allows marketing/admin and auth utility paths", () => {
    expect(isAllowedMainDomainPath("/")).toBe(true);
    expect(isAllowedMainDomainPath("/en")).toBe(true);
    expect(isAllowedMainDomainPath("/how-it-works")).toBe(true);
    expect(isAllowedMainDomainPath("/admin/login")).toBe(true);
    expect(isAllowedMainDomainPath("/verify-email")).toBe(true);
    expect(isAllowedMainDomainPath("/auth/verify-otp")).toBe(true);
  });

  it("blocks non-marketing/non-admin app paths on main domain", () => {
    expect(isAllowedMainDomainPath("/guest/browse")).toBe(false);
    expect(isAllowedMainDomainPath("/booking/cml123/checkout")).toBe(false);
    expect(isAllowedMainDomainPath("/realtor/dashboard")).toBe(false);
    expect(isAllowedMainDomainPath("/guest/bookings")).toBe(false);
  });
});
