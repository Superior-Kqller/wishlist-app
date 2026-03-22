import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const mockFindUnique = vi.fn();
const mockFindMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    list: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
    },
    item: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
  },
}));

import { canUserSeeList, canUserSeeItem, getVisibleListIdsForUser } from "./list-utils";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("canUserSeeList", () => {
  it("возвращает true для владельца подборки", async () => {
    mockFindUnique.mockResolvedValue({
      userId: "user-1",
      viewers: [],
    });
    expect(await canUserSeeList("list-1", "user-1")).toBe(true);
  });

  it("возвращает true для viewer подборки", async () => {
    mockFindUnique.mockResolvedValue({
      userId: "user-1",
      viewers: [{ userId: "user-2" }],
    });
    expect(await canUserSeeList("list-1", "user-2")).toBe(true);
  });

  it("возвращает false для постороннего пользователя", async () => {
    mockFindUnique.mockResolvedValue({
      userId: "user-1",
      viewers: [{ userId: "user-2" }],
    });
    expect(await canUserSeeList("list-1", "user-3")).toBe(false);
  });

  it("возвращает false для несуществующей подборки", async () => {
    mockFindUnique.mockResolvedValue(null);
    expect(await canUserSeeList("no-list", "user-1")).toBe(false);
  });
});

describe("canUserSeeItem", () => {
  it("возвращает false для товара без подборки (listId=null)", async () => {
    mockFindUnique.mockResolvedValueOnce({ listId: null });
    expect(await canUserSeeItem("item-1", "user-1")).toBe(false);
  });

  it("возвращает false для несуществующего товара", async () => {
    mockFindUnique.mockResolvedValueOnce(null);
    expect(await canUserSeeItem("no-item", "user-1")).toBe(false);
  });

  it("возвращает true для товара в подборке, к которой пользователь имеет доступ", async () => {
    mockFindUnique
      .mockResolvedValueOnce({ listId: "list-1" })
      .mockResolvedValueOnce({ userId: "user-1", viewers: [] });
    expect(await canUserSeeItem("item-1", "user-1")).toBe(true);
  });

  it("возвращает false для товара в подборке, к которой пользователь НЕ имеет доступа", async () => {
    mockFindUnique
      .mockResolvedValueOnce({ listId: "list-1" })
      .mockResolvedValueOnce({ userId: "user-1", viewers: [] });
    expect(await canUserSeeItem("item-1", "user-999")).toBe(false);
  });
});

describe("getVisibleListIdsForUser", () => {
  it("возвращает ID подборок, где пользователь владелец или viewer", async () => {
    mockFindMany.mockResolvedValue([
      { id: "list-1" },
      { id: "list-2" },
    ]);
    const ids = await getVisibleListIdsForUser("user-1");
    expect(ids).toEqual(["list-1", "list-2"]);
  });

  it("возвращает пустой массив, если подборок нет", async () => {
    mockFindMany.mockResolvedValue([]);
    const ids = await getVisibleListIdsForUser("user-1");
    expect(ids).toEqual([]);
  });
});
