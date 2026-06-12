const COLLAPSED_ACTIVITY_LIMIT = 3;

type ActivityTimestamp = {
  updatedAt: string;
};

export function getVisibleRecentActivityItems<T extends ActivityTimestamp>(
  items: readonly T[],
  { expanded }: { expanded: boolean },
) {
  const sortedItems = [...items].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  return expanded ? sortedItems : sortedItems.slice(0, COLLAPSED_ACTIVITY_LIMIT);
}

export function hasMoreRecentActivityItems(items: readonly ActivityTimestamp[]) {
  return items.length > COLLAPSED_ACTIVITY_LIMIT;
}
