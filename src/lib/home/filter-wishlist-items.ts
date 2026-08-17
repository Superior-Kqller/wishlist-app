import type { WishlistItem } from "@/types";
import { isItemPurchased } from "@/lib/item-status";

export function filterAndSortWishlistItems(
  source: WishlistItem[],
  options: {
    sortBy: string;
    showPurchased: boolean;
    effectiveSelectedCategories: string[];
  },
): WishlistItem[] {
  const { sortBy, showPurchased, effectiveSelectedCategories } = options;
  let filtered = [...source];

  if (!showPurchased) {
    filtered = filtered.filter((item) => !isItemPurchased(item));
  }

  if (effectiveSelectedCategories.length > 0) {
    filtered = filtered.filter((item) =>
      Boolean(item.category && effectiveSelectedCategories.includes(item.category)),
    );
  }

  filtered.sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "oldest":
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case "priority-high":
        return b.priority - a.priority;
      case "priority-low":
        return a.priority - b.priority;
      case "price-high":
        return (b.price || 0) - (a.price || 0);
      case "price-low":
        return (a.price || 0) - (b.price || 0);
      default:
        return 0;
    }
  });

  return filtered;
}
