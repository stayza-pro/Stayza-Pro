import { useMemo, useCallback } from "react";

interface CurrencyRates {
  [key: string]: number;
}

interface UseCurrencyOptions {
  baseCurrency?: string;
  fallbackRates?: CurrencyRates;
  locale?: string;
}

export const useCurrency = (
  currency: string,
  language: string = "en",
  options: UseCurrencyOptions = {}
) => {
  const {
    baseCurrency = "USD",
    locale = language === "en"
      ? "en-US"
      : language === "fr"
      ? "fr-FR"
      : language === "es"
      ? "es-ES"
      : language === "de"
      ? "de-DE"
      : "pt-BR",
  } = options;

  // Base exchange rates (in a real app, fetch from API)
  const exchangeRates: CurrencyRates = useMemo(
    () => ({
      USD: 1,
      EUR: 0.93,
      GBP: 0.78,
      NGN: 1650, // Nigerian Naira
      CAD: 1.34,
      AUD: 1.5,
      AED: 3.67,
      ZAR: 18.5, // South African Rand
      KES: 130, // Kenyan Shilling
      GHS: 15.8, // Ghanaian Cedi
      JPY: 147,
      CNY: 7.2,
      INR: 83,
      BRL: 5.2, // Brazilian Real
      MXN: 17.8, // Mexican Peso
      ...options.fallbackRates,
    }),
    [options.fallbackRates]
  );

  const formatPrice = useCallback(
    (amount: number, fromCurrency: string = baseCurrency): string => {
      try {
        const rate = exchangeRates[currency] || 1;
        const baseRate = exchangeRates[fromCurrency] || 1;
        const converted = (amount / baseRate) * rate;

        const formatter = new Intl.NumberFormat(locale, {
          style: "currency",
          currency: currency,
          minimumFractionDigits: ["JPY", "KRW", "VND"].includes(currency)
            ? 0
            : 0,
          maximumFractionDigits: ["JPY", "KRW", "VND"].includes(currency)
            ? 0
            : 0,
        });

        return formatter.format(converted);
      } catch (error) {
        // Fallback for unsupported currencies
        const symbols: Record<string, string> = {
          NGN: "₦",
          USD: "$",
          EUR: "€",
          GBP: "£",
          CAD: "C$",
          AUD: "A$",
          ZAR: "R",
          KES: "KSh",
          GHS: "₵",
          JPY: "¥",
          CNY: "¥",
          INR: "₹",
          BRL: "R$",
          MXN: "$",
        };

        const rate = exchangeRates[currency] || 1;
        const baseRate = exchangeRates[fromCurrency] || 1;
        const converted = (amount / baseRate) * rate;
        const symbol = symbols[currency] || currency;

        return `${symbol}${Math.round(converted).toLocaleString()}`;
      }
    },
    [currency, locale, baseCurrency, exchangeRates]
  );

  const convertAmount = useCallback(
    (
      amount: number,
      fromCurrency: string = baseCurrency,
      toCurrency: string = currency
    ): number => {
      const fromRate = exchangeRates[fromCurrency] || 1;
      const toRate = exchangeRates[toCurrency] || 1;
      return (amount / fromRate) * toRate;
    },
    [currency, baseCurrency, exchangeRates]
  );

  const getSupportedCurrencies = useCallback(() => {
    return Object.keys(exchangeRates);
  }, [exchangeRates]);

  const getCurrencySymbol = useCallback(
    (currencyCode: string = currency): string => {
      const symbols: Record<string, string> = {
        NGN: "₦",
        USD: "$",
        EUR: "€",
        GBP: "£",
        CAD: "C$",
        AUD: "A$",
        AED: "د.إ",
        ZAR: "R",
        KES: "KSh",
        GHS: "₵",
        JPY: "¥",
        CNY: "¥",
        INR: "₹",
        BRL: "R$",
        MXN: "$",
      };
      return symbols[currencyCode] || currencyCode;
    },
    [currency]
  );

  return {
    formatPrice,
    convertAmount,
    getSupportedCurrencies,
    getCurrencySymbol,
    currentCurrency: currency,
    exchangeRates,
  };
};
