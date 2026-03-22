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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
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
      effectiveSelectedTags: [],
    });
    expect(out.map((x) => x.id)).toEqual(["1"]);
  });

  it("фильтрует по тегам и сортирует по приоритету", () => {
    const t1 = { id: "tag1", name: "a", color: "#000" };
    const low = item({
      id: "1",
      priority: 1,
      tags: [t1],
      createdAt: "2020-01-01T00:00:00.000Z",
    });
    const high = item({
      id: "2",
      priority: 5,
      tags: [t1],
      createdAt: "2019-01-01T00:00:00.000Z",
    });
    const out = filterAndSortWishlistItems([low, high], {
      sortBy: "priority-high",
      showPurchased: true,
      effectiveSelectedTags: ["tag1"],
    });
    expect(out.map((x) => x.id)).toEqual(["2", "1"]);
  });
});
