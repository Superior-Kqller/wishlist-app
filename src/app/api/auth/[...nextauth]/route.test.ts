import { beforeEach, describe, expect, it, vi } from "vitest";

const mockHandler = vi.fn(async () => new Response("ok", { status: 200 }));
const mockRateLimit = vi.fn();
const mockNextAuth = vi.fn(() => mockHandler);
const mockAuthOptions = { providers: [] };

vi.mock("next-auth", () => ({
  default: mockNextAuth,
}));

vi.mock("@/lib/auth", () => ({
  authOptions: mockAuthOptions,
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: mockRateLimit,
  rateLimitPresets: {
    auth: { maxRequests: 5, windowMs: 900000, useIP: true },
  },
}));

describe("auth route rate limit for credentials", () => {
  const routeContext = {
    params: Promise.resolve({ nextauth: ["callback", "credentials"] }),
  };

  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("возвращает 429 для POST credentials callback при превышении лимита (включая trailing slash)", async () => {
    mockRateLimit.mockResolvedValueOnce(new Response("Too Many Requests", { status: 429 }));
    const { POST } = await import("./route");

    const req = new Request("http://localhost/api/auth/callback/credentials/", {
      method: "POST",
      headers: { "x-forwarded-for": "1.2.3.4" },
    });

    const response = await POST(req as never, routeContext as never);

    expect(response.status).toBe(429);
    expect(mockRateLimit).toHaveBeenCalledTimes(1);
    expect(mockHandler).not.toHaveBeenCalled();
  });

  it("проксирует credentials POST в handler, если rateLimit вернул null", async () => {
    mockRateLimit.mockResolvedValueOnce(null);
    const { POST } = await import("./route");

    const req = new Request("http://localhost/api/auth/callback/credentials", {
      method: "POST",
      headers: { "x-forwarded-for": "1.2.3.4" },
    });

    const response = await POST(req as never, routeContext as never);

    expect(response.status).toBe(200);
    expect(mockRateLimit).toHaveBeenCalledTimes(1);
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  it("не применяет auth rate limit для прочих auth POST путей", async () => {
    mockRateLimit.mockResolvedValueOnce(null);
    const { POST } = await import("./route");

    const req = new Request("http://localhost/api/auth/signin", {
      method: "POST",
    });

    const response = await POST(req as never, routeContext as never);

    expect(response.status).toBe(200);
    expect(mockRateLimit).not.toHaveBeenCalled();
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  it("GET остаётся проксированным в NextAuth handler", async () => {
    const { GET } = await import("./route");

    const req = new Request("http://localhost/api/auth/session", {
      method: "GET",
    });

    const response = await GET(req);

    expect(response.status).toBe(200);
    expect(mockRateLimit).not.toHaveBeenCalled();
    expect(mockHandler).toHaveBeenCalledTimes(1);
  });

  it("инициализирует NextAuth с authOptions", async () => {
    await import("./route");
    expect(mockNextAuth).toHaveBeenCalledWith(mockAuthOptions);
  });
});
