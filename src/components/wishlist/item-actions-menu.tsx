"use client";

import type { SyntheticEvent } from "react";
import { Check, MoreHorizontal, Pencil, Trash2, Undo2 } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/components/i18n/language-provider";
import { getPurchaseToggleTarget, isItemPurchased, type ItemStatus } from "@/lib/item-status";
import type { WishlistItem } from "@/types";

type ItemActionsMenuProps = {
  item: WishlistItem;
  statusPending: boolean;
  onEdit: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
  onSetStatus: (id: string, status: ItemStatus) => void;
  label: string;
  size?: ButtonProps["size"];
  triggerClassName?: string;
  iconClassName?: string;
  testId?: string;
};

/**
 * Меню владельца над одним желанием: куплено, изменить, удалить.
 *
 * Одно на карточку, строку списка и строку таблицы. Пока меню было выписано в
 * каждой из них, пункты расходились по мелочи — где-то забывали остановить
 * всплытие клика, и выбор пункта заодно открывал карточку.
 */
export function ItemActionsMenu({
  item,
  statusPending,
  onEdit,
  onDelete,
  onSetStatus,
  label,
  size = "icon",
  triggerClassName,
  iconClassName,
  testId,
}: ItemActionsMenuProps) {
  const { t } = useI18n();
  const isBought = isItemPurchased(item);
  // Меню лежит внутри кликабельной карточки или строки: клик не должен её открыть.
  const stop = (event: SyntheticEvent) => event.stopPropagation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={size}
          data-testid={testId}
          aria-label={label}
          className={triggerClassName}
          onClick={stop}
        >
          <MoreHorizontal className={iconClassName} aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={(event) => {
            stop(event);
            onSetStatus(item.id, getPurchaseToggleTarget(item));
          }}
          disabled={statusPending}
        >
          {isBought ? <Undo2 className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          {isBought ? t("Вернуть в доступные") : t("Отметить купленным")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(event) => {
            stop(event);
            onEdit(item);
          }}
          disabled={statusPending}
        >
          <Pencil className="h-4 w-4" />
          {t("Редактировать")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(event) => {
            stop(event);
            onDelete(item.id);
          }}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          {t("Удалить")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
