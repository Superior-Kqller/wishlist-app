import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRateLimit = vi.fn();
const mockGetSessionUserIdVerified = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: mockRateLimit,
  rateLimitPresets: {
    default: { maxRequests: 60, windowMs: 60000 },
    read: { maxRequests: 100, windowMs: 60000 },
  },
}));

vi.mock("@/lib/auth-utils", () => ({
  getSessionUserIdVerified: mockGetSessionUserIdVerified,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: mockFindUnique,
      update: mockUpdate,
    },
  },
}));

describe("PATCH /api/users/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue(null);
    mockGetSessionUserIdVerified.mockResolvedValue("user-1");
    mockUpdate.mockResolvedValue({
      id: "user-1",
      username: "user1",
      name: "Новое имя",
      avatarUrl: null,
      role: "USER",
      telegramId: null,
      telegramUsername: null,
      telegramLinkedAt: null,
      telegramConfirmedAt: null,
      telegramNotificationsEnabled: false,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
  });

  it("rejects password changes through the profile endpoint", async () => {
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/users/me", {
      method: "PATCH",
      body: JSON.stringify({ name: "Новое имя", password: "Strong1!" }),
      headers: { "content-type": "application/json" },
    });

    const response = await PATCH(req as never);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({
      error: "Для смены пароля используйте отдельную форму",
    });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("still updates regular profile fields", async () => {
    const { PATCH } = await import("./route");
    const req = new Request("http://localhost/api/users/me", {
      method: "PATCH",
      body: JSON.stringify({ name: "Новое имя" }),
      headers: { "content-type": "application/json" },
    });

    const response = await PATCH(req as never);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.name).toBe("Новое имя");
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { name: "Новое имя" },
      select: {
        id: true,
        username: true,
        name: true,
        avatarUrl: true,
        role: true,
        telegramId: true,
        telegramUsername: true,
        telegramLinkedAt: true,
        telegramConfirmedAt: true,
        telegramNotificationsEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  });
});
