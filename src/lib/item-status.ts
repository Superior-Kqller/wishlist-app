export type ItemStatus = "AVAILABLE" | "CLAIMED" | "PURCHASED";

type TransitionOptions = {
  actorUserId: string;
  ownerUserId: string;
  claimerUserId: string | null;
};

export function canTransitionStatus(
  from: ItemStatus,
  to: ItemStatus,
  options: TransitionOptions,
): boolean {
  if (to === "CLAIMED") return false;
  if (from === "CLAIMED" && to === "AVAILABLE") return false;

  const normalizedFrom = normalizeItemStatus(from, false);
  if (normalizedFrom === to) return true;

  if (from === to) return true;

  if (normalizedFrom === "AVAILABLE" && to === "PURCHASED") {
    return options.actorUserId === options.ownerUserId;
  }

  return false;
}

export function getNextStatusActionLabel(status: ItemStatus): string {
  if (status === "AVAILABLE") return "Отметить купленным";
  if (status === "CLAIMED") return "Отметить купленным";
  return "Уже куплено";
}

export function normalizeItemStatus(status: ItemStatus, purchased: boolean): ItemStatus {
  if (status === "CLAIMED") return purchased ? "PURCHASED" : "AVAILABLE";
  return status;
}

/*
 * «Куплено» — один факт, выведенный из двух полей.
 *
 * Покупка хранится дважды: булев `purchased` и `status`. Записи расходятся —
 * импорт и Telegram-действия проставляют поля разными путями, — и пока каждый
 * экран выводил факт сам, карточка успевала зачеркнуть товар, который в
 * диалоге оставался доступным. Вопрос задаётся здесь и только здесь.
 */
export function isItemPurchased(item: { status: ItemStatus; purchased: boolean }): boolean {
  return item.purchased || item.status === "PURCHASED";
}

/** Куда ведёт переключатель «куплено» — от того же факта, а не от одного поля. */
export function getPurchaseToggleTarget(item: {
  status: ItemStatus;
  purchased: boolean;
}): "AVAILABLE" | "PURCHASED" {
  return isItemPurchased(item) ? "AVAILABLE" : "PURCHASED";
}

export function hasConflictingStatusPayload(input: {
  status?: ItemStatus;
  purchased?: boolean;
}): boolean {
  return input.status !== undefined && input.purchased !== undefined;
}
