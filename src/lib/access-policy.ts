type ListAccessInput = {
  ownerUserId: string;
  viewerUserIds: string[];
  actorUserId: string;
};

type ClaimAccessInput = {
  actorUserId: string;
  ownerUserId: string;
  claimerUserId: string | null;
  isVisibleToActor: boolean;
  status: "AVAILABLE" | "CLAIMED" | "PURCHASED";
};

export function canViewList(input: ListAccessInput): boolean {
  if (input.actorUserId === input.ownerUserId) return true;
  return input.viewerUserIds.includes(input.actorUserId);
}

export function canClaimItem(input: ClaimAccessInput): boolean {
  return input.isVisibleToActor && input.status === "AVAILABLE";
}

export function canSeeClaimerIdentity(input: {
  actorUserId: string;
  ownerUserId: string;
  claimerUserId: string | null;
  isClaimPrivate: boolean;
}): boolean {
  if (!input.claimerUserId) return false;
  if (!input.isClaimPrivate) return true;
  return (
    input.actorUserId === input.ownerUserId ||
    input.actorUserId === input.claimerUserId
  );
}

export function canUnclaimItem(input: ClaimAccessInput): boolean {
  if (input.status !== "CLAIMED") return false;
  return (
    input.actorUserId === input.ownerUserId ||
    input.actorUserId === input.claimerUserId
  );
}

