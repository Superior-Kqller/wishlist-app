import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

interface RateLimitOptions {
  /** Максимальное количество запросов */
  maxRequests: number;
  /** Окно времени в миллисекундах */
  windowMs: number;
  /** Использовать IP вместо userId (для неавторизованных) */
  useIP?: boolean;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (для production лучше использовать Redis)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Очистка устаревших записей (вызывается при каждом запросе для экономии памяти)
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
  // Ограничиваем размер хранилища (макс 10000 записей)
  if (rateLimitStore.size > 10000) {
    const entries = Array.from(rateLimitStore.entries())
      .sort((a, b) => a[1].resetAt - b[1].resetAt);
    const toDelete = entries.slice(0, entries.length - 10000);
    for (const [key] of toDelete) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Получить IP адрес из запроса
 */
function getClientIP(req: NextRequest): string {
  // Проверяем заголовки в порядке приоритета
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    // x-forwarded-for может содержать несколько IP через запятую
    return forwarded.split(",")[0].trim();
  }

  const realIP = req.headers.get("x-real-ip");
  if (realIP) {
    return realIP.trim();
  }

  // Если IP не найден, используем fallback
  return "unknown";
}

/**
 * Получить идентификатор для rate limiting
 */
async function getRateLimitKey(
  req: NextRequest,
  useIP: boolean
): Promise<string | null> {
  if (useIP) {
    const ip = getClientIP(req);
    return `ip:${ip}`;
  }

  const session = await getServerSession(authOptions);
  const userId = (session?.user as { id?: string } | undefined)?.id;
  return userId ? `user:${userId}` : null;
}

/**
 * Проверить rate limit
 */
function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetAt: number } {
  // Периодическая очистка устаревших записей
  if (Math.random() < 0.01) { // ~1% запросов
    cleanupExpiredEntries();
  }

  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: maxRequests - 1, resetAt };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: entry.resetAt,
  };
}

/**
 * Rate limiting middleware для API routes
 */
export async function rateLimit(
  req: NextRequest,
  options: RateLimitOptions
): Promise<NextResponse | null> {
  const key = await getRateLimitKey(req, options.useIP ?? false);

  if (!key) {
    // Если требуется авторизация, но пользователь не авторизован
    if (!options.useIP) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    return null;
  }

  const result = checkRateLimit(key, options.maxRequests, options.windowMs);

  if (!result.allowed) {
    const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
    return NextResponse.json(
      {
        error: "Too Many Requests",
        message: "Слишком много запросов. Попробуйте позже.",
        retryAfter,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(options.maxRequests),
          "X-RateLimit-Remaining": String(result.remaining),
          "X-RateLimit-Reset": String(result.resetAt),
        },
      }
    );
  }

  return null; // Продолжить выполнение
}

/**
 * Preset конфигурации для разных типов endpoints
 */
export const rateLimitPresets = {
  /** Для парсинга URL (тяжелая операция) */
  parse: { maxRequests: 10, windowMs: 60_000 }, // 10 req/min
  /** Для обычных CRUD операций */
  default: { maxRequests: 60, windowMs: 60_000 }, // 60 req/min
  /** Для чтения данных */
  read: { maxRequests: 100, windowMs: 60_000 }, // 100 req/min
  /** Для авторизации (защита от brute force) */
  auth: { maxRequests: 5, windowMs: 15 * 60_000, useIP: true }, // 5 req/15min по IP
} as const;
