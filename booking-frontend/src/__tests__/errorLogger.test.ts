describe("errorLogger", () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
    } as Response);
  });

  afterEach(() => {
    process.env = originalEnv;
    global.fetch = originalFetch;
    delete (window as Window & { posthog?: unknown }).posthog;
    delete (window as Window & { va?: unknown }).va;
    jest.clearAllMocks();
  });

  it("captures frontend log events in analytics clients", async () => {
    const posthogCapture = jest.fn();
    const vercelTrack = jest.fn();
    (window as Window & { posthog?: unknown }).posthog = {
      capture: posthogCapture,
    };
    (window as Window & { va?: unknown }).va = {
      track: vercelTrack,
    };

    const { logInfo, trackAction } = await import("@/utils/errorLogger");

    logInfo("hello");
    trackAction("clicked_button", "booking", { surface: "checkout" });

    expect(posthogCapture).toHaveBeenCalledWith(
      "frontend_info",
      expect.objectContaining({ message: "hello" })
    );
    expect(vercelTrack).toHaveBeenCalledWith(
      "action_booking",
      expect.objectContaining({ action: "clicked_button" })
    );
  });

  it("sends logs to configured endpoint", async () => {
    process.env.NEXT_PUBLIC_CLIENT_LOG_ENDPOINT = "https://logs.example.com";
    const { logWarning } = await import("@/utils/errorLogger");

    logWarning("warn message", { component: "TestComponent" });

    expect(global.fetch).toHaveBeenCalledWith(
      "https://logs.example.com",
      expect.objectContaining({
        method: "POST",
      })
    );
  });

  it("sets and clears user context in analytics clients", async () => {
    const identify = jest.fn();
    const reset = jest.fn();
    (window as Window & { posthog?: unknown }).posthog = {
      identify,
      reset,
    };

    const { setUserContext, clearUserContext, logError } = await import(
      "@/utils/errorLogger"
    );

    setUserContext("user-1", "user@example.com", "realtor");
    logError(new Error("boom"));
    clearUserContext();

    expect(identify).toHaveBeenCalledWith("user-1", {
      email: "user@example.com",
      role: "realtor",
    });
    expect(reset).toHaveBeenCalled();
  });
});
