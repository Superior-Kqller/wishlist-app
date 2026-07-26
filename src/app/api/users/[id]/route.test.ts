import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRateLimit = vi.fn();
const mockRequireAdmin = vi.fn();
const mockFindUnique = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: mockRateLimit,
  rateLimitPresets: { read: {} },
}));
vi.mock("@/lib/auth-utils", () => ({ requireAdmin: mockRequireAdmin }));
vi.mock("@/lib/prisma", () => ({
  prisma: { user: { findUnique: mockFindUnique } },
}));

describe("GET /api/users/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue(null);
    mockRequireAdmin.mockResolvedValue(undefined);
    mockFindUnique.mockResolvedValue({
      id: "user-2",
      username: "user2",
      name: "Анна",
      avatarUrl: null,
      role: "USER",
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      _count: { items: 0 },
    });
  });

  it("не запрашивает пол и согласие для чужого профиля", async () => {
    const { GET } = await import("./route");
    const response = await GET(
      new Request("http://localhost/api/users/user-2") as never,
      { params: Promise.resolve({ id: "user-2" }) },
    );

    expect(response.status).toBe(200);
    const query = mockFindUnique.mock.calls[0][0];
    expect(query.select).not.toHaveProperty("gender");
    expect(query.select).not.toHaveProperty("thematicHolidayConsent");
    expect(JSON.stringify(await response.json())).not.toContain("gender");
  });
});
