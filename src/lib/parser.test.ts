import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("node:dns", () => ({
  promises: {
    resolve4: vi.fn(),
    resolve6: vi.fn(),
  },
}));

import { promises as dns } from "node:dns";
import { validateAndResolveUrl, parseProductUrl } from "./parser";

const mockResolve4 = dns.resolve4 as ReturnType<typeof vi.fn>;
const mockResolve6 = dns.resolve6 as ReturnType<typeof vi.fn>;

beforeEach(() => {
  mockResolve4.mockReset();
  mockResolve6.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// --- SSRF validation ---

describe("validateAndResolveUrl", () => {
  it("отклоняет не-HTTP протоколы", async () => {
    await expect(validateAndResolveUrl("ftp://example.com")).rejects.toThrow(
      "Only HTTP/HTTPS URLs are allowed",
    );
    await expect(validateAndResolveUrl("file:///etc/passwd")).rejects.toThrow(
      "Only HTTP/HTTPS URLs are allowed",
    );
  });

  it("отклоняет прямые приватные IP", async () => {
    await expect(validateAndResolveUrl("http://127.0.0.1")).rejects.toThrow(
      "Internal URLs are not allowed",
    );
    await expect(validateAndResolveUrl("http://10.0.0.1")).rejects.toThrow(
      "Internal URLs are not allowed",
    );
    await expect(validateAndResolveUrl("http://192.168.1.1")).rejects.toThrow(
      "Internal URLs are not allowed",
    );
    await expect(validateAndResolveUrl("http://172.16.0.1")).rejects.toThrow(
      "Internal URLs are not allowed",
    );
  });

  it("отклоняет localhost", async () => {
    mockResolve4.mockResolvedValue(["127.0.0.1"]);
    mockResolve6.mockRejectedValue(new Error("no"));
    await expect(validateAndResolveUrl("http://localhost")).rejects.toThrow(
      "Internal URLs are not allowed",
    );
  });

  it("отклоняет DNS rebinding (домен резолвится в приватный IP)", async () => {
    mockResolve4.mockResolvedValue(["192.168.1.100"]);
    mockResolve6.mockRejectedValue(new Error("no"));
    await expect(
      validateAndResolveUrl("http://evil.example.com"),
    ).rejects.toThrow("Internal URLs are not allowed");
  });

  it("отклоняет если IPv6 резолвится в loopback", async () => {
    mockResolve4.mockRejectedValue(new Error("no"));
    mockResolve6.mockResolvedValue(["::1"]);
    await expect(
      validateAndResolveUrl("http://sneaky.example.com"),
    ).rejects.toThrow("Internal URLs are not allowed");
  });

  it("пропускает публичные IP", async () => {
    mockResolve4.mockResolvedValue(["93.184.216.34"]);
    mockResolve6.mockRejectedValue(new Error("no"));
    await expect(
      validateAndResolveUrl("https://example.com"),
    ).resolves.toBeUndefined();
  });

  it("отклоняет нерезолвимый домен", async () => {
    mockResolve4.mockRejectedValue(new Error("ENOTFOUND"));
    mockResolve6.mockRejectedValue(new Error("ENOTFOUND"));
    await expect(
      validateAndResolveUrl("http://nonexistent.invalid"),
    ).rejects.toThrow("Could not resolve hostname");
  });

  it("отклоняет 169.254.x.x (link-local)", async () => {
    await expect(validateAndResolveUrl("http://169.254.169.254")).rejects.toThrow(
      "Internal URLs are not allowed",
    );
  });
});

// --- Wildberries parsing (API-based) ---

describe("parseProductUrl — Wildberries", () => {
  it("вызывает WB API и парсит ответ", async () => {
    mockResolve4.mockResolvedValue(["212.193.158.1"]);
    mockResolve6.mockRejectedValue(new Error("no"));

    const wbApiResponse = {
      data: {
        products: [
          {
            id: 123456789,
            name: "Тестовый товар WB",
            salePriceU: 159900,
            pics: 3,
          },
        ],
      },
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(wbApiResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await parseProductUrl(
      "https://www.wildberries.ru/catalog/123456789/detail.aspx",
    );

    expect(result.title).toBe("Тестовый товар WB");
    expect(result.price).toBe(1599);
    expect(result.currency).toBe("RUB");
    expect(result.images.length).toBe(3);
    expect(result.images[0]).toContain("wbbasket.ru");

    fetchSpy.mockRestore();
  });

  it("выбрасывает ошибку при неверном URL WB", async () => {
    mockResolve4.mockResolvedValue(["212.193.158.1"]);
    mockResolve6.mockRejectedValue(new Error("no"));

    await expect(
      parseProductUrl("https://www.wildberries.ru/some-page"),
    ).rejects.toThrow("Не удалось извлечь артикул");
  });
});

// --- Ozon parsing ---

describe("parseProductUrl — Ozon", () => {
  it("парсит Ozon через JSON-LD", async () => {
    mockResolve4.mockResolvedValue(["185.71.76.1"]);
    mockResolve6.mockRejectedValue(new Error("no"));

    const html = `
      <html><head>
        <title>Тестовый товар Ozon | OZON</title>
        <meta property="og:title" content="Тестовый товар Ozon" />
        <meta property="og:image" content="https://cdn.ozon.ru/img.jpg" />
        <script type="application/ld+json">
          {"@type":"Product","name":"Тестовый товар Ozon","offers":{"price":"2499","priceCurrency":"RUB"},"image":"https://cdn.ozon.ru/product.jpg"}
        </script>
      </head><body></body></html>
    `;

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(html, { status: 200 }),
    );

    const result = await parseProductUrl("https://www.ozon.ru/product/test-123/");
    expect(result.title).toBe("Тестовый товар Ozon");
    expect(result.price).toBe(2499);
    expect(result.currency).toBe("RUB");
    expect(result.images).toContain("https://cdn.ozon.ru/product.jpg");

    fetchSpy.mockRestore();
  });

  it("парсит Ozon через embedded JSON (webPrice)", async () => {
    mockResolve4.mockResolvedValue(["185.71.76.1"]);
    mockResolve6.mockRejectedValue(new Error("no"));

    const html = `
      <html><head>
        <meta property="og:title" content="Товар Ozon Embedded" />
      </head><body>
        <script>window.__NUXT_DATA__={"webPrice":1999,"name":"Товар Ozon Embedded"}</script>
      </body></html>
    `;

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(html, { status: 200 }),
    );

    const result = await parseProductUrl("https://www.ozon.ru/product/embedded-456/");
    expect(result.title).toBe("Товар Ozon Embedded");
    expect(result.price).toBe(1999);

    fetchSpy.mockRestore();
  });
});

// --- AliExpress parsing ---

describe("parseProductUrl — AliExpress", () => {
  it("парсит aliexpress.com через JSON-LD", async () => {
    mockResolve4.mockResolvedValue(["47.254.47.1"]);
    mockResolve6.mockRejectedValue(new Error("no"));

    const html = `
      <html><head>
        <meta property="og:title" content="Test AliExpress Product | aliexpress" />
        <script type="application/ld+json">
          {"@type":"Product","name":"Test AliExpress Product","offers":{"lowPrice":"599","priceCurrency":"RUB"},"image":"https://ae.alicdn.com/test.jpg"}
        </script>
      </head><body></body></html>
    `;

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(html, { status: 200 }),
    );

    const result = await parseProductUrl(
      "https://www.aliexpress.com/item/123456.html",
    );
    expect(result.title).toBe("Test AliExpress Product");
    expect(result.price).toBe(599);
    expect(result.images).toContain("https://ae.alicdn.com/test.jpg");

    fetchSpy.mockRestore();
  });

  it("определяет aliexpress.ru как маркетплейс AliExpress", async () => {
    mockResolve4.mockResolvedValue(["47.254.47.1"]);
    mockResolve6.mockRejectedValue(new Error("no"));

    const html = `
      <html><head>
        <meta property="og:title" content="Товар с Ali.ru" />
      </head><body></body></html>
    `;

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(html, { status: 200 }),
    );

    const result = await parseProductUrl(
      "https://aliexpress.ru/item/789.html",
    );
    expect(result.title).toBe("Товар с Ali.ru");

    fetchSpy.mockRestore();
  });

  it("очищает title от артефактов AliExpress", async () => {
    mockResolve4.mockResolvedValue(["47.254.47.1"]);
    mockResolve6.mockRejectedValue(new Error("no"));

    const html = `
      <html><head>
        <meta property="og:title" content="Классный товар - AliExpress в России" />
      </head><body></body></html>
    `;

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(html, { status: 200 }),
    );

    const result = await parseProductUrl(
      "https://www.aliexpress.com/item/999.html",
    );
    expect(result.title).toBe("Классный товар");

    fetchSpy.mockRestore();
  });
});

// --- Generic parsing ---

describe("parseProductUrl — Generic", () => {
  it("парсит через Open Graph для неизвестных сайтов", async () => {
    mockResolve4.mockResolvedValue(["93.184.216.34"]);
    mockResolve6.mockRejectedValue(new Error("no"));

    const html = `
      <html><head>
        <title>Товар из интернет-магазина</title>
        <meta property="og:title" content="Крутой гаджет" />
        <meta property="og:image" content="https://shop.example.com/gadget.jpg" />
      </head><body>
        <span class="price">3 499 ₽</span>
      </body></html>
    `;

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(html, { status: 200 }),
    );

    const result = await parseProductUrl("https://shop.example.com/product/1");
    expect(result.title).toBe("Крутой гаджет");
    expect(result.price).toBe(3499);
    expect(result.currency).toBe("RUB");
    expect(result.images).toContain("https://shop.example.com/gadget.jpg");

    fetchSpy.mockRestore();
  });

  it("парсит JSON-LD Product для generic сайтов", async () => {
    mockResolve4.mockResolvedValue(["93.184.216.34"]);
    mockResolve6.mockRejectedValue(new Error("no"));

    const html = `
      <html><head>
        <script type="application/ld+json">
          {"@type":"Product","name":"JSON-LD Product","offers":{"price":"1299","priceCurrency":"USD"},"image":"https://example.com/img.jpg"}
        </script>
      </head><body></body></html>
    `;

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(html, { status: 200 }),
    );

    const result = await parseProductUrl("https://example.com/product");
    expect(result.title).toBe("JSON-LD Product");
    expect(result.price).toBe(1299);
    expect(result.currency).toBe("USD");

    fetchSpy.mockRestore();
  });
});
