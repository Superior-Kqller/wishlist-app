import type { WishlistItem } from "@/types";

export function filterAndSortWishlistItems(
  source: WishlistItem[],
  options: {
    sortBy: string;
    showPurchased: boolean;
    effectiveSelectedTags: string[];
  },
): WishlistItem[] {
  const { sortBy, showPurchased, effectiveSelectedTags } = options;
  let filtered = [...source];

  if (!showPurchased) {
    filtered = filtered.filter((item) => !item.purchased);
  }

  if (effectiveSelectedTags.length > 0) {
    filtered = filtered.filter((item) =>
      effectiveSelectedTags.some((tagId) =>
        item.tags.some((t) => t.id === tagId),
      ),
    );
  }

  filtered.sort((a, b) => {
    switch (sortBy) {
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
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
