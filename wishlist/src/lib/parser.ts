import * as cheerio from "cheerio";

export interface ParsedProduct {
  title: string;
  price: number | null;
  currency: string;
  images: string[];
  url: string;
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

function detectMarketplace(
  url: string
): "wildberries" | "ozon" | "aliexpress" | "generic" {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes("wildberries")) return "wildberries";
  if (host.includes("ozon")) return "ozon";
  if (host.includes("aliexpress")) return "aliexpress";
  return "generic";
}

function extractJsonLd($: cheerio.CheerioAPI): any | null {
  const scripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < scripts.length; i++) {
    try {
      const data = JSON.parse($(scripts[i]).html() || "");
      if (data["@type"] === "Product" || data["@type"]?.includes?.("Product")) {
        return data;
      }
      // Some sites nest it in @graph
      if (data["@graph"]) {
        const product = data["@graph"].find(
          (item: any) =>
            item["@type"] === "Product" ||
            item["@type"]?.includes?.("Product")
        );
        if (product) return product;
      }
    } catch {
      continue;
    }
  }
  return null;
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

function parsePrice(
  text: string
): { price: number; currency: string } | null {
  if (!text) return null;

  // Remove spaces between digits (Russian formatting)
  const cleaned = text.replace(/\s/g, "").replace(/,/g, ".");

  // Try to extract number
  const match = cleaned.match(/([\d.]+)/);
  if (!match) return null;

  const price = parseFloat(match[1]);
  if (isNaN(price)) return null;

  // Detect currency
  let currency = "RUB";
  if (text.includes("$") || text.toLowerCase().includes("usd")) currency = "USD";
  else if (text.includes("€") || text.toLowerCase().includes("eur")) currency = "EUR";
  else if (text.includes("¥") || text.includes("CN")) currency = "CNY";

  return { price, currency };
}

/** Extract title/price/images from embedded JSON in HTML (SPA fallback) */
function extractFromEmbeddedJson(html: string, baseUrl: string): Partial<ParsedProduct> {
  const out: Partial<ParsedProduct> = {};
  // Title: "title":"..." or "name":"..." (unescaped content, max 300 chars)
  const titleMatch = html.match(
    /"(?:title|name|productName|product_name)"\s*:\s*"((?:[^"\\]|\\.){1,500})"/
  );
  if (titleMatch) {
    out.title = titleMatch[1]
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, c) => String.fromCharCode(parseInt(c, 16)))
      .replace(/\\"/g, '"')
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 500);
  }
  // Price: "price":123.45 or "currentPrice":123 or "lowPrice":123
  const priceMatch = html.match(
    /"(?:price|currentPrice|lowPrice|salePrice|basePrice)"\s*:\s*([\d.]+)/
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
  // Images: "image":"url" or "images":["url",...] or "mainImage":"url"
  const imgSingle = html.match(
    /"(?:image|mainImage|photo|img|picture)"\s*:\s*"((?:https?:)?\/\/[^"]+)"/
  );
  const imgArray = html.match(
    /"(?:images|gallery|photos)"\s*:\s*\[([\s\S]*?)\]/
  );
  const imageUrls: string[] = [];
  if (imgSingle) imageUrls.push(imgSingle[1].startsWith("http") ? imgSingle[1] : "https:" + imgSingle[1]);
  if (imgArray) {
    const urls = imgArray[1].match(/"((?:https?:)?\/\/[^"]+)"/g);
    if (urls) urls.forEach((u) => imageUrls.push(u.replace(/^"|"$/g, "").replace(/^\/\//, "https://")));
  }
  if (imageUrls.length) out.images = [...new Set(imageUrls)].slice(0, 10);
  return out;
}

async function parseWildberries(
  url: string,
  html: string
): Promise<ParsedProduct> {
  const $ = cheerio.load(html);
  const jsonLd = extractJsonLd($);
  const og = extractOpenGraph($);

  let title = jsonLd?.name || og.title || "";
  let price: number | null = null;
  let currency = "RUB";
  let images = og.images || [];

  if (jsonLd?.offers) {
    const offer = Array.isArray(jsonLd.offers)
      ? jsonLd.offers[0]
      : jsonLd.offers;
    price = parseFloat(offer?.price) || null;
    currency = offer?.priceCurrency || "RUB";
  }

  if (jsonLd?.image) {
    const jsonImages = Array.isArray(jsonLd.image)
      ? jsonLd.image
      : [jsonLd.image];
    images = [...jsonImages, ...images];
  }

  // Clean title
  title = title.replace(/\s+/g, " ").trim();

  return { title, price, currency, images: Array.from(new Set(images)), url };
}

async function parseOzon(
  url: string,
  html: string
): Promise<ParsedProduct> {
  const $ = cheerio.load(html);
  const jsonLd = extractJsonLd($);
  const og = extractOpenGraph($);
  const embedded = extractFromEmbeddedJson(html, url);

  let title = jsonLd?.name || og.title || embedded.title || "";
  let price: number | null = null;
  let currency = "RUB";
  let images = og.images || embedded.images || [];

  if (jsonLd?.offers) {
    const offer = Array.isArray(jsonLd.offers)
      ? jsonLd.offers[0]
      : jsonLd.offers;
    price = parseFloat(offer?.price) || null;
    currency = offer?.priceCurrency || "RUB";
  }
  if (price === null && embedded.price !== undefined) {
    price = embedded.price;
    currency = embedded.currency || "RUB";
  }

  if (jsonLd?.image) {
    const jsonImages = Array.isArray(jsonLd.image)
      ? jsonLd.image
      : [jsonLd.image];
    images = [...jsonImages, ...images];
  }

  title = title
    .replace(/\s+/g, " ")
    .replace(/ - купить.*$/i, "")
    .trim();

  return { title, price, currency, images: Array.from(new Set(images)), url };
}

async function parseAliexpress(
  url: string,
  html: string
): Promise<ParsedProduct> {
  const $ = cheerio.load(html);
  const jsonLd = extractJsonLd($);
  const og = extractOpenGraph($);
  const embedded = extractFromEmbeddedJson(html, url);

  let title = jsonLd?.name || og.title || embedded.title || "";
  let price: number | null = null;
  let currency = "RUB";
  let images = og.images || embedded.images || [];

  if (jsonLd?.offers) {
    const offer = Array.isArray(jsonLd.offers)
      ? jsonLd.offers[0]
      : jsonLd.offers;
    price = parseFloat(offer?.lowPrice || offer?.price) || null;
    currency = offer?.priceCurrency || "RUB";
  }
  if (price === null && embedded.price !== undefined) {
    price = embedded.price;
    currency = embedded.currency || "RUB";
  }

  if (jsonLd?.image) {
    const jsonImages = Array.isArray(jsonLd.image)
      ? jsonLd.image
      : [jsonLd.image];
    images = [...jsonImages, ...images];
  }

  // Clean up AliExpress title artifacts
  title = title
    .replace(/\s+/g, " ")
    .replace(/ \| .*$/, "")
    .replace(/ - AliExpress.*$/i, "")
    .trim();

  return { title, price, currency, images: Array.from(new Set(images)), url };
}

async function parseGeneric(
  url: string,
  html: string
): Promise<ParsedProduct> {
  const $ = cheerio.load(html);
  const jsonLd = extractJsonLd($);
  const og = extractOpenGraph($);
  const embedded = extractFromEmbeddedJson(html, url);

  let title =
    jsonLd?.name ||
    og.title ||
    embedded.title ||
    $("h1").first().text().trim() ||
    "";
  let price: number | null = null;
  let currency = "RUB";
  let images = og.images || embedded.images || [];

  if (jsonLd?.offers) {
    const offer = Array.isArray(jsonLd.offers)
      ? jsonLd.offers[0]
      : jsonLd.offers;
    price = parseFloat(offer?.price) || null;
    currency = offer?.priceCurrency || "RUB";
  }

  if (jsonLd?.image) {
    const jsonImages = Array.isArray(jsonLd.image)
      ? jsonLd.image
      : [jsonLd.image];
    images = [...jsonImages, ...images];
  }
  if (price === null && embedded.price !== undefined) {
    price = embedded.price;
    currency = embedded.currency || "RUB";
  }

  // If no price from JSON-LD, try to find price on page
  if (!price) {
    const priceSelectors = [
      '[class*="price"]',
      '[data-price]',
      '[itemprop="price"]',
    ];
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

  // If no images, grab the first large image
  if (images.length === 0) {
    $("img").each((_, el) => {
      const src = $(el).attr("src");
      if (src && !src.includes("logo") && !src.includes("icon")) {
        images.push(src.startsWith("http") ? src : new URL(src, url).href);
        return false; // break
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

function validateUrl(url: string): void {
  const parsed = new URL(url);

  // Block non-HTTP protocols
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP/HTTPS URLs are allowed");
  }

  // Block internal/private IPs
  const hostname = parsed.hostname.toLowerCase();
  const blocked = [
    "localhost",
    "127.",
    "0.0.0.0",
    "10.",
    "172.16.",
    "172.17.",
    "172.18.",
    "172.19.",
    "172.20.",
    "172.21.",
    "172.22.",
    "172.23.",
    "172.24.",
    "172.25.",
    "172.26.",
    "172.27.",
    "172.28.",
    "172.29.",
    "172.30.",
    "172.31.",
    "192.168.",
    "169.254.",
    "[::1]",
    "metadata.google",
  ];

  if (blocked.some((b) => hostname.startsWith(b) || hostname === b)) {
    throw new Error("Internal URLs are not allowed");
  }
}

export async function parseProductUrl(url: string): Promise<ParsedProduct> {
  validateUrl(url);

  const urlObj = new URL(url);
  const response = await fetch(url, {
    headers: {
      ...HEADERS,
      Referer: `${urlObj.protocol}//${urlObj.host}/`,
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.status}`);
  }

  // Limit response size to 5MB to prevent DoS
  const contentLength = response.headers.get("content-length");
  const size = contentLength ? Number(contentLength) : NaN;
  if (Number.isFinite(size) && size > 5 * 1024 * 1024) {
    throw new Error("Page too large to parse");
  }

  // Загружаем HTML с проверкой размера
  const html = await response.text();
  // Дополнительная проверка реального размера (на случай если content-length был неправильным)
  if (html.length > 5 * 1024 * 1024) {
    throw new Error("Page too large to parse");
  }
  const marketplace = detectMarketplace(url);

  switch (marketplace) {
    case "wildberries":
      return parseWildberries(url, html);
    case "ozon":
      return parseOzon(url, html);
    case "aliexpress":
      return parseAliexpress(url, html);
    default:
      return parseGeneric(url, html);
  }
}
