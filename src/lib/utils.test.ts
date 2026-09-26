import { describe, it, expect, vi } from "vitest";
import { fetcher, formatPrice, formatStatsSummary, sortCurrencyTotalsEntries } from "./utils";

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

describe("formatStatsSummary", () => {
  it("складывает несколько валют в одну строку", () => {
    const s = formatStatsSummary(
      {
        currency: "RUB",
        pricesByCurrency: {
          USD: { unpurchased: 10, purchased: 0 },
          RUB: { unpurchased: 100, purchased: 0 },
        },
      },
      "unpurchased",
    );
    expect(s).toContain("₽");
    expect(s).toContain("$");
    expect(s).toContain("·");
  });

  it("без разбивки по валютам берёт общий итог", () => {
    expect(
      formatStatsSummary({ totalWishlistValue: 500, currency: "RUB" }, "unpurchased"),
    ).toContain("500");
    expect(
      formatStatsSummary({ totalWishlistValue: 300, pricesByCurrency: {} }, "unpurchased"),
    ).toContain("300");
    expect(formatStatsSummary({ totalPurchasedValue: 10 }, "purchased")).toContain("10");
  });

  it("возвращает null, если ненулевых сумм нет", () => {
    expect(
      formatStatsSummary(
        { totalPurchasedValue: 0, pricesByCurrency: { RUB: { unpurchased: 100, purchased: 0 } } },
        "purchased",
      ),
    ).toBeNull();
    expect(formatStatsSummary({ totalPurchasedValue: 0 }, "purchased")).toBeNull();
  });
});

describe("fetcher", () => {
  it("возвращает JSON при успешном ответе", async () => {
    const data = { items: [1, 2, 3] };
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(data),
    });

    const result = await fetcher("/api/items");
    expect(result).toEqual(data);
    expect(fetch).toHaveBeenCalledWith("/api/items");
  });

  it("выбрасывает ошибку при неуспешном ответе", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(fetcher("/api/items")).rejects.toThrow("Ошибка загрузки");
  });
});
