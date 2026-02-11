import { withRetry } from "./retry";

describe("withRetry", () => {
  it("retries retryable failures and eventually succeeds", async () => {
    let attempts = 0;

    const result = await withRetry(
      async () => {
        attempts += 1;
        if (attempts < 3) {
          const error = new Error("temporary timeout");
          (error as Error & { code?: string }).code = "ETIMEDOUT";
          throw error;
        }
        return "ok";
      },
      "retryable-operation",
      { maxRetries: 3, initialDelayMs: 1, maxDelayMs: 2 }
    );

    expect(result).toBe("ok");
    expect(attempts).toBe(3);
  });

  it("does not retry non-retryable failures", async () => {
    let attempts = 0;

    await expect(
      withRetry(
        async () => {
          attempts += 1;
          throw new Error("validation failed");
        },
        "non-retryable-operation",
        { maxRetries: 3, initialDelayMs: 1, maxDelayMs: 2 }
      )
    ).rejects.toThrow("validation failed");

    expect(attempts).toBe(1);
  });
});
