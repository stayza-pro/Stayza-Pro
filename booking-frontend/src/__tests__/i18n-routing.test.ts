import {
  defaultLocale,
  getLocaleFromPathname,
  localizePath,
  normalizeLocale,
  stripLocalePrefix,
} from "@/i18n/routing";

describe("i18n routing utilities", () => {
  it("normalizes known and unknown locales", () => {
    expect(normalizeLocale("fr")).toBe("fr");
    expect(normalizeLocale("pt")).toBe("pt");
    expect(normalizeLocale("unknown")).toBe(defaultLocale);
    expect(normalizeLocale()).toBe(defaultLocale);
  });

  it("strips locale prefix from pathnames", () => {
    expect(stripLocalePrefix("/en")).toBe("/");
    expect(stripLocalePrefix("/fr/properties")).toBe("/properties");
    expect(stripLocalePrefix("/help")).toBe("/help");
  });

  it("derives locale from pathname", () => {
    expect(getLocaleFromPathname("/fr/properties")).toBe("fr");
    expect(getLocaleFromPathname("/pt")).toBe("pt");
    expect(getLocaleFromPathname("/unknown")).toBe(defaultLocale);
  });

  it("localizes internal links and keeps external links unchanged", () => {
    expect(localizePath("/properties", "fr")).toBe("/fr/properties");
    expect(localizePath("/en/help", "pt")).toBe("/pt/help");
    expect(localizePath("https://stayza.pro/help", "fr")).toBe(
      "https://stayza.pro/help"
    );
  });
});
