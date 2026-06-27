import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRateLimit = vi.fn();
const mockGetSessionUserIdVerified = vi.fn();
const mockFindUniqueList = vi.fn();
const mockItemCreate = vi.fn();
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
      findMany: vi.fn(),
    },
    list: {
      findUnique: mockFindUniqueList,
    },
  },
}));

vi.mock("@/lib/list-utils", () => ({
  canUserSeeList: vi.fn(),
  getVisibleListIdsForUser: vi.fn(),
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
      claimedByUserId: null,
      claimedByUser: null,
      claimedAt: null,
      userId: "user-1",
      user: { id: "user-1", name: "Аня", avatarUrl: null },
      listId: "list-1",
      list: { userId: "user-1" },
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
