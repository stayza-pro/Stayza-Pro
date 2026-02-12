import {
  dedupeSavedPaymentMethods,
  extractPaystackAuthorization,
} from "./savedPaymentMethods";

describe("savedPaymentMethods", () => {
  it("extracts authorization details from providerResponse", () => {
    const details = extractPaystackAuthorization({
      providerResponse: {
        authorization: {
          authorization_code: "AUTH_123",
          signature: "SIG_123",
          reusable: true,
          last4: "4242",
          brand: "visa",
          exp_month: "01",
          exp_year: "2030",
          bank: "test-bank",
        },
      },
    });

    expect(details.authorizationCode).toBe("AUTH_123");
    expect(details.signature).toBe("SIG_123");
    expect(details.last4).toBe("4242");
    expect(details.brand).toBe("visa");
    expect(details.reusable).toBe(true);
  });

  it("deduplicates saved methods by signature and skips non-reusable entries", () => {
    const now = new Date();
    const methods = dedupeSavedPaymentMethods([
      {
        id: "pay-1",
        createdAt: now,
        metadata: {
          providerResponse: {
            authorization: {
              authorization_code: "AUTH_A",
              signature: "SIG_A",
              reusable: true,
              last4: "1111",
            },
          },
        },
      },
      {
        id: "pay-2",
        createdAt: new Date(now.getTime() - 1000),
        metadata: {
          providerResponse: {
            authorization: {
              authorization_code: "AUTH_B",
              signature: "SIG_A",
              reusable: true,
              last4: "1111",
            },
          },
        },
      },
      {
        id: "pay-3",
        createdAt: new Date(now.getTime() - 2000),
        metadata: {
          providerResponse: {
            authorization: {
              authorization_code: "AUTH_C",
              signature: "SIG_C",
              reusable: false,
              last4: "2222",
            },
          },
        },
      },
    ]);

    expect(methods).toHaveLength(1);
    expect(methods[0].methodId).toBe("pay-1");
    expect(methods[0].last4).toBe("1111");
  });
});
