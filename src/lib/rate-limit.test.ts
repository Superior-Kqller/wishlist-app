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

    const options = { maxRequests: 3, windowMs: 60000, useIP: true };

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

    const options = { maxRequests: 2, windowMs: 60000, useIP: true };

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
});
