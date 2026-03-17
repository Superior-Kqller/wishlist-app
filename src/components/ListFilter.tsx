"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ListPlus, Pencil } from "lucide-react";
import { ListWithMeta } from "@/types";

interface ListFilterProps {
  selectedListId: string | null;
  onListChange: (listId: string | null) => void;
  lists: ListWithMeta[];
  onCreateClick: () => void;
  onEditClick?: () => void;
}

export function ListFilter({
  selectedListId,
  onListChange,
  lists,
  onCreateClick,
  onEditClick,
}: ListFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap shrink-0">
      <Select
        value={selectedListId ?? "all"}
        onValueChange={(v) => onListChange(v === "all" ? null : v)}
      >
        <SelectTrigger className="w-full min-w-0 max-w-[180px] sm:w-[180px] min-h-[36px]">
          <SelectValue placeholder="Подборка" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Все подборки</SelectItem>
          {lists.map((list) => (
            <SelectItem key={list.id} value={list.id}>
              {list.name} ({list._count.items})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {onEditClick && selectedListId && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onEditClick}
          className="min-h-[36px]"
          title="Изменить подборку"
        >
          <Pencil className="w-4 h-4" />
        </Button>
      )}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onCreateClick}
        className="min-h-[36px]"
      >
        <ListPlus className="w-4 h-4 mr-2" />
        Создать подборку
      </Button>
    </div>
  );
}
