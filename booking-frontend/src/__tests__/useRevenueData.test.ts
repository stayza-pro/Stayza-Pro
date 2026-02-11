import { renderHook, waitFor } from "@testing-library/react";
import { useRevenueData } from "@/hooks/useRevenueData";

const mockedUseAuthStore = jest.fn();
const mockedLogError = jest.fn();

jest.mock("@/store/authStore", () => ({
  useAuthStore: () => mockedUseAuthStore(),
}));

jest.mock("@/utils/errorLogger", () => ({
  logError: (...args: unknown[]) => mockedLogError(...args),
}));

describe("useRevenueData", () => {
  const originalFetch = global.fetch;
  const originalEnv = process.env;

  beforeEach(() => {
    mockedUseAuthStore.mockReset();
    mockedLogError.mockReset();
    global.fetch = jest.fn();
    process.env = { ...originalEnv, NEXT_PUBLIC_API_URL: "https://api.test" };
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env = originalEnv;
  });

  it("returns auth error when no access token exists", async () => {
    mockedUseAuthStore.mockReturnValue({ accessToken: null });

    const { result } = renderHook(() => useRevenueData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Sign in to view revenue analytics");
    expect(result.current.data).toEqual([]);
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("loads revenue data successfully", async () => {
    mockedUseAuthStore.mockReturnValue({ accessToken: "token-123" });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{ period: "Jan", amount: 200, date: "2026-01-01" }],
        totalRevenue: 200,
        periodChange: { value: 10, type: "increase" },
      }),
    });

    const { result } = renderHook(() => useRevenueData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.totalRevenue).toBe(200);
    expect(result.current.data).toHaveLength(1);
  });

  it("reports failures and resets values", async () => {
    mockedUseAuthStore.mockReturnValue({ accessToken: "token-123" });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => "bad gateway",
    });

    const { result } = renderHook(() => useRevenueData());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe("Failed to load revenue data");
    expect(result.current.data).toEqual([]);
    expect(result.current.totalRevenue).toBe(0);
    expect(mockedLogError).toHaveBeenCalled();
  });
});
