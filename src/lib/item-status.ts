export type ItemStatus = "AVAILABLE" | "CLAIMED" | "PURCHASED";

type TransitionOptions = {
  actorUserId: string;
  ownerUserId: string;
  claimerUserId: string | null;
};

export function canTransitionStatus(
  from: ItemStatus,
  to: ItemStatus,
  options: TransitionOptions
): boolean {
  if (from === to) return true;

  if (from === "AVAILABLE" && to === "CLAIMED") return true;

  if (from === "CLAIMED" && to === "PURCHASED") {
    return (
      options.actorUserId === options.ownerUserId ||
      options.actorUserId === options.claimerUserId
    );
  }

  if (from === "CLAIMED" && to === "AVAILABLE") {
    return (
      options.actorUserId === options.ownerUserId ||
      options.actorUserId === options.claimerUserId
    );
  }

  // Для MVP запрещаем возврат из purchased в claimed/available.
  return false;
}

export function getNextStatusActionLabel(status: ItemStatus): string {
  if (status === "AVAILABLE") return "Забронировать";
  if (status === "CLAIMED") return "Отметить купленным";
  return "Уже куплено";
}

export function hasConflictingStatusPayload(input: {
  status?: ItemStatus;
  purchased?: boolean;
}): boolean {
  return input.status !== undefined && input.purchased !== undefined;
}

