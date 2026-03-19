import { describe, it, expect } from "vitest";
import { filterListsBySelectedUser } from "./list-filter-client";
import type { ListWithMeta, UserWithStats } from "@/types";

const lists: ListWithMeta[] = [
  {
    id: "l-me",
    name: "Моя",
    userId: "u1",
    createdAt: "",
    updatedAt: "",
    _count: { items: 1 },
    viewerIds: [],
  },
  {
    id: "l-other",
    name: "Чужая",
    userId: "u2",
    createdAt: "",
    updatedAt: "",
    _count: { items: 2 },
    viewerIds: [],
  },
];

const users: UserWithStats[] = [
  {
    id: "u1",
    username: "a",
    name: "A",
    role: "USER",
    createdAt: "",
    updatedAt: "",
    stats: {
      totalItems: 1,
      unpurchasedItems: 1,
      totalWishlistValue: 0,
      totalPurchasedValue: 0,
      currency: "RUB",
    },
  },
  {
    id: "u2",
    username: "b",
    name: "B",
    role: "USER",
    createdAt: "",
    updatedAt: "",
    stats: {
      totalItems: 2,
      unpurchasedItems: 2,
      totalWishlistValue: 0,
      totalPurchasedValue: 0,
      currency: "RUB",
    },
  },
];

describe("filterListsBySelectedUser", () => {
  it("в режиме «все» возвращает все подборки", () => {
    expect(filterListsBySelectedUser(lists, users, "u1", null)).toEqual(lists);
  });

  it("в режиме «мои» — только подборки текущего пользователя", () => {
    expect(filterListsBySelectedUser(lists, users, "u1", "me")).toEqual([
      lists[0],
    ]);
    expect(filterListsBySelectedUser(lists, users, "u1", "u1")).toEqual([
      lists[0],
    ]);
  });

  it("для выбранного другого пользователя — только его подборки", () => {
    expect(filterListsBySelectedUser(lists, users, "u1", "u2")).toEqual([
      lists[1],
    ]);
  });

  it("если выбран неизвестный userId — пустой массив", () => {
    expect(filterListsBySelectedUser(lists, users, "u1", "ghost")).toEqual([]);
  });

  it("пустой список подборок — пустой результат во всех режимах", () => {
    const empty: ListWithMeta[] = [];
    expect(filterListsBySelectedUser(empty, users, "u1", null)).toEqual([]);
    expect(filterListsBySelectedUser(empty, users, "u1", "me")).toEqual([]);
    expect(filterListsBySelectedUser(empty, users, "u1", "u2")).toEqual([]);
  });
});
