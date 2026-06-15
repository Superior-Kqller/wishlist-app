import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRateLimit = vi.fn();
const mockGetSessionUserIdVerified = vi.fn();
const mockTagUpsert = vi.fn();
const mockItemCreate = vi.fn();
const mockListFindUnique = vi.fn();

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: mockRateLimit,
  rateLimitPresets: {
    default: { maxRequests: 60, windowMs: 60000 },
  },
}));

vi.mock("@/lib/auth-utils", () => ({
  getSessionUserIdVerified: mockGetSessionUserIdVerified,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: { create: mockItemCreate },
    list: { findUnique: mockListFindUnique },
    tag: { upsert: mockTagUpsert },
  },
}));

vi.mock("@/lib/utils", () => ({
  getTagColor: (tagName: string) => `color:${tagName}`,
}));

describe("POST /api/items/import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue(null);
    mockGetSessionUserIdVerified.mockResolvedValue("user-1");
    mockTagUpsert.mockImplementation(async ({ where }) => ({
      id: `tag-${where.name}`,
      name: where.name,
      color: `color:${where.name}`,
    }));
    mockItemCreate.mockResolvedValue({ id: "item-1" });
  });

  it("rejects anonymous imports", async () => {
    mockGetSessionUserIdVerified.mockResolvedValue(null);
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/items/import", {
        method: "POST",
        body: JSON.stringify([]),
        headers: { "content-type": "application/json" },
      }) as never,
    );

    expect(response.status).toBe(401);
    expect(mockItemCreate).not.toHaveBeenCalled();
  });

  it("rejects invalid import payloads", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/items/import", {
        method: "POST",
        body: JSON.stringify([{ title: "", priority: 9 }]),
        headers: { "content-type": "application/json" },
      }) as never,
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Ошибка проверки данных");
    expect(mockItemCreate).not.toHaveBeenCalled();
  });

  it("imports exported JSON items with tags and preserved item state", async () => {
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/items/import", {
        method: "POST",
        body: JSON.stringify([
          {
            title: "Книга",
            url: "https://example.com/book",
            price: 1200,
            currency: "RUB",
            priority: 4,
            tags: "Книги, Дом",
            notes: "Подарочное издание",
            purchased: true,
            createdAt: "2026-01-02T03:04:05.000Z",
          },
        ]),
        headers: { "content-type": "application/json" },
      }) as never,
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ imported: 1 });
    expect(mockTagUpsert).toHaveBeenCalledTimes(2);
    expect(mockTagUpsert).toHaveBeenNthCalledWith(1, {
      where: { name: "книги" },
      update: {},
      create: { name: "книги", color: "color:книги" },
    });
    expect(mockItemCreate).toHaveBeenCalledWith({
      data: {
        title: "Книга",
        url: "https://example.com/book",
        price: 1200,
        currency: "RUB",
        priority: 4,
        images: [],
        notes: "Подарочное издание",
        purchased: true,
        purchasedAt: new Date("2026-01-02T03:04:05.000Z"),
        status: "PURCHASED",
        userId: "user-1",
        listId: null,
        createdAt: new Date("2026-01-02T03:04:05.000Z"),
        tags: {
          connect: [{ id: "tag-книги" }, { id: "tag-дом" }],
        },
      },
    });
  });

  it("imports into an owned target list when listId is provided", async () => {
    mockListFindUnique.mockResolvedValue({ userId: "user-1" });
    const { POST } = await import("./route");

    const response = await POST(
      new Request("http://localhost/api/items/import", {
        method: "POST",
        body: JSON.stringify({ listId: "list-1", items: [{ title: "Чай" }] }),
        headers: { "content-type": "application/json" },
      }) as never,
    );

    expect(response.status).toBe(200);
    expect(mockListFindUnique).toHaveBeenCalledWith({
      where: { id: "list-1" },
      select: { userId: true },
    });
    expect(mockItemCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ listId: "list-1" }),
      }),
    );
  });
});
