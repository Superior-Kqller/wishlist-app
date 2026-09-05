import { describe, it, expect } from "vitest";
import {
  formatPrice,
  formatStatsPurchasedSummary,
  formatStatsUnpurchasedSummary,
  sortCurrencyTotalsEntries,
  statsHasPurchasedPrices,
} from "./utils";

describe("formatPrice", () => {
  it("форматирует рубли", () => {
    expect(formatPrice(1500, "RUB")).toContain("₽");
    expect(formatPrice(1500, "RUB")).toContain("1");
  });

  it("форматирует доллары", () => {
    expect(formatPrice(99, "USD")).toContain("$");
  });

  it("форматирует евро", () => {
    expect(formatPrice(100, "EUR")).toContain("€");
  });

  it("использует код валюты для неизвестных", () => {
    expect(formatPrice(100, "GBP")).toContain("GBP");
  });

  it("по умолчанию RUB", () => {
    expect(formatPrice(100)).toContain("₽");
  });
});

describe("sortCurrencyTotalsEntries", () => {
  it("сортирует коды валют по алфавиту", () => {
    const entries = sortCurrencyTotalsEntries({
      RUB: { unpurchased: 1, purchased: 0 },
      USD: { unpurchased: 2, purchased: 0 },
      EUR: { unpurchased: 3, purchased: 0 },
    });
    expect(entries.map(([c]) => c)).toEqual(["EUR", "RUB", "USD"]);
  });
});

describe("formatStatsUnpurchasedSummary", () => {
  it("складывает несколько валют в одну строку", () => {
    const s = formatStatsUnpurchasedSummary({
      totalWishlistValue: 0,
      currency: "RUB",
      pricesByCurrency: {
        USD: { unpurchased: 10, purchased: 0 },
        RUB: { unpurchased: 100, purchased: 0 },
      },
    });
    expect(s).toContain("₽");
    expect(s).toContain("$");
    expect(s).toContain("·");
  });

  it("без pricesByCurrency использует totalWishlistValue", () => {
    expect(
      formatStatsUnpurchasedSummary({
        totalWishlistValue: 500,
        currency: "RUB",
      }),
    ).toContain("500");
  });

  it("пустой pricesByCurrency использует totalWishlistValue", () => {
    expect(
      formatStatsUnpurchasedSummary({
        totalWishlistValue: 300,
        currency: "RUB",
        pricesByCurrency: {},
      }),
    ).toContain("300");
  });
});

describe("formatStatsPurchasedSummary", () => {
  it("возвращает null если нет купленного с ценой", () => {
    expect(
      formatStatsPurchasedSummary({
        totalPurchasedValue: 0,
        pricesByCurrency: { RUB: { unpurchased: 100, purchased: 0 } },
      }),
    ).toBeNull();
  });

  it("разделяет валюты при нескольких купленных суммах", () => {
    const s = formatStatsPurchasedSummary({
      totalPurchasedValue: 0,
      pricesByCurrency: {
        RUB: { unpurchased: 0, purchased: 100 },
        USD: { unpurchased: 0, purchased: 5 },
      },
    });
    expect(s).toContain("·");
  });
});

describe("statsHasPurchasedPrices", () => {
  it("учитывает pricesByCurrency", () => {
    expect(
      statsHasPurchasedPrices({
        totalPurchasedValue: 0,
        pricesByCurrency: { RUB: { unpurchased: 0, purchased: 1 } },
      }),
    ).toBe(true);
  });

  it("fallback на totalPurchasedValue", () => {
    expect(
      statsHasPurchasedPrices({
        totalPurchasedValue: 10,
      }),
    ).toBe(true);
  });
});
