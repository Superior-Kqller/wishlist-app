import * as cheerio from "cheerio";
import { promises as dns } from "node:dns";
import net from "node:net";

export interface ParsedProduct {
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
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
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

function isPrivateIP(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    const first = parts[0];
    const second = parts[1];

    // RFC1918 private ranges
    if (first === 10) return true;
    if (first === 172 && second >= 16 && second <= 31) return true;
    if (first === 192 && second === 168) return true;

    // Loopback, "this network", link-local
    if (first === 127) return true;
    if (first === 0) return true;
    if (first === 169 && second === 254) return true;

    // Shared Address Space (RFC6598): 100.64.0.0/10
    if (first === 100 && second >= 64 && second <= 127) return true;

    // Benchmarking/testing network (RFC2544): 198.18.0.0/15
    if (first === 198 && (second === 18 || second === 19)) return true;

    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    if (lower === "::1" || lower === "::") return true;
    if (lower.startsWith("fe80:")) return true;
    if (lower.startsWith("fc") || lower.startsWith("fd")) return true;
    if (lower.startsWith("::ffff:")) {
      const v4 = lower.slice(7);
      if (net.isIPv4(v4)) return isPrivateIP(v4);
    }
    return false;
  }
  return false;
}

export async function validateAndResolveUrl(url: string): Promise<void> {
  const parsed = new URL(url);

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP/HTTPS URLs are allowed");
  }

  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");

  if (net.isIP(hostname)) {
    if (isPrivateIP(hostname)) {
      throw new Error("Internal URLs are not allowed");
    }
    return;
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
}

// --- Marketplace detection ---

function detectMarketplace(
  url: string,
): "wildberries" | "ozon" | "aliexpress" | "generic" {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes("wildberries") || host.includes("wb.ru")) return "wildberries";
  if (host.includes("ozon")) return "ozon";
  if (host.includes("aliexpress")) return "aliexpress";
  return "generic";
}

// --- Shared extractors ---

function extractJsonLd($: cheerio.CheerioAPI): any | null {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const data = JSON.parse($(scripts[i]).html() || "");
      if (data["@type"] === "Product" || data["@type"]?.includes?.("Product")) {
        return data;
      }
      if (data["@graph"]) {
        const product = data["@graph"].find(
          (item: any) =>
            item["@type"] === "Product" || item["@type"]?.includes?.("Product"),
        );
        if (product) return product;
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
  try {
    return new URL(src.trim(), base).href;
  } catch {
    return null;
  }
}

/**
 * Извлекает Open Graph и связанные meta: заголовок, описание, картинки, цену (meta / JSON-LD offers).
 */
function parseOpenGraphFromHtml(html: string, pageUrl: string): ParsedProduct {
  const $ = cheerio.load(html);
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

function extractOpenGraph($: cheerio.CheerioAPI): Partial<ParsedProduct> {
  return {
    title:
      $('meta[property="og:title"]').attr("content") ||
      $("title").text() ||
      $("h1").first().text() ||
      "",
    images: [
      $('meta[property="og:image"]').attr("content"),
      $('meta[property="og:image:secure_url"]').attr("content"),
    ].filter(Boolean) as string[],
  };
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
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, c) =>
        String.fromCharCode(parseInt(c, 16)),
      )
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
  const imgArray = html.match(
    /"(?:images|gallery|photos)"\s*:\s*\[([\s\S]*?)\]/,
  );
  const imageUrls: string[] = [];
  if (imgSingle)
    imageUrls.push(
      imgSingle[1].startsWith("http") ? imgSingle[1] : "https:" + imgSingle[1],
    );
  if (imgArray) {
    const urls = imgArray[1].match(/"((?:https?:)?\/\/[^"]+)"/g);
    if (urls)
      urls.forEach((u) =>
        imageUrls.push(u.replace(/^"|"$/g, "").replace(/^\/\//, "https://")),
      );
  }
  if (imageUrls.length) out.images = [...new Set(imageUrls)].slice(0, 10);
  return out;
}

function extractOffersFromJsonLd(jsonLd: any): { price: number | null; currency: string } {
  if (!jsonLd?.offers) return { price: null, currency: "RUB" };
  const offer = Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : jsonLd.offers;
  const price = parseFloat(offer?.lowPrice || offer?.price) || null;
  const currency = offer?.priceCurrency || "RUB";
  return { price, currency };
}

function extractImagesFromJsonLd(jsonLd: any, existing: string[]): string[] {
  if (!jsonLd?.image) return existing;
  const jsonImages = Array.isArray(jsonLd.image) ? jsonLd.image : [jsonLd.image];
  return [...jsonImages, ...existing];
}

// --- Wildberries (internal API) ---

function extractWbArticle(url: string): string | null {
  const match = url.match(/\/catalog\/(\d+)/);
  return match ? match[1] : null;
}

function getWbImageUrl(id: number, photoIndex: number): string {
  const vol = Math.floor(id / 100000);
  const part = Math.floor(id / 1000);

  let basket: number;
  if (vol >= 0 && vol <= 143) basket = 1;
  else if (vol <= 287) basket = 2;
  else if (vol <= 431) basket = 3;
  else if (vol <= 719) basket = 4;
  else if (vol <= 1007) basket = 5;
  else if (vol <= 1061) basket = 6;
  else if (vol <= 1115) basket = 7;
  else if (vol <= 1169) basket = 8;
  else if (vol <= 1313) basket = 9;
  else if (vol <= 1601) basket = 10;
  else if (vol <= 1655) basket = 11;
  else if (vol <= 1919) basket = 12;
  else if (vol <= 2045) basket = 13;
  else if (vol <= 2189) basket = 14;
  else if (vol <= 2405) basket = 15;
  else if (vol <= 2621) basket = 16;
  else if (vol <= 2837) basket = 17;
  else basket = 18;

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

function findWidgetState(widgetStates: Record<string, string>, prefix: string): any | null {
  for (const [key, value] of Object.entries(widgetStates)) {
    if (key.startsWith(prefix)) {
      try {
        return JSON.parse(value);
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

  const heading = findWidgetState(ws, "webProductHeading");
  const priceWidget = findWidgetState(ws, "webPrice");
  const gallery = findWidgetState(ws, "webGallery");

  const title = (heading?.title || "")
    .replace(/\s+/g, " ")
    .replace(/ - купить.*$/i, "")
    .replace(/ \| OZON$/i, "")
    .trim();

  if (!title) return null;

  const price = parseOzonPriceString(
    priceWidget?.cardPrice || priceWidget?.price || priceWidget?.originalPrice || "",
  );

  const images: string[] = [];
  if (gallery?.coverImage) images.push(gallery.coverImage);
  if (gallery?.images && Array.isArray(gallery.images)) {
    for (const img of gallery.images) {
      const src = typeof img === "string" ? img : img?.src || img?.url;
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

async function parseOzonViaHtml(url: string, html: string): Promise<ParsedProduct> {
  const $ = cheerio.load(html);
  const jsonLd = extractJsonLd($);
  const og = extractOpenGraph($);
  const embedded = extractFromEmbeddedJson(html);

  let title = jsonLd?.name || og.title || embedded.title || "";
  let price: number | null = null;
  let currency = "RUB";
  let images = og.images || embedded.images || [];

  const offers = extractOffersFromJsonLd(jsonLd);
  price = offers.price;
  currency = offers.currency;

  if (price === null && embedded.price !== undefined) {
    price = embedded.price;
    currency = embedded.currency || "RUB";
  }

  images = extractImagesFromJsonLd(jsonLd, images);

  title = title
    .replace(/\s+/g, " ")
    .replace(/ - купить.*$/i, "")
    .replace(/ \| OZON$/i, "")
    .trim();

  return { title, price, currency, images: Array.from(new Set(images)), url };
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
  const html = await fetchHtml(url);
  return parseOzonViaHtml(url, html);
}

// --- AliExpress ---

async function parseAliexpress(
  url: string,
  html: string,
): Promise<ParsedProduct> {
  const $ = cheerio.load(html);
  const jsonLd = extractJsonLd($);
  const og = extractOpenGraph($);
  const embedded = extractFromEmbeddedJson(html);

  let title = jsonLd?.name || og.title || embedded.title || "";
  let price: number | null = null;
  let currency = "RUB";
  let images = og.images || embedded.images || [];

  const offers = extractOffersFromJsonLd(jsonLd);
  price = offers.price;
  currency = offers.currency;

  if (price === null && embedded.price !== undefined) {
    price = embedded.price;
    currency = embedded.currency || "RUB";
  }

  images = extractImagesFromJsonLd(jsonLd, images);

  title = title
    .replace(/\s+/g, " ")
    .replace(/ \| .*$/, "")
    .replace(/ - AliExpress.*$/i, "")
    .replace(/ купить.*$/i, "")
    .trim();

  return { title, price, currency, images: Array.from(new Set(images)), url };
}

// --- Generic ---

async function parseGeneric(
  url: string,
  html: string,
): Promise<ParsedProduct> {
  const $ = cheerio.load(html);
  const jsonLd = extractJsonLd($);
  const og = extractOpenGraph($);
  const embedded = extractFromEmbeddedJson(html);

  let title =
    jsonLd?.name || og.title || embedded.title || $("h1").first().text().trim() || "";
  let price: number | null = null;
  let currency = "RUB";
  let images = og.images || embedded.images || [];

  const offers = extractOffersFromJsonLd(jsonLd);
  price = offers.price;
  currency = offers.currency;

  images = extractImagesFromJsonLd(jsonLd, images);

  if (price === null && embedded.price !== undefined) {
    price = embedded.price;
    currency = embedded.currency || "RUB";
  }

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

  title = title.replace(/\s+/g, " ").trim();

  return {
    title,
    price,
    currency,
    images: Array.from(new Set(images)).slice(0, 5),
    url,
  };
}

// --- Redirect chain (HEAD + manual) — короткие ссылки Ozon /t/, трекеры и т.п. ---

const MAX_REDIRECT_CHAIN = 12;

async function discardResponseBody(response: Response): Promise<void> {
  try {
    if (response.body) {
      await response.body.cancel();
    }
  } catch {
    /* ignore */
  }
}

/**
 * Разворачивает цепочку редиректов без скачивания HTML: HEAD + redirect: "manual"
 * с проверкой SSRF на каждом шаге. При 405/501 на HEAD — один запрос GET с тем же режимом.
 */
async function expandRedirectChainHeadFirst(startUrl: string): Promise<string> {
  let currentUrl = startUrl;
  for (let step = 0; step <= MAX_REDIRECT_CHAIN; step++) {
    await validateAndResolveUrl(currentUrl);

    const baseInit: RequestInit = {
      redirect: "manual",
      headers: {
        "User-Agent": HEADERS["User-Agent"],
        "Accept-Language": HEADERS["Accept-Language"],
        Accept: "*/*",
      },
      signal: AbortSignal.timeout(12000),
    };

    let response = await fetch(currentUrl, { ...baseInit, method: "HEAD" });

    if (response.status === 405 || response.status === 501) {
      await discardResponseBody(response);
      response = await fetch(currentUrl, {
        ...baseInit,
        method: "GET",
        headers: {
          ...HEADERS,
          Referer: `${new URL(currentUrl).origin}/`,
        },
      });
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        await discardResponseBody(response);
        throw new Error("Redirect response without location header");
      }
      await discardResponseBody(response);
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }

    await discardResponseBody(response);
    return currentUrl;
  }
  throw new Error("Too many redirects");
}

/** Публичный канонический URL после валидации и цепочки редиректов (для парсера и ответа API). */
export async function resolveCanonicalProductUrl(url: string): Promise<string> {
  await validateAndResolveUrl(url);
  return expandRedirectChainHeadFirst(url);
}

// --- Fetch HTML helper ---

async function fetchWithSafeRedirects(
  url: string,
  init: RequestInit,
  maxRedirects: number
): Promise<{ response: Response; finalUrl: string }> {
  let currentUrl = url;
  for (let i = 0; i <= maxRedirects; i++) {
    await validateAndResolveUrl(currentUrl);
    const response = await fetch(currentUrl, {
      ...init,
      redirect: "manual",
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location) {
        throw new Error("Redirect response without location header");
      }
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    return { response, finalUrl: currentUrl };
  }
  throw new Error("Too many redirects");
}

async function fetchHtml(url: string): Promise<string> {
  const urlObj = new URL(url);
  const { response } = await fetchWithSafeRedirects(
    url,
    {
      headers: { ...HEADERS, Referer: `${urlObj.protocol}//${urlObj.host}/` },
      signal: AbortSignal.timeout(15000),
    },
    10
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status}`);
  }

  const contentLength = response.headers.get("content-length");
  const size = contentLength ? Number(contentLength) : NaN;
  if (Number.isFinite(size) && size > 5 * 1024 * 1024) {
    throw new Error("Page too large to parse");
  }

  const html = await response.text();
  if (html.length > 5 * 1024 * 1024) {
    throw new Error("Page too large to parse");
  }

  return html;
}

// --- Main entry point ---

async function parseProductUrlResolved(resolvedUrl: string): Promise<ParsedProduct> {
  const marketplace = detectMarketplace(resolvedUrl);

  if (marketplace === "wildberries") {
    return parseWildberries(resolvedUrl);
  }

  if (marketplace === "ozon") {
    return parseOzon(resolvedUrl);
  }

  const html = await fetchHtml(resolvedUrl);

  switch (marketplace) {
    case "aliexpress":
      return parseAliexpress(resolvedUrl, html);
    default:
      return parseGeneric(resolvedUrl, html);
  }
}

export async function parseProductUrl(url: string): Promise<ParsedProduct> {
  const resolvedUrl = await resolveCanonicalProductUrl(url);
  return parseProductUrlResolved(resolvedUrl);
}

function mergeSpecializedWithOg(
  specialized: ParsedProduct,
  og: ParsedProduct,
): ParsedProduct {
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
    const specialized = await parseProductUrlResolved(resolvedUrl);
    try {
      const html = await fetchHtml(resolvedUrl);
      const og = parseOpenGraphFromHtml(html, resolvedUrl);
      return mergeSpecializedWithOg(specialized, og);
    } catch {
      return specialized;
    }
  }

  if (marketplace === "aliexpress") {
    const html = await fetchHtml(resolvedUrl);
    const specialized = await parseAliexpress(resolvedUrl, html);
    const og = parseOpenGraphFromHtml(html, resolvedUrl);
    return mergeSpecializedWithOg(specialized, og);
  }

  const html = await fetchHtml(resolvedUrl);
  const og = parseOpenGraphFromHtml(html, resolvedUrl);
  const generic = await parseGeneric(resolvedUrl, html);
  return mergeGenericWithOg(og, generic);
}
