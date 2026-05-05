import { Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  getItemStatusLabel,
  getItemStatusTone,
} from "@/lib/item-status-presentation";
import { cn } from "@/lib/utils";
import type { ItemStatus } from "@/types";

type StatusBadgeProps = {
  status: ItemStatus;
  className?: string;
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("inline-flex items-center gap-1 text-xs", getItemStatusTone(status), className)}
    >
      {status === "CLAIMED" ? <Clock3 className="h-3 w-3" /> : null}
      {getItemStatusLabel(status)}
    </Badge>
  );
}
