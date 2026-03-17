import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  useIP?: boolean;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// --- Valkey client (lazy singleton, via ioredis) ---

let redisClient: import("ioredis").default | null = null;
let redisFailed = false;

async function getRedis(): Promise<import("ioredis").default | null> {
  if (redisFailed) return null;
  if (redisClient) return redisClient;

  const url = process.env.REDIS_URL;
  if (!url) return null;

  try {
    const { default: Redis } = await import("ioredis");
    const opts = { maxRetriesPerRequest: 1, connectTimeout: 2000, lazyConnect: true };
    redisClient = url.startsWith("/")
      ? new Redis({ ...opts, path: url })
      : new Redis(url, opts);
    await redisClient.connect();
    return redisClient;
  } catch {
    redisFailed = true;
    return null;
  }
}

// --- In-memory fallback ---

const memoryStore = new Map<string, RateLimitEntry>();

function cleanupMemoryStore() {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (now > entry.resetAt) memoryStore.delete(key);
  }
  if (memoryStore.size > 10000) {
    const sorted = Array.from(memoryStore.entries()).sort((a, b) => a[1].resetAt - b[1].resetAt);
    for (const [key] of sorted.slice(0, sorted.length - 10000)) {
      memoryStore.delete(key);
    }
  }
}

function checkMemoryRateLimit(key: string, max: number, windowMs: number) {
  if (Math.random() < 0.01) cleanupMemoryStore();

  const now = Date.now();
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }

  if (entry.count >= max) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: max - entry.count, resetAt: entry.resetAt };
}

// --- Valkey rate limit ---

async function checkRedisRateLimit(
  redis: import("ioredis").default,
  key: string,
  max: number,
  windowMs: number,
) {
  const redisKey = `rl:${key}`;
  const ttlSec = Math.ceil(windowMs / 1000);

  try {
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.expire(redisKey, ttlSec);
    }

    const ttl = await redis.ttl(redisKey);
    const resetAt = Date.now() + ttl * 1000;

    if (count > max) {
      return { allowed: false, remaining: 0, resetAt };
    }
    return { allowed: true, remaining: max - count, resetAt };
  } catch {
    return checkMemoryRateLimit(key, max, windowMs);
  }
}

// --- Helpers ---

function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIP = req.headers.get("x-real-ip");
  if (realIP) return realIP.trim();
  return "unknown";
}

async function getRateLimitKey(req: NextRequest, useIP: boolean): Promise<string | null> {
  if (useIP) return `ip:${getClientIP(req)}`;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  return userId ? `user:${userId}` : null;
}

// --- Main ---

export async function rateLimit(
  req: NextRequest,
  options: RateLimitOptions,
): Promise<NextResponse | null> {
  const key = await getRateLimitKey(req, options.useIP ?? false);

  if (!key) {
    if (!options.useIP) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return null;
  }

  const redis = await getRedis();
  const result = redis
    ? await checkRedisRateLimit(redis, key, options.maxRequests, options.windowMs)
    : checkMemoryRateLimit(key, options.maxRequests, options.windowMs);

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
      },
    );
  }

  return null;
}

export const rateLimitPresets = {
  parse: { maxRequests: 10, windowMs: 60_000 },
  default: { maxRequests: 60, windowMs: 60_000 },
  read: { maxRequests: 100, windowMs: 60_000 },
  auth: { maxRequests: 5, windowMs: 15 * 60_000, useIP: true },
} as const;
