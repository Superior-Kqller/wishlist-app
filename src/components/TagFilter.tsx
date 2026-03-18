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
              onClick={() => onToggleTag(tag.id)}
              className={cn(
                "shrink-0 transition-transform duration-150 rounded-full focus-ring",
                isSelected ? "scale-[0.98]" : "hover:scale-[1.02] active:scale-95"
              )}
            >
              <Badge
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "cursor-pointer transition-all hover:opacity-80 text-xs px-2 py-0.5",
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
            onClick={onClearTags}
            className="shrink-0 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors py-1 rounded-sm focus-ring"
          >
            <X className="w-3 h-3" />
            <span className="sm:inline">Сбросить</span>
          </button>
        )}
      </div>
    </div>
  );
}
