import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("next-auth", () => ({
  getServerSession: vi.fn().mockResolvedValue({ user: { id: "user1", role: "USER" } }),
}));

vi.mock("./auth", () => ({
  authOptions: {},
}));

vi.mock("ioredis", () => {
  throw new Error("No valkey in test");
});

describe("rate-limit (in-memory fallback)", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("разрешает запросы в пределах лимита", async () => {
    const { rateLimit } = await import("./rate-limit");

    const mockReq = new NextRequest("http://localhost/", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });

    const options = { category: "read", maxRequests: 3, windowMs: 60000, useIP: true } as const;

    const r1 = await rateLimit(mockReq, options);
    expect(r1).toBeNull();

    const r2 = await rateLimit(mockReq, options);
    expect(r2).toBeNull();

    const r3 = await rateLimit(mockReq, options);
    expect(r3).toBeNull();
  });

  it("блокирует после превышения лимита", async () => {
    const { rateLimit } = await import("./rate-limit");

    const mockReq = new NextRequest("http://localhost/", {
      headers: { "x-forwarded-for": "10.0.0.1" },
    });

    const options = { category: "read", maxRequests: 2, windowMs: 60000, useIP: true } as const;

    await rateLimit(mockReq, options);
    await rateLimit(mockReq, options);
    const r3 = await rateLimit(mockReq, options);

    expect(r3).not.toBeNull();
    expect(r3?.status).toBe(429);
  });

  it("содержит стандартные пресеты", async () => {
    const { rateLimitPresets } = await import("./rate-limit");

    expect(rateLimitPresets.parse.maxRequests).toBe(10);
    expect(rateLimitPresets.default.maxRequests).toBe(60);
    expect(rateLimitPresets.read.maxRequests).toBe(100);
    expect(rateLimitPresets.auth.useIP).toBe(true);
  });

  it("считает разбор ссылок отдельно от чтений того же человека", async () => {
    const { rateLimit, rateLimitPresets } = await import("./rate-limit");
    const req = new NextRequest("http://localhost/");

    // Читаем ровно столько, сколько раньше выбирало весь запас разбора.
    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect(await rateLimit(req, rateLimitPresets.read)).toBeNull();
    }

    expect(await rateLimit(req, rateLimitPresets.parse)).toBeNull();
    expect(await rateLimit(req, rateLimitPresets.default)).toBeNull();
  });

  it("исчерпанная категория не задевает остальные", async () => {
    const { rateLimit, rateLimitPresets } = await import("./rate-limit");
    const req = new NextRequest("http://localhost/");

    for (let attempt = 0; attempt < 10; attempt += 1) {
      expect(await rateLimit(req, rateLimitPresets.parse)).toBeNull();
    }
    const blocked = await rateLimit(req, rateLimitPresets.parse);

    expect(blocked?.status).toBe(429);
    expect(await rateLimit(req, rateLimitPresets.read)).toBeNull();
  });

  it("разделяет людей внутри одной категории", async () => {
    vi.resetModules();
    const nextAuth = await import("next-auth");
    const getServerSession = vi.mocked(nextAuth.getServerSession);
    const { rateLimit } = await import("./rate-limit");
    const req = new NextRequest("http://localhost/");
    const options = { category: "parse", maxRequests: 1, windowMs: 60000 } as const;

    getServerSession.mockResolvedValue({ user: { id: "user-a", role: "USER" } } as never);
    expect(await rateLimit(req, options)).toBeNull();
    expect((await rateLimit(req, options))?.status).toBe(429);

    getServerSession.mockResolvedValue({ user: { id: "user-b", role: "USER" } } as never);
    expect(await rateLimit(req, options)).toBeNull();
  });
});
