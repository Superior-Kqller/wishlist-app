import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("node:dns", () => ({
  promises: {
    resolve4: vi.fn(),
    resolve6: vi.fn(),
  },
}));

import { promises as dns } from "node:dns";
import {
  validateAndResolveUrl,
  resolveCanonicalProductUrl,
  parseProductUrl,
  parseWishlistProductUrl,
} from "./parser";

const mockResolve4 = dns.resolve4 as ReturnType<typeof vi.fn>;
const mockResolve6 = dns.resolve6 as ReturnType<typeof vi.fn>;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

function createStreamingResponse(
  chunks: Uint8Array[],
  headers: Record<string, string> = {},
): {
  response: Response;
  enqueuedChunks: () => number;
  cancelled: () => boolean;
  pullsAfterCancel: () => number;
} {
  let nextChunk = 0;
  let enqueuedChunkCount = 0;
  let wasCancelled = false;
  let pullCountAfterCancel = 0;

  const body = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (wasCancelled) {
        pullCountAfterCancel += 1;
        return;
      }
      if (nextChunk >= chunks.length) {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            if (!wasCancelled) controller.close();
            resolve();
          }, 0);
        });
      }
      controller.enqueue(chunks[nextChunk]);
      nextChunk += 1;
      enqueuedChunkCount += 1;
    },
    cancel() {
      wasCancelled = true;
    },
  });

  return {
    response: new Response(body, { status: 200, headers }),
    enqueuedChunks: () => enqueuedChunkCount,
    cancelled: () => wasCancelled,
    pullsAfterCancel: () => pullCountAfterCancel,
  };
}

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

  it("отклоняет IPv4-mapped loopback в сжатой и полной IPv6 записи", async () => {
    await expect(validateAndResolveUrl("http://[::ffff:7f00:1]")).rejects.toThrow(
      "Internal URLs are not allowed",
    );
    await expect(validateAndResolveUrl("http://[0:0:0:0:0:ffff:7f00:1]")).rejects.toThrow(
      "Internal URLs are not allowed",
    );
  });

  it("пропускает публичные IPv4-mapped и IPv6 адреса", async () => {
    await expect(validateAndResolveUrl("https://[::ffff:5db8:d822]")).resolves.toBeUndefined();
    await expect(validateAndResolveUrl("https://[2001:4860:4860::8888]")).resolves.toBeUndefined();
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
    await expect(validateAndResolveUrl("http://evil.example.com")).rejects.toThrow(
      "Internal URLs are not allowed",
    );
  });

  it("отклоняет если IPv6 резолвится в loopback", async () => {
    mockResolve4.mockRejectedValue(new Error("no"));
    mockResolve6.mockResolvedValue(["::1"]);
    await expect(validateAndResolveUrl("http://sneaky.example.com")).rejects.toThrow(
      "Internal URLs are not allowed",
    );
  });

  it("пропускает публичные IP", async () => {
    mockResolve4.mockResolvedValue(["93.184.216.34"]);
    mockResolve6.mockRejectedValue(new Error("no"));
    await expect(validateAndResolveUrl("https://example.com")).resolves.toBeUndefined();
  });

  it("отклоняет нерезолвимый домен", async () => {
    mockResolve4.mockRejectedValue(new Error("ENOTFOUND"));
    mockResolve6.mockRejectedValue(new Error("ENOTFOUND"));
    await expect(validateAndResolveUrl("http://nonexistent.invalid")).rejects.toThrow(
      "Could not resolve hostname",
    );
  });

  it("отклоняет 169.254.x.x (link-local)", async () => {
    await expect(validateAndResolveUrl("http://169.254.169.254")).rejects.toThrow(
      "Internal URLs are not allowed",
    );
  });

  it("отклоняет 100.64.0.0/10 (shared address space)", async () => {
    await expect(validateAndResolveUrl("http://100.64.0.1")).rejects.toThrow(
      "Internal URLs are not allowed",
    );
    await expect(validateAndResolveUrl("http://100.127.255.254")).rejects.toThrow(
      "Internal URLs are not allowed",
    );
  });

  it("отклоняет 198.18.0.0/15 (benchmarking/testing)", async () => {
    await expect(validateAndResolveUrl("http://198.18.0.1")).rejects.toThrow(
      "Internal URLs are not allowed",
    );
    await expect(validateAndResolveUrl("http://198.19.255.254")).rejects.toThrow(
      "Internal URLs are not allowed",
    );
  });
});

describe("resolveCanonicalProductUrl", () => {
  it("разворачивает цепочку редиректов (HEAD + Location)", async () => {
    mockResolve4.mockResolvedValue(["93.184.216.34"]);
    mockResolve6.mockRejectedValue(new Error("no"));

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const u = typeof input === "string" ? input : (input as Request).url;
      if (init?.method !== "HEAD") {
        return new Response(null, { status: 200 });
      }
      if (u.endsWith("/short") || u.includes("/short?")) {
        return new Response(null, {
          status: 302,
          headers: { location: "/step2" },
        });
      }
      if (u.includes("/step2")) {
        return new Response(null, {
          status: 302,
          headers: { location: "/product/final" },
        });
      }
      return new Response(null, { status: 200 });
    });

    const resolved = await resolveCanonicalProductUrl("https://shop.example.com/short");
    expect(resolved).toBe("https://shop.example.com/product/final");

    fetchSpy.mockRestore();
  });

  it("блокирует редирект на IPv4-mapped loopback до сетевого запроса", async () => {
    mockResolve4.mockResolvedValue(["93.184.216.34"]);
    mockResolve6.mockRejectedValue(new Error("no"));

    let headCalls = 0;
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async () => {
      headCalls += 1;
      if (headCalls === 1) {
        return new Response(null, {
          status: 302,
          headers: { location: "http://[::ffff:7f00:1]/internal" },
        });
      }
      return new Response(null, { status: 200 });
    });

    await expect(resolveCanonicalProductUrl("https://shop.example.com/short")).rejects.toThrow(
      "Internal URLs are not allowed",
    );
    expect(headCalls).toBe(1);

    fetchSpy.mockRestore();
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

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      if (init?.method === "HEAD") {
        return new Response(null, { status: 200 });
      }
      return new Response(JSON.stringify(wbApiResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

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

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 200 }));

    await expect(parseProductUrl("https://www.wildberries.ru/some-page")).rejects.toThrow(
      "Не удалось извлечь артикул",
    );

    fetchSpy.mockRestore();
  });
});

// --- Ozon parsing ---

describe("parseProductUrl — Ozon", () => {
  it("парсит Ozon через внутренний API (widgetStates)", async () => {
    mockResolve4.mockResolvedValue(["185.71.76.1"]);
    mockResolve6.mockRejectedValue(new Error("no"));

    const ozonApiResponse = {
      widgetStates: {
        "webProductHeading-3456-default-1": JSON.stringify({
          title: "Наушники Bluetooth",
        }),
        "webPrice-3457-default-1": JSON.stringify({
          price: "2 499 ₽",
          cardPrice: "2 199 ₽",
          originalPrice: "3 999 ₽",
        }),
        "webGallery-3458-default-1": JSON.stringify({
          coverImage: "https://ir.ozoncdn.net/cover.jpg",
          images: [
            { src: "https://ir.ozoncdn.net/img1.jpg" },
            { src: "https://ir.ozoncdn.net/img2.jpg" },
          ],
        }),
      },
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      if (init?.method === "HEAD") {
        return new Response(null, { status: 200 });
      }
      return new Response(JSON.stringify(ozonApiResponse), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const result = await parseProductUrl("https://www.ozon.ru/product/naushniki-bluetooth-123456/");

    expect(result.title).toBe("Наушники Bluetooth");
    expect(result.price).toBe(2199);
    expect(result.currency).toBe("RUB");
    expect(result.images).toContain("https://ir.ozoncdn.net/cover.jpg");
    expect(result.images.length).toBe(3);

    fetchSpy.mockRestore();
  });

  it("fallback на HTML при ошибке API", async () => {
    mockResolve4.mockResolvedValue(["185.71.76.1"]);
    mockResolve6.mockRejectedValue(new Error("no"));

    const html = `
      <html><head>
        <meta property="og:title" content="Товар Ozon Fallback" />
        <script type="application/ld+json">
          {"@type":"Product","name":"Товар Ozon Fallback","offers":{"price":"1999","priceCurrency":"RUB"}}
        </script>
      </head><body></body></html>
    `;

    let nonHeadCalls = 0;
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      if (init?.method === "HEAD") {
        return new Response(null, { status: 200 });
      }
      nonHeadCalls++;
      if (nonHeadCalls === 1) {
        return new Response("", { status: 403 });
      }
      return new Response(html, { status: 200 });
    });

    const result = await parseProductUrl("https://www.ozon.ru/product/fallback-789/");

    expect(result.title).toBe("Товар Ozon Fallback");
    expect(result.price).toBe(1999);
    expect(nonHeadCalls).toBe(2);

    fetchSpy.mockRestore();
  });

  it("выбрасывает ошибку при неверном URL Ozon", async () => {
    mockResolve4.mockResolvedValue(["185.71.76.1"]);
    mockResolve6.mockRejectedValue(new Error("no"));

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      if (init?.method === "HEAD") {
        return new Response(null, { status: 200 });
      }
      return new Response("", { status: 200 });
    });

    await expect(parseProductUrl("https://www.ozon.ru/category/electronics/")).rejects.toThrow(
      "Не удалось извлечь ID товара",
    );

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

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      if (init?.method === "HEAD") {
        return new Response(null, { status: 200 });
      }
      return new Response(html, { status: 200 });
    });

    const result = await parseProductUrl("https://www.aliexpress.com/item/123456.html");
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

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      if (init?.method === "HEAD") {
        return new Response(null, { status: 200 });
      }
      return new Response(html, { status: 200 });
    });

    const result = await parseProductUrl("https://aliexpress.ru/item/789.html");
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

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      if (init?.method === "HEAD") {
        return new Response(null, { status: 200 });
      }
      return new Response(html, { status: 200 });
    });

    const result = await parseProductUrl("https://www.aliexpress.com/item/999.html");
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

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      if (init?.method === "HEAD") {
        return new Response(null, { status: 200 });
      }
      return new Response(html, { status: 200 });
    });

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

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      if (init?.method === "HEAD") {
        return new Response(null, { status: 200 });
      }
      return new Response(html, { status: 200 });
    });

    const result = await parseProductUrl("https://example.com/product");
    expect(result.title).toBe("JSON-LD Product");
    expect(result.price).toBe(1299);
    expect(result.currency).toBe("USD");

    fetchSpy.mockRestore();
  });

  it("отменяет поток сразу после превышения лимита даже при ложном content-length", async () => {
    mockResolve4.mockResolvedValue(["93.184.216.34"]);
    mockResolve6.mockRejectedValue(new Error("no"));

    const encoder = new TextEncoder();
    const prefix = encoder.encode(
      '<html><head><meta property="og:title" content="Слишком большая страница" /></head><body>',
    );
    const withinLimit = new Uint8Array(MAX_RESPONSE_BYTES - prefix.byteLength);
    withinLimit.fill(0x20);
    const overflow = new Uint8Array([0x20]);
    const streamed = createStreamingResponse([prefix, withinLimit, overflow], {
      "content-length": "1",
      "content-type": "text/html; charset=utf-8",
    });

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      if (init?.method === "HEAD") {
        return new Response(null, { status: 200 });
      }
      return streamed.response;
    });

    await expect(parseProductUrl("https://example.com/streamed-too-large")).rejects.toThrow(
      "Page too large to parse",
    );
    expect(streamed.cancelled()).toBe(true);
    expect(streamed.enqueuedChunks()).toBe(3);
    expect(streamed.pullsAfterCancel()).toBe(0);

    fetchSpy.mockRestore();
  });

  it.each([
    {
      name: "одним большим chunk",
      chunks: () => [new Uint8Array(MAX_RESPONSE_BYTES + 1)],
      expectedChunks: 1,
    },
    {
      name: "на границе лимита",
      chunks: () => [new Uint8Array(MAX_RESPONSE_BYTES - 1), new Uint8Array(2)],
      expectedChunks: 2,
    },
  ])("останавливает чтение для варианта $name", async ({ chunks, expectedChunks }) => {
    mockResolve4.mockResolvedValue(["93.184.216.34"]);
    mockResolve6.mockRejectedValue(new Error("no"));

    const streamed = createStreamingResponse(chunks(), {
      "content-length": "2",
      "content-type": "text/html",
    });
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      if (init?.method === "HEAD") {
        return new Response(null, { status: 200 });
      }
      return streamed.response;
    });

    await expect(parseProductUrl("https://example.com/streamed-boundary")).rejects.toThrow(
      "Page too large to parse",
    );
    expect(streamed.cancelled()).toBe(true);
    expect(streamed.enqueuedChunks()).toBe(expectedChunks);
    expect(streamed.pullsAfterCancel()).toBe(0);

    fetchSpy.mockRestore();
  });

  it("сохраняет небольшое и ровно предельное HTML-тело с UTF-8", async () => {
    mockResolve4.mockResolvedValue(["93.184.216.34"]);
    mockResolve6.mockRejectedValue(new Error("no"));

    const encoder = new TextEncoder();
    const small = createStreamingResponse(
      [
        encoder.encode(
          '<html><head><meta property="og:title" content="Небольшая UTF-8 страница" /></head>',
        ),
        encoder.encode("<body></body></html>"),
      ],
      { "content-length": "1", "content-type": "text/html; charset=utf-8" },
    );
    const exactPrefix = encoder.encode(
      '<html><head><meta property="og:title" content="Ровно пять MiB" /></head><body>',
    );
    const exactFiller = new Uint8Array(MAX_RESPONSE_BYTES - exactPrefix.byteLength);
    exactFiller.fill(0x20);
    const exact = createStreamingResponse([exactPrefix, exactFiller], {
      "content-length": String(MAX_RESPONSE_BYTES),
      "content-type": "text/html; charset=utf-8",
    });

    let getCount = 0;
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      if (init?.method === "HEAD") {
        return new Response(null, { status: 200 });
      }
      getCount += 1;
      return getCount === 1 ? small.response : exact.response;
    });

    const smallResult = await parseProductUrl("https://example.com/streamed-small");
    expect(smallResult.title).toBe("Небольшая UTF-8 страница");

    const exactResult = await parseProductUrl("https://example.com/streamed-exact-limit");
    expect(exactResult.title).toBe("Ровно пять MiB");

    fetchSpy.mockRestore();
  });

  it("блокирует редирект на внутренний адрес", async () => {
    mockResolve4.mockResolvedValue(["93.184.216.34"]);
    mockResolve6.mockRejectedValue(new Error("no"));

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("", {
        status: 302,
        headers: { location: "http://127.0.0.1/internal" },
      }),
    );

    await expect(parseProductUrl("https://example.com/product")).rejects.toThrow(
      "Internal URLs are not allowed",
    );

    fetchSpy.mockRestore();
  });
});

// --- Wishlist URL (OG + merge) ---

describe("parseWishlistProductUrl", () => {
  it("добавляет og:description для обычных сайтов", async () => {
    mockResolve4.mockResolvedValue(["93.184.216.34"]);
    mockResolve6.mockRejectedValue(new Error("no"));

    const html = `
      <html><head>
        <meta property="og:title" content="Товар OG" />
        <meta property="og:description" content="Краткое описание с страницы" />
        <meta property="og:image" content="https://shop.example.com/i.jpg" />
      </head><body>
        <span class="price">100 ₽</span>
      </body></html>
    `;

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (_input, init) => {
      if (init?.method === "HEAD") {
        return new Response(null, { status: 200 });
      }
      return new Response(html, { status: 200 });
    });

    const result = await parseWishlistProductUrl("https://shop.example.com/p");
    expect(result.title).toBe("Товар OG");
    expect(result.description).toBe("Краткое описание с страницы");
    expect(result.price).toBe(100);
    expect(result.images).toContain("https://shop.example.com/i.jpg");

    fetchSpy.mockRestore();
  });

  it("для Wildberries подмешивает og:description со страницы товара", async () => {
    mockResolve4.mockResolvedValue(["212.193.158.1"]);
    mockResolve6.mockRejectedValue(new Error("no"));

    const wbApiResponse = {
      data: {
        products: [
          {
            id: 123456789,
            name: "Тестовый товар WB",
            salePriceU: 159900,
            pics: 2,
          },
        ],
      },
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      const u = typeof input === "string" ? input : (input as Request).url;
      if (init?.method === "HEAD") {
        return new Response(null, { status: 200 });
      }
      if (u.includes("card.wb.ru")) {
        return new Response(JSON.stringify(wbApiResponse), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response(
        `<html><head><meta property="og:description" content="Описание с карточки WB" /></head><body></body></html>`,
        { status: 200 },
      );
    });

    const result = await parseWishlistProductUrl(
      "https://www.wildberries.ru/catalog/123456789/detail.aspx",
    );
    expect(result.title).toBe("Тестовый товар WB");
    expect(result.price).toBe(1599);
    expect(result.description).toBe("Описание с карточки WB");
    expect(result.images.length).toBeGreaterThanOrEqual(2);

    fetchSpy.mockRestore();
  });
});
