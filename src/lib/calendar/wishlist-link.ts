export function thematicWishlistHref(personId: string, wishlistId: string): string {
  const params = new URLSearchParams({
    userId: personId,
    listId: wishlistId,
  });
  return `/?${params.toString()}`;
}
