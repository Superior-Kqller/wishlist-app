import { normalizeItemStatus } from "@/lib/item-status";
import type { ItemStatus } from "@/types";

/**
 * Убирает поле `list` из ответа API (служебная связь для maskClaimedByUser),
 * чтобы не светить его в JSON клиенту.
 */
export function itemResponseWithoutList<T extends { list: unknown }>(
  masked: T,
): Omit<T, "list"> {
  const { list, ...response } = masked;
  void list;

  if (
    "status" in response &&
    "purchased" in response &&
    typeof response.purchased === "boolean"
  ) {
    const itemResponse = response as Omit<T, "list"> & {
      status: ItemStatus;
      purchased: boolean;
      claimedByUserId?: string | null;
      claimedByUser?: unknown;
      claimedAt?: Date | string | null;
    };

    return {
      ...itemResponse,
      status: normalizeItemStatus(itemResponse.status, itemResponse.purchased),
      claimedByUserId: itemResponse.status === "CLAIMED" ? null : itemResponse.claimedByUserId,
      claimedByUser: itemResponse.status === "CLAIMED" ? null : itemResponse.claimedByUser,
      claimedAt: itemResponse.status === "CLAIMED" ? null : itemResponse.claimedAt,
    };
  }

  return response;
}
