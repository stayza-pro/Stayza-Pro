import getRequestConfig, { getMessagesForLocale } from "@/i18n/request";

describe("i18n request config", () => {
  it("returns configured locale messages for supported locales", async () => {
    const config = await getRequestConfig("fr");

    expect(config.locale).toBe("fr");
    expect((config.messages as any).navigation.home).toBeDefined();
  });

  it("falls back to default messages for unknown locales", async () => {
    const config = await getRequestConfig("de");

    expect(config.locale).toBe("en");
    expect((config.messages as any).navigation.home).toBe("Home");
  });

  it("exposes synchronous helper for locale lookup", () => {
    const ptMessages = getMessagesForLocale("pt");
    const fallbackMessages = getMessagesForLocale("zz");

    expect((ptMessages as any).navigation.home).toBeDefined();
    expect((fallbackMessages as any).navigation.home).toBe("Home");
  });
});
