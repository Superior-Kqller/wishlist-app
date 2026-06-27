import { describe, it, expect } from "vitest";
import { filterAndSortWishlistItems } from "./filter-wishlist-items";
import type { WishlistItem } from "@/types";

function item(partial: Partial<WishlistItem> & Pick<WishlistItem, "id">): WishlistItem {
  return {
    title: "t",
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
    claimedAt: null,
    userId: "u1",
    listId: null,
    category: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    user: { id: "u1", name: "U", avatarUrl: null },
    claimedByUser: null,
    ...partial,
  };
}

describe("filterAndSortWishlistItems", () => {
  it("скрывает купленные при showPurchased=false", () => {
    const a = item({ id: "1", purchased: false, createdAt: "2020-01-01T00:00:00.000Z" });
    const b = item({ id: "2", purchased: true, createdAt: "2021-01-01T00:00:00.000Z" });
    const out = filterAndSortWishlistItems([a, b], {
      sortBy: "newest",
      showPurchased: false,
      effectiveSelectedCategories: [],
    });
    expect(out.map((x) => x.id)).toEqual(["1"]);
  });

  it("скрывает товары со статусом PURCHASED при showPurchased=false", () => {
    const available = item({ id: "1", status: "AVAILABLE" });
    const purchasedByStatus = item({ id: "2", status: "PURCHASED", purchased: false });

    const out = filterAndSortWishlistItems([available, purchasedByStatus], {
      sortBy: "newest",
      showPurchased: false,
      effectiveSelectedCategories: [],
    });

    expect(out.map((x) => x.id)).toEqual(["1"]);
  });

  it("фильтрует по категориям и сортирует по приоритету", () => {
    const low = item({
      id: "1",
      priority: 1,
      category: "electronics",
      createdAt: "2020-01-01T00:00:00.000Z",
    });
    const high = item({
      id: "2",
      priority: 5,
      category: "electronics",
      createdAt: "2019-01-01T00:00:00.000Z",
    });
    const other = item({
      id: "3",
      priority: 5,
      category: "books",
      createdAt: "2018-01-01T00:00:00.000Z",
    });

    const out = filterAndSortWishlistItems([low, high, other], {
      sortBy: "priority-high",
      showPurchased: true,
      effectiveSelectedCategories: ["electronics"],
    });

    expect(out.map((x) => x.id)).toEqual(["2", "1"]);
  });
});
