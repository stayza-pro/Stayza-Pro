import { DEFAULT_FINANCE_CONFIG } from "./financeConfig";
import { computeGuestServiceFee } from "./pricingEngine";

describe("pricingEngine service fee cap triggers", () => {
  it("does not apply stayza cap below configured trigger", () => {
    const result = computeGuestServiceFee(133332, "LOCAL", DEFAULT_FINANCE_CONFIG);

    expect(result.stayzaCapApplied).toBe(false);
    expect(result.stayza).toBeCloseTo(1433.32, 2);
  });

  it("applies stayza cap once trigger is reached", () => {
    const result = computeGuestServiceFee(133333, "LOCAL", DEFAULT_FINANCE_CONFIG);

    expect(result.stayzaCapApplied).toBe(true);
    expect(result.stayza).toBe(1433);
  });

  it("applies local processing cap only after trigger and when variable exceeds cap", () => {
    const result = computeGuestServiceFee(200000, "LOCAL", DEFAULT_FINANCE_CONFIG);

    expect(result.processingCapApplied).toBe(true);
    expect(result.processing).toBe(2100);
  });

  it("keeps international processing uncapped", () => {
    const result = computeGuestServiceFee(
      500000,
      "INTERNATIONAL",
      DEFAULT_FINANCE_CONFIG
    );

    expect(result.processingCapApplied).toBe(false);
    expect(result.processing).toBeGreaterThan(19000);
  });
});
