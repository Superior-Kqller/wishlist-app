import * as cheerio from "cheerio";
import { promises as dns } from "node:dns";
import net from "node:net";
import { Agent, type Dispatcher } from "undici";

interface ParsedProduct {
  title: string;
  price: number | null;
  currency: string;
  images: string[];
  url: string;
  /** Open Graph / meta description — для заметки в форме */
  description?: string;
}

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
};

const JSON_HEADERS: Record<string, string> = {
  "User-Agent": HEADERS["User-Agent"],
  "Accept-Language": "ru-RU,ru;q=0.9,en;q=0.8",
  Accept: "application/json",
};

// --- SSRF protection ---

const privateNetworks = new net.BlockList();
for (const [address, prefix] of [
  ["0.0.0.0", 8], // "this network"
  ["10.0.0.0", 8], // RFC1918
  ["100.64.0.0", 10], // Shared Address Space (RFC6598)
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local
  ["172.16.0.0", 12], // RFC1918
  ["192.168.0.0", 16], // RFC1918
  ["198.18.0.0", 15], // benchmarking (RFC2544)
] as const) {
  privateNetworks.addSubnet(address, prefix, "ipv4");
}
for (const [address, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["fe80::", 10],
  ["fc00::", 7],
] as const) {
  privateNetworks.addSubnet(address, prefix, "ipv6");
}

/** IPv4-mapped IPv6 (`::ffff:7f00:1`) BlockList сверяет с IPv4-подсетями сам. */
function isPrivateIP(ip: string): boolean {
  const family = net.isIP(ip);
  return family !== 0 && privateNetworks.check(ip, family === 4 ? "ipv4" : "ipv6");
}

interface PublicUrlResolution {
  hostname: string;
  addresses: string[];
}

export async function resolvePublicUrl(url: string): Promise<PublicUrlResolution> {
  const parsed = new URL(url);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP/HTTPS URLs are allowed");
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");

  if (net.isIP(hostname)) {
    if (isPrivateIP(hostname)) {
      throw new Error("Internal URLs are not allowed");
    }
    return { hostname, addresses: [hostname] };
  }

  const blocked = ["localhost", "metadata.google.internal"];
  if (blocked.includes(hostname.toLowerCase())) {
    throw new Error("Internal URLs are not allowed");
  }

  let addresses: string[] = [];
  try {
    const v4 = await dns.resolve4(hostname).catch(() => [] as string[]);
    const v6 = await dns.resolve6(hostname).catch(() => [] as string[]);
    addresses = [...v4, ...v6];
  } catch {
    throw new Error("Could not resolve hostname");
  }

  if (addresses.length === 0) {
    throw new Error("Could not resolve hostname");
  }

  for (const addr of addresses) {
    if (isPrivateIP(addr)) {
      throw new Error("Internal URLs are not allowed");
    }
  }

  return { hostname, addresses };
}

function createPinnedDispatcher(resolution: PublicUrlResolution): Dispatcher {
  let nextAddressIndex = 0;

  return new Agent({
    connect: {
      lookup(hostname, _options, callback) {
        if (hostname !== resolution.hostname) {
          callback(new Error("Unexpected hostname during connection"), "", 0);
          return;
        }

        const address = resolution.addresses[nextAddressIndex % resolution.addresses.length];
        nextAddressIndex += 1;
        callback(null, address, net.isIPv6(address) ? 6 : 4);
      },
    },
  });
}

async function fetchPublicUrl(
  url: string,
  init: RequestInit,
): Promise<{ response: Response; close: () => Promise<void> }> {
  const resolution = await resolvePublicUrl(url);
  const dispatcher = createPinnedDispatcher(resolution);
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      dispatcher,
    } as RequestInit & { dispatcher: Dispatcher });
  } catch (err) {
    await dispatcher.close().catch(() => undefined);
    throw err;
  }

  return {
    response,
    close: () => dispatcher.close(),
  };
}

// --- Marketplace detection ---

function detectMarketplace(url: string): "wildberries" | "ozon" | "aliexpress" | "generic" {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes("wildberries") || host.includes("wb.ru")) return "wildberries";
  if (host.includes("ozon")) return "ozon";
  if (host.includes("aliexpress")) return "aliexpress";
  return "generic";
}

// --- Shared extractors ---

type JsonLdObject = Record<string, unknown>;

function isJsonLdObject(value: unknown): value is JsonLdObject {
  return typeof value === "object" && value !== null;
}

function titleFromJsonLdName(jsonLd: JsonLdObject | null): string {
  if (!jsonLd) return "";
  const n = jsonLd["name"];
  if (typeof n === "string") return n;
  if (Array.isArray(n) && typeof n[0] === "string") return n[0];
  return "";
}

function jsonLdTypeMatchesProduct(type: unknown): boolean {
  if (type === "Product") return true;
  if (Array.isArray(type)) {
    return type.some((t) => t === "Product");
  }
  if (typeof type === "string" && type.includes("Product")) return true;
  return false;
}

function extractJsonLd($: cheerio.CheerioAPI): JsonLdObject | null {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const raw: unknown = JSON.parse($(scripts[i]).html() || "");
      if (!isJsonLdObject(raw)) continue;
      if (jsonLdTypeMatchesProduct(raw["@type"])) {
        return raw;
      }
      const graph = raw["@graph"];
      if (Array.isArray(graph)) {
        const product = graph.find(
          (item: unknown) => isJsonLdObject(item) && jsonLdTypeMatchesProduct(item["@type"]),
        );
        if (isJsonLdObject(product)) return product;
      }
    } catch {
      continue;
    }
  }
  return null;
}

function trimText(s: string | undefined | null): string {
  return (s ?? "").replace(/\s+/g, " ").trim();
}

function absolutizeUrl(src: string | undefined, base: string): string | null {
  if (!src?.trim()) return null;
  const trimmed = src.trim();
  return URL.canParse(trimmed, base) ? new URL(trimmed, base).href : null;
}

/**
 * Извлекает Open Graph и связанные meta: заголовок, описание, картинки, цену (meta / JSON-LD offers).
 */
function parseOpenGraphFromHtml(
  html: string,
  pageUrl: string,
  loadedCheerio?: cheerio.CheerioAPI,
): ParsedProduct {
  const $ = loadedCheerio ?? cheerio.load(html);
  const base = pageUrl;

  const title =
    trimText($('meta[property="og:title"]').attr("content")) ||
    trimText($('meta[name="twitter:title"]').attr("content")) ||
    trimText($("title").text()) ||
    trimText($("h1").first().text());

  const description =
    trimText($('meta[property="og:description"]').attr("content")) ||
    trimText($('meta[name="twitter:description"]').attr("content")) ||
    trimText($('meta[name="description"]').attr("content"));

  const imageAttrs = [
    $('meta[property="og:image"]').attr("content"),
    $('meta[property="og:image:url"]').attr("content"),
    $('meta[property="og:image:secure_url"]').attr("content"),
    $('meta[name="twitter:image"]').attr("content"),
    $('meta[name="twitter:image:src"]').attr("content"),
  ];
  const seen = new Set<string>();
  const images: string[] = [];
  for (const raw of imageAttrs) {
    const abs = absolutizeUrl(raw, base);
    if (abs && !seen.has(abs)) {
      seen.add(abs);
      images.push(abs);
    }
  }

  let price: number | null = null;
  let currency = "RUB";
  const priceAmount =
    $('meta[property="product:price:amount"]').attr("content") ||
    $('meta[property="og:price:amount"]').attr("content");
  const priceCurrency =
    $('meta[property="product:price:currency"]').attr("content") ||
    $('meta[property="og:price:currency"]').attr("content");
  if (priceAmount) {
    const p = parseFloat(priceAmount.replace(/\s/g, "").replace(",", "."));
    if (!Number.isNaN(p)) price = p;
    if (priceCurrency?.trim()) {
      currency = priceCurrency.trim().toUpperCase().slice(0, 3);
    }
  }

  if (price === null) {
    const jsonLd = extractJsonLd($);
    if (jsonLd) {
      const o = extractOffersFromJsonLd(jsonLd);
      price = o.price;
      currency = o.currency;
    }
  }

  const result: ParsedProduct = {
    title,
    price,
    currency,
    images: images.slice(0, 10),
    url: pageUrl,
  };
  if (description) result.description = description;
  return result;
}

function parsePrice(text: string): { price: number; currency: string } | null {
  if (!text) return null;
  const cleaned = text.replace(/\s/g, "").replace(/,/g, ".");
  const match = cleaned.match(/([\d.]+)/);
  if (!match) return null;
  const price = parseFloat(match[1]);
  if (isNaN(price)) return null;

  let currency = "RUB";
  if (text.includes("$") || text.toLowerCase().includes("usd")) currency = "USD";
  else if (text.includes("€") || text.toLowerCase().includes("eur")) currency = "EUR";
  else if (text.includes("¥") || text.includes("CN")) currency = "CNY";

  return { price, currency };
}

function extractFromEmbeddedJson(html: string): Partial<ParsedProduct> {
  const out: Partial<ParsedProduct> = {};

  const titleMatch = html.match(
    /"(?:title|name|productName|product_name)"\s*:\s*"((?:[^"\\]|\\.){1,500})"/,
  );
  if (titleMatch) {
    out.title = titleMatch[1]
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, c) => String.fromCharCode(parseInt(c, 16)))
      .replace(/\\"/g, '"')
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500);
  }

  const priceMatch = html.match(
    /"(?:price|currentPrice|lowPrice|salePrice|basePrice|webPrice|cardPrice|originalPrice)"\s*:\s*([\d.]+)/,
  );
  if (priceMatch) {
    const p = parseFloat(priceMatch[1]);
    if (!isNaN(p)) out.price = p;
  }
  if (out.price === undefined) {
    const priceStr = html.match(/"price"\s*:\s*"([\d\s.,]+)"/);
    if (priceStr) {
      const parsed = parsePrice(priceStr[1]);
      if (parsed) {
        out.price = parsed.price;
        out.currency = parsed.currency;
      }
    }
  }
  if (out.price !== undefined && !out.currency) out.currency = "RUB";

  const imgSingle = html.match(
    /"(?:image|mainImage|photo|img|picture)"\s*:\s*"((?:https?:)?\/\/[^"]+)"/,
  );
  const imgArray = html.match(/"(?:images|gallery|photos)"\s*:\s*\[([\s\S]*?)\]/);
  const imageUrls: string[] = [];
  if (imgSingle)
    imageUrls.push(imgSingle[1].startsWith("http") ? imgSingle[1] : "https:" + imgSingle[1]);
  if (imgArray) {
    const urls = imgArray[1].match(/"((?:https?:)?\/\/[^"]+)"/g);
    if (urls)
      urls.forEach((u) => imageUrls.push(u.replace(/^"|"$/g, "").replace(/^\/\//, "https://")));
  }
  if (imageUrls.length) out.images = [...new Set(imageUrls)].slice(0, 10);
  return out;
}

function extractOffersFromJsonLd(jsonLd: JsonLdObject | null): {
  price: number | null;
  currency: string;
} {
  if (!jsonLd) return { price: null, currency: "RUB" };
  const offersRaw = jsonLd["offers"];
  if (!offersRaw) return { price: null, currency: "RUB" };
  const offer = Array.isArray(offersRaw) ? offersRaw[0] : offersRaw;
  if (!isJsonLdObject(offer)) return { price: null, currency: "RUB" };
  const low = offer["lowPrice"];
  const p = offer["price"];
  const rawNum = String(low ?? p ?? "")
    .replace(/\s/g, "")
    .replace(",", ".");
  const parsed = parseFloat(rawNum);
  const price = Number.isFinite(parsed) ? parsed : null;
  const cur = offer["priceCurrency"];
  const currency = typeof cur === "string" ? cur : "RUB";
  return { price, currency };
}

function extractImagesFromJsonLd(jsonLd: JsonLdObject | null, existing: string[]): string[] {
  if (!jsonLd) return existing;
  const imageRaw = jsonLd["image"];
  if (!imageRaw) return existing;
  const jsonImages = Array.isArray(imageRaw) ? imageRaw : [imageRaw];
  const asStrings = jsonImages.filter((x): x is string => typeof x === "string");
  return [...asStrings, ...existing];
}

// --- Wildberries (internal API) ---

function extractWbArticle(url: string): string | null {
  const match = url.match(/\/catalog\/(\d+)/);
  return match ? match[1] : null;
}

function getWbImageUrl(id: number, photoIndex: number): string {
  const vol = Math.floor(id / 100000);
  const part = Math.floor(id / 1000);

  const WB_BASKET_THRESHOLDS = [
    143, 287, 431, 719, 1007, 1061, 1115, 1169, 1313, 1601, 1655, 1919, 2045, 2189, 2405, 2621,
    2837,
  ];
  const idx = WB_BASKET_THRESHOLDS.findIndex((threshold) => vol <= threshold);
  const basket = idx === -1 ? 18 : idx + 1;

  return `https://basket-${String(basket).padStart(2, "0")}.wbbasket.ru/vol${vol}/part${part}/${id}/images/big/${photoIndex}.webp`;
}

async function parseWildberries(url: string): Promise<ParsedProduct> {
  const article = extractWbArticle(url);
  if (!article) {
    throw new Error("Не удалось извлечь артикул из URL Wildberries");
  }

  const apiUrl = `https://card.wb.ru/cards/v2/detail?appType=1&curr=rub&dest=-1257786&nm=${article}`;
  const response = await fetch(apiUrl, {
    headers: JSON_HEADERS,
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) {
    throw new Error(`WB API error: ${response.status}`);
  }

  const data = await response.json();
  const product = data?.data?.products?.[0];

  if (!product) {
    throw new Error("Товар не найден на Wildberries");
  }

  const id = product.id || parseInt(article);
  const images: string[] = [];
  const photoCount = product.pics || 1;
  for (let i = 1; i <= Math.min(photoCount, 5); i++) {
    images.push(getWbImageUrl(id, i));
  }

  return {
    title: (product.name || "").replace(/\s+/g, " ").trim(),
    price: product.salePriceU ? product.salePriceU / 100 : null,
    currency: "RUB",
    images,
    url,
  };
}

// --- Ozon (internal API + HTML fallback) ---

const OZON_API_HEADERS: Record<string, string> = {
  "User-Agent": "ozonapp_android/17.40.1+14901",
  Accept: "application/json",
  "Accept-Language": "ru-RU,ru;q=0.9",
  "x-o3-app-name": "ozonapp_android",
  "x-o3-app-version": "17.40.1",
};

const OZON_TITLE_JUNK = [/ - купить.*$/i, / \| OZON$/i];
const ALIEXPRESS_TITLE_JUNK = [/ \| .*$/, / - AliExpress.*$/i, / купить.*$/i];

function cleanTitle(title: string, junk: RegExp[]): string {
  return junk.reduce((t, re) => t.replace(re, ""), title.replace(/\s+/g, " ")).trim();
}

function extractOzonProductPath(url: string): string | null {
  const match = url.match(/\/product\/([\w-]*\d+)\/?/);
  return match ? match[1] : null;
}

function parseOzonPriceString(text: string): number | null {
  if (!text) return null;
  const cleaned = text.replace(/[^\d.,]/g, "").replace(/,/g, ".");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function findWidgetState(widgetStates: Record<string, string>, prefix: string): unknown | null {
  for (const [key, value] of Object.entries(widgetStates)) {
    if (key.startsWith(prefix)) {
      try {
        return JSON.parse(value) as unknown;
      } catch {
        continue;
      }
    }
  }
  return null;
}

async function parseOzonViaApi(url: string, productPath: string): Promise<ParsedProduct | null> {
  const apiUrl = `https://api.ozon.ru/composer-api.bx/page/json/v2?url=/product/${productPath}/`;

  const response = await fetch(apiUrl, {
    headers: OZON_API_HEADERS,
    signal: AbortSignal.timeout(10000),
  });

  if (!response.ok) return null;

  const data = await response.json();
  const ws: Record<string, string> | undefined = data?.widgetStates;
  if (!ws || Object.keys(ws).length === 0) return null;

  const headingRaw = findWidgetState(ws, "webProductHeading");
  const priceRaw = findWidgetState(ws, "webPrice");
  const galleryRaw = findWidgetState(ws, "webGallery");
  const heading = isJsonLdObject(headingRaw) ? headingRaw : null;
  const priceWidget = isJsonLdObject(priceRaw) ? priceRaw : null;
  const gallery = isJsonLdObject(galleryRaw) ? galleryRaw : null;

  const title = cleanTitle(String(heading?.title ?? ""), OZON_TITLE_JUNK);

  if (!title) return null;

  const price = parseOzonPriceString(
    String(priceWidget?.cardPrice ?? priceWidget?.price ?? priceWidget?.originalPrice ?? ""),
  );

  const images: string[] = [];
  const cover = gallery?.coverImage;
  if (typeof cover === "string") images.push(cover);
  const galleryImages = gallery?.images;
  if (Array.isArray(galleryImages)) {
    for (const img of galleryImages) {
      const src =
        typeof img === "string" ? img : isJsonLdObject(img) ? String(img.src ?? img.url ?? "") : "";
      if (src && !images.includes(src)) images.push(src);
    }
  }

  return {
    title,
    price,
    currency: "RUB",
    images: images.slice(0, 5),
    url,
  };
}

function extractCommonProductMetadata(
  url: string,
  html: string,
  loadedCheerio?: cheerio.CheerioAPI,
): {
  $: cheerio.CheerioAPI;
  title: string;
  price: number | null;
  currency: string;
  images: string[];
} {
  const $ = loadedCheerio ?? cheerio.load(html);
  const jsonLd = extractJsonLd($);
  const og = parseOpenGraphFromHtml(html, url, $);
  const embedded = extractFromEmbeddedJson(html);

  const title = titleFromJsonLdName(jsonLd) || og.title || embedded.title || "";
  const offers = extractOffersFromJsonLd(jsonLd);
  let price = offers.price;
  let currency = offers.currency;

  if (price === null && embedded.price !== undefined) {
    price = embedded.price;
    currency = embedded.currency || "RUB";
  }

  let images = og.images || embedded.images || [];
  images = extractImagesFromJsonLd(jsonLd, images);

  return { $, title, price, currency, images };
}

/** Маркетплейс без API: общие метаданные страницы и чистка хвостов заголовка. */
function parseMarketplaceHtml(url: string, html: string, titleJunk: RegExp[]): ParsedProduct {
  const meta = extractCommonProductMetadata(url, html);
  return {
    title: cleanTitle(meta.title, titleJunk),
    price: meta.price,
    currency: meta.currency,
    images: Array.from(new Set(meta.images)),
    url,
  };
}

async function parseOzon(url: string): Promise<ParsedProduct> {
  const productPath = extractOzonProductPath(url);
  if (!productPath) {
    throw new Error("Не удалось извлечь ID товара из URL Ozon");
  }

  // Сначала API
  const apiResult = await parseOzonViaApi(url, productPath).catch(() => null);
  if (apiResult) return apiResult;

  // Fallback на HTML
  return parseMarketplaceHtml(url, await fetchHtml(url), OZON_TITLE_JUNK);
}

// --- Generic ---

async function parseGeneric(
  url: string,
  html: string,
  loadedCheerio?: cheerio.CheerioAPI,
): Promise<ParsedProduct> {
  const meta = extractCommonProductMetadata(url, html, loadedCheerio);
  const $ = meta.$;

  const title = (meta.title || $("h1").first().text().trim() || "").replace(/\s+/g, " ").trim();
  let price = meta.price;
  let currency = meta.currency;
  const images = [...meta.images];

  if (!price) {
    const priceSelectors = ['[class*="price"]', "[data-price]", '[itemprop="price"]'];
    for (const selector of priceSelectors) {
      const el = $(selector).first();
      const text = el.attr("content") || el.text();
      const parsed = parsePrice(text);
      if (parsed) {
        price = parsed.price;
        currency = parsed.currency;
        break;
      }
    }
  }

  if (images.length === 0) {
    $("img").each((_, el) => {
      const src = $(el).attr("src");
      if (src && !src.includes("logo") && !src.includes("icon")) {
        images.push(src.startsWith("http") ? src : new URL(src, url).href);
        return false;
      }
    });
  }

  return {
    title,
    price,
    currency,
    images: Array.from(new Set(images)).slice(0, 5),
    url,
  };
}

// --- Fetch with redirects (manual) — короткие ссылки Ozon /t/, трекеры и т.п. ---

const MAX_REDIRECTS = 12;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;

type PublicRequest = Awaited<ReturnType<typeof fetchPublicUrl>>;

async function discardResponseBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {
    /* ignore */
  }
}

async function closeRequest(request: PublicRequest): Promise<void> {
  await discardResponseBody(request.response);
  await request.close();
}

function fetchPage(url: string): Promise<PublicRequest> {
  return fetchPublicUrl(url, {
    redirect: "manual",
    headers: { ...HEADERS, Referer: `${new URL(url).origin}/` },
    signal: AbortSignal.timeout(15000),
  });
}

/**
 * Проходит редиректы вручную, с проверкой SSRF на каждом шаге.
 * `headFirst` — разворачивание ссылки без скачивания HTML: HEAD, а при 405/501 — GET.
 */
async function fetchFollowingRedirects(
  url: string,
  headFirst: boolean,
): Promise<{ request: PublicRequest; finalUrl: string }> {
  let currentUrl = url;
  for (let step = 0; step <= MAX_REDIRECTS; step++) {
    let request = headFirst
      ? await fetchPublicUrl(currentUrl, {
          method: "HEAD",
          redirect: "manual",
          headers: {
            "User-Agent": HEADERS["User-Agent"],
            "Accept-Language": HEADERS["Accept-Language"],
            Accept: "*/*",
          },
          signal: AbortSignal.timeout(12000),
        })
      : await fetchPage(currentUrl);
    if (headFirst && (request.response.status === 405 || request.response.status === 501)) {
      await closeRequest(request);
      request = await fetchPage(currentUrl);
    }

    const { status, headers } = request.response;
    if (status < 300 || status >= 400) return { request, finalUrl: currentUrl };

    const location = headers.get("location");
    await closeRequest(request);
    if (!location) throw new Error("Redirect response without location header");
    currentUrl = new URL(location, currentUrl).toString();
  }
  throw new Error("Too many redirects");
}

/** Публичный канонический URL после валидации и цепочки редиректов (для парсера и ответа API). */
export async function resolveCanonicalProductUrl(url: string): Promise<string> {
  const { request, finalUrl } = await fetchFollowingRedirects(url, true);
  await closeRequest(request);
  return finalUrl;
}

async function readResponseTextWithLimit(response: Response): Promise<string> {
  if (!response.body) return "";

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      totalBytes += value.byteLength;
      if (totalBytes > MAX_RESPONSE_BYTES) {
        await reader.cancel().catch(() => undefined);
        throw new Error("Page too large to parse");
      }
      chunks.push(value);
    }
    return new TextDecoder().decode(Buffer.concat(chunks));
  } finally {
    reader.releaseLock();
  }
}

async function fetchHtml(url: string): Promise<string> {
  const { request } = await fetchFollowingRedirects(url, false);
  const { response } = request;
  try {
    if (!response.ok) throw new Error(`Failed to fetch URL: ${response.status}`);
    if (Number(response.headers.get("content-length")) > MAX_RESPONSE_BYTES) {
      throw new Error("Page too large to parse");
    }
    return await readResponseTextWithLimit(response);
  } finally {
    await closeRequest(request);
  }
}

// --- Main entry point ---

function mergeSpecializedWithOg(specialized: ParsedProduct, og: ParsedProduct): ParsedProduct {
  const images = specialized.images.length
    ? [...new Set([...specialized.images, ...og.images])].slice(0, 10)
    : og.images.length > 0
      ? og.images
      : specialized.images;
  return {
    ...specialized,
    images,
    ...(og.description ? { description: og.description } : {}),
  };
}

function mergeGenericWithOg(og: ParsedProduct, generic: ParsedProduct): ParsedProduct {
  const images = [...new Set([...generic.images, ...og.images])].slice(0, 10);
  const out: ParsedProduct = {
    title: (generic.title || og.title || "").replace(/\s+/g, " ").trim(),
    price: generic.price ?? og.price,
    currency: generic.currency || og.currency,
    images,
    url: generic.url,
  };
  if (og.description) out.description = og.description;
  return out;
}

/**
 * Парсинг для вишлиста: маркетплейсы + объединение с OG (описание, доп. картинки);
 * для обычных сайтов — один запрос HTML и слияние generic + Open Graph.
 */
export async function parseWishlistProductUrl(url: string): Promise<ParsedProduct> {
  const resolvedUrl = await resolveCanonicalProductUrl(url);
  const marketplace = detectMarketplace(resolvedUrl);

  if (marketplace === "wildberries" || marketplace === "ozon") {
    const specialized =
      marketplace === "wildberries"
        ? await parseWildberries(resolvedUrl)
        : await parseOzon(resolvedUrl);
    try {
      const html = await fetchHtml(resolvedUrl);
      const og = parseOpenGraphFromHtml(html, resolvedUrl);
      return mergeSpecializedWithOg(specialized, og);
    } catch {
      return specialized;
    }
  }

  const html = await fetchHtml(resolvedUrl);

  if (marketplace === "aliexpress") {
    const specialized = parseMarketplaceHtml(resolvedUrl, html, ALIEXPRESS_TITLE_JUNK);
    const og = parseOpenGraphFromHtml(html, resolvedUrl);
    return mergeSpecializedWithOg(specialized, og);
  }

  const $ = cheerio.load(html);
  const og = parseOpenGraphFromHtml(html, resolvedUrl, $);
  const generic = await parseGeneric(resolvedUrl, html, $);
  return mergeGenericWithOg(og, generic);
}
