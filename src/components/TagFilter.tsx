"use client";

import { Badge } from "@/components/ui/badge";
import { cn, getTagColor } from "@/lib/utils";
import { Tag } from "@/types";
import { X } from "lucide-react";

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
  if (tags.length === 0) return null;

  return (
    <div className="flex items-center gap-2 min-h-0">
      <span className="text-xs text-muted-foreground font-medium shrink-0 hidden sm:inline">Теги:</span>
      <div className="flex flex-1 min-w-0 overflow-x-auto scrollbar-none py-0.5 -mx-1 px-1 gap-1.5 flex-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tags.map((tag) => {
          const isSelected = selectedTags.includes(tag.id);
          const color = tag.color === "#6366f1" ? getTagColor(tag.name) : tag.color;
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => onToggleTag(tag.id)}
              aria-pressed={isSelected}
              aria-label={`${isSelected ? "Убрать тег" : "Добавить тег"}: ${tag.name}`}
              className={cn(
                "min-h-[44px] shrink-0 rounded-full transition-transform duration-150 focus-ring",
                isSelected ? "scale-[0.98]" : "hover:scale-[1.02] active:scale-95"
              )}
            >
              <Badge
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "min-h-[34px] cursor-pointer px-3 py-1 text-xs transition-all hover:opacity-80",
                  isSelected && "shadow-sm"
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
            className="flex min-h-[44px] shrink-0 items-center gap-1 rounded-sm py-1 text-xs text-muted-foreground transition-colors hover:text-foreground focus-ring"
            aria-label="Сбросить выбранные теги"
          >
            <X className="w-3 h-3" />
            <span className="sm:inline">Сбросить</span>
          </button>
        )}
      </div>
    </div>
  );
}
