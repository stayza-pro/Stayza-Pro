import { buildApprovedRealtorUpdate } from "./realtorApproval";

describe("buildApprovedRealtorUpdate", () => {
  it("always approves both realtor and CAC statuses", () => {
    const updateData = buildApprovedRealtorUpdate({
      status: "REJECTED",
      cacStatus: "PENDING",
    });

    expect(updateData.status).toBe("APPROVED");
    expect(updateData.cacStatus).toBe("APPROVED");
    expect(updateData.cacVerifiedAt).toBeInstanceOf(Date);
    expect(updateData.cacRejectedAt).toBeNull();
    expect(updateData.cacRejectionReason).toBeNull();
  });

  it("keeps extra fields needed by reinstate flow", () => {
    const updateData = buildApprovedRealtorUpdate({
      isActive: true,
      suspendedAt: null,
    });

    expect(updateData.isActive).toBe(true);
    expect(updateData.suspendedAt).toBeNull();
    expect(updateData.status).toBe("APPROVED");
    expect(updateData.cacStatus).toBe("APPROVED");
  });
});
