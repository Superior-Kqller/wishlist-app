import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";

vi.mock("next-auth", () => ({ default: () => vi.fn() }));
vi.mock("@/lib/auth", () => ({ authOptions: {} }));
vi.mock("@/lib/rate-limit", () => ({
  rateLimitPresets: { auth: {} },
  rateLimit: vi
    .fn()
    .mockResolvedValue(
      NextResponse.json(
        { error: "Too Many Requests", retryAfter: 600 },
        { status: 429, headers: { "Retry-After": "600" } },
      ),
    ),
}));

describe("POST credentials callback при превышении лимита", () => {
  it("отвечает 429 с url, который разбирает клиент NextAuth", async () => {
    const { POST } = await import("./route");
    const req = new NextRequest("http://localhost/api/auth/callback/credentials", {
      method: "POST",
    });

    const res = await POST(req, { params: Promise.resolve({ nextauth: [] }) });
    const data = await res.json();

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("600");
    expect(new URL(data.url).searchParams.get("error")).toBe("RateLimit:600");
  });
});
