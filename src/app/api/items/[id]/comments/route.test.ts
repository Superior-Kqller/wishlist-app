import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRateLimit = vi.fn();
const mockGetSessionUserIdVerified = vi.fn();
const mockCanUserSeeItem = vi.fn();
const mockItemCommentCreate = vi.fn();
const mockItemFindUnique = vi.fn();
const mockNotifyCommentCreated = vi.fn();

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

vi.mock("@/lib/list-utils", () => ({
  canUserSeeItem: mockCanUserSeeItem,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    item: {
      findUnique: mockItemFindUnique,
    },
    itemComment: {
      create: mockItemCommentCreate,
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/telegram/notifications", () => ({
  notifyCommentCreated: mockNotifyCommentCreated,
}));

describe("POST /api/items/[id]/comments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue(null);
    mockGetSessionUserIdVerified.mockResolvedValue("actor-1");
    mockCanUserSeeItem.mockResolvedValue(true);
    mockItemFindUnique.mockResolvedValue({
      id: "item-1",
      title: "Книга",
      userId: "item-author-1",
      list: {
        userId: "owner-1",
        viewers: [{ userId: "viewer-1" }, { userId: "actor-1" }],
      },
    });
    mockItemCommentCreate.mockResolvedValue({
      id: "comment-1",
      itemId: "item-1",
      userId: "actor-1",
      text: "Отличный вариант",
      createdAt: new Date("2026-06-15T12:00:00.000Z"),
      user: { id: "actor-1", name: "Аня", avatarUrl: null },
    });
  });

  it("notifies Telegram recipients when a comment is created", async () => {
    const { POST } = await import("./route");
    const req = new Request("http://localhost/api/items/item-1/comments", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "Отличный вариант" }),
    });

    const response = await POST(req as never, {
      params: Promise.resolve({ id: "item-1" }),
    });

    expect(response.status).toBe(201);
    expect(mockNotifyCommentCreated).toHaveBeenCalledWith({
      itemId: "item-1",
      itemTitle: "Книга",
      actorUserId: "actor-1",
      actorName: "Аня",
      commentText: "Отличный вариант",
      recipientUserIds: ["owner-1", "viewer-1", "actor-1"],
    });
  });
});
