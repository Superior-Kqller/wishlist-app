"use client";

import { Badge } from "@/components/ui/badge";
import { cn, getTagColor } from "@/lib/utils";
import { Tag } from "@/types";
import { X } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";

interface TagFilterProps {
  tags: Tag[];
  selectedTags: string[];
  onToggleTag: (tagId: string) => void;
  onClearTags: () => void;
}

export function TagFilter({
  tags,
  selectedTags,
  onToggleTag,
  onClearTags,
}: TagFilterProps) {
  const { t } = useI18n();

  if (tags.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5 min-h-0">
      <span className="text-[11px] text-muted-foreground font-medium shrink-0 hidden sm:inline">{t("Теги:")}</span>
      <div className="flex flex-1 min-w-0 overflow-x-auto scrollbar-none py-0.5 -mx-1 px-1 gap-1 flex-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag.id);
          const color = tag.color === "#6366f1" ? getTagColor(tag.name) : tag.color;
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onToggleTag(tag.id)}
              aria-pressed={isSelected}
              aria-label={`${isSelected ? t("Убрать тег") : t("Добавить тег")}: ${tag.name}`}
              className={cn(
                "min-h-9 shrink-0 rounded-full transition-opacity duration-150 focus-ring",
                !isSelected && "hover:opacity-90 active:opacity-80"
              )}
            >
              <Badge
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "min-h-7 cursor-pointer rounded-full px-2.5 py-0.5 text-[11px] transition-colors",
                  isSelected && "border-transparent"
                )}
                style={
                  isSelected
                    ? { backgroundColor: color, borderColor: color }
                    : { borderColor: color, color }
                }
              >
                {tag.name}
              </Badge>
            </button>
          );
        })}
        {selectedTags.length > 0 && (
          <button
            type="button"
            onClick={onClearTags}
            className="flex min-h-9 shrink-0 items-center gap-1 rounded-sm py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground focus-ring"
            aria-label={t("Сбросить выбранные теги")}
          >
            <X className="w-3 h-3" />
            <span className="sm:inline">{t("Сбросить")}</span>
          </button>
        )}
      </div>
    </div>
  );
}
