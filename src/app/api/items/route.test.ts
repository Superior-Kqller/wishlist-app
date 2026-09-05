import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRateLimit = vi.fn();
const mockGetSessionUserIdVerified = vi.fn();
const mockFindUniqueList = vi.fn();
const mockItemCreate = vi.fn();
const mockItemFindMany = vi.fn();
const mockNotifyItemCreated = vi.fn();

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
    item: {
      create: mockItemCreate,
      findMany: mockItemFindMany,
    },
    list: {
      findUnique: mockFindUniqueList,
    },
  },
}));

const mockGetVisibleListIdsForUser = vi.fn();

vi.mock("@/lib/list-utils", () => ({
  canUserSeeList: vi.fn(),
  getVisibleListIdsForUser: mockGetVisibleListIdsForUser,
}));

vi.mock("@/lib/telegram/notifications", () => ({
  notifyItemCreated: mockNotifyItemCreated,
}));

describe("POST /api/items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue(null);
    mockGetSessionUserIdVerified.mockResolvedValue("user-1");
    mockFindUniqueList.mockResolvedValue({ userId: "user-1" });
    mockItemCreate.mockResolvedValue({
      id: "item-1",
      title: "Книга",
      url: null,
      price: null,
      currency: "RUB",
      priority: 3,
      images: [],
      notes: null,
      purchased: false,
      purchasedAt: null,
      status: "AVAILABLE",
      userId: "user-1",
      user: { id: "user-1", name: "Аня", avatarUrl: null },
      listId: "list-1",
      category: "books",
      comments: [],
      createdAt: new Date("2026-06-15T12:00:00.000Z"),
      updatedAt: new Date("2026-06-15T12:00:00.000Z"),
    });
  });

  it("notifies Telegram chats when a user adds an item", async () => {
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: "Книга",
        listId: "list-1",
      }),
    });

    const response = await POST(req as never);

    expect(response.status).toBe(201);
    expect(mockNotifyItemCreated).toHaveBeenCalledWith({
      actorUserId: "user-1",
      actorName: "Аня",
      itemId: "item-1",
      itemTitle: "Книга",
    });
  });
});

describe("GET /api/items", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue(null);
    mockGetSessionUserIdVerified.mockResolvedValue("user-1");
    mockGetVisibleListIdsForUser.mockResolvedValue(["list-1"]);
    mockItemFindMany.mockResolvedValue([]);
  });

  async function get(query: string) {
    const { GET } = await import("./route");
    const req = new NextRequest(`http://localhost/api/items?${query}`);
    return GET(req);
  }

  it("отбирает и упорядочивает каталог в запросе, а не после выдачи", async () => {
    await get("sort=price-low&categories=books,electronics&limit=30");

    const args = mockItemFindMany.mock.calls[0][0];
    expect(args.orderBy).toEqual([
      { currency: "asc" },
      { price: { sort: "asc", nulls: "last" } },
      { id: "desc" },
    ]);
    expect(args.where.AND).toContainEqual({ category: { in: ["books", "electronics"] } });
    expect(args.where.AND).toContainEqual({
      AND: [{ purchased: false }, { status: { not: "PURCHASED" } }],
    });
    // Берём на одну карточку больше — по ней и виден следующий шаг.
    expect(args.take).toBe(31);
  });

  it("показывает купленное только по явной просьбе", async () => {
    await get("purchased=show");

    const args = mockItemFindMany.mock.calls[0][0];
    expect(JSON.stringify(args.where)).not.toContain("PURCHASED");
  });

  it("возвращает курсор в том же порядке, в каком отдал страницу", async () => {
    const row = (id: string, price: number | null) => ({
      id,
      title: id,
      price,
      currency: "RUB",
      priority: 3,
      createdAt: new Date("2026-06-15T12:00:00.000Z"),
    });
    mockItemFindMany.mockResolvedValue([row("a", 100), row("b", 200)]);

    const response = await get("sort=price-low&limit=1");
    const body = await response.json();

    expect(body.pagination.hasMore).toBe(true);
    expect(body.pagination.nextCursor).toBe("RUB|100|a");
  });

  it("отвечает 400 на курсор, который не подходит выбранному порядку", async () => {
    const response = await get("sort=price-low&cursor=2026-01-01T00%3A00%3A00.000Z");

    expect(response.status).toBe(400);
    expect(mockItemFindMany).not.toHaveBeenCalled();
  });
});
