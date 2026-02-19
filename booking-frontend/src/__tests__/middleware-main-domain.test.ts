import { isAllowedMainDomainPath } from "@/lib/mainDomainRoutes";

describe("main-domain route guard", () => {
  it("allows marketing/admin plus guest/auth/booking paths", () => {
    expect(isAllowedMainDomainPath("/")).toBe(true);
    expect(isAllowedMainDomainPath("/en")).toBe(true);
    expect(isAllowedMainDomainPath("/how-it-works")).toBe(true);
    expect(isAllowedMainDomainPath("/admin/login")).toBe(true);
    expect(isAllowedMainDomainPath("/verify-email")).toBe(true);
    expect(isAllowedMainDomainPath("/guest/login")).toBe(true);
    expect(isAllowedMainDomainPath("/guest/register")).toBe(true);
    expect(isAllowedMainDomainPath("/guest/bookings")).toBe(true);
    expect(isAllowedMainDomainPath("/booking/cml123/checkout")).toBe(true);
    expect(isAllowedMainDomainPath("/auth/verify-otp")).toBe(true);
  });

  it("blocks unsupported app paths on main domain", () => {
    expect(isAllowedMainDomainPath("/realtor/dashboard")).toBe(false);
    expect(isAllowedMainDomainPath("/settings")).toBe(false);
    expect(isAllowedMainDomainPath("/foo/bar")).toBe(false);
  });
});
