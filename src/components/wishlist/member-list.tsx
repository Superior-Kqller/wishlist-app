import { UserAvatar } from "@/components/UserAvatar";
import { Badge } from "@/components/ui/badge";
import { uiSurface } from "@/lib/ui-contract";
import type { UserWithStats } from "@/types";

type MemberListProps = {
  users: UserWithStats[];
  viewerIds: string[];
  ownerId?: string | null;
  emptyLabel?: string;
};

export function MemberList({
  users,
  viewerIds,
  ownerId,
  emptyLabel = "Только владелец",
}: MemberListProps) {
  const owner = ownerId ? users.find((user) => user.id === ownerId) : null;
  const viewers = viewerIds
    .map((id) => users.find((user) => user.id === id))
    .filter((user): user is UserWithStats => Boolean(user));
  const members = owner
    ? [owner, ...viewers.filter((user) => user.id !== owner.id)]
    : viewers;

  if (members.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {members.map((user) => (
        <div
          key={user.id}
          className={`inline-flex min-w-0 items-center gap-2 rounded-lg px-2.5 py-1.5 ${uiSurface.chip}`}
        >
          <UserAvatar
            avatarUrl={user.avatarUrl}
            name={user.name}
            userId={user.id}
            size="sm"
          />
          <span className="max-w-[8rem] truncate text-sm text-foreground">
            {user.name}
          </span>
          {ownerId === user.id ? (
            <Badge variant="secondary" className="text-[10px]">
              Владелец
            </Badge>
          ) : null}
        </div>
      ))}
    </div>
  );
}
