type ListAccessInput = {
  ownerUserId: string;
  viewerUserIds: string[];
  actorUserId: string;
};

export function canViewList(input: ListAccessInput): boolean {
  if (input.actorUserId === input.ownerUserId) return true;
  return input.viewerUserIds.includes(input.actorUserId);
}
