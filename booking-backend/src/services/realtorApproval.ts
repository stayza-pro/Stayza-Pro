import { Prisma } from "@prisma/client";

export const buildApprovedRealtorUpdate = (
  overrides: Prisma.RealtorUpdateInput = {},
): Prisma.RealtorUpdateInput => ({
  ...overrides,
  status: "APPROVED",
  cacStatus: "APPROVED",
  cacVerifiedAt: new Date(),
  cacRejectedAt: null,
  cacRejectionReason: null,
  canAppeal: true,
});
