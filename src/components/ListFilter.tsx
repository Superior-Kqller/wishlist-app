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
import { useI18n } from "@/components/i18n/language-provider";

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
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-2 flex-wrap shrink-0">
      <Select
        value={selectedListId ?? "all"}
        onValueChange={(v) => onListChange(v === "all" ? null : v)}
      >
        <SelectTrigger className="h-10 w-full min-w-0 max-w-[180px] sm:w-[180px]">
          <SelectValue placeholder={t("Подборка")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("Все подборки")}</SelectItem>
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
          className="h-10"
          title={t("Изменить подборку")}
        >
          <Pencil className="w-4 h-4" />
        </Button>
      )}
      <Button type="button" variant="outline" size="sm" onClick={onCreateClick} className="h-10">
        <ListPlus className="w-4 h-4 mr-2" />
        {t("Создать подборку")}
      </Button>
    </div>
  );
}
