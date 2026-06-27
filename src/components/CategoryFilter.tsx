"use client";

import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import type { ProductCategoryOption } from "@/lib/categories";

interface CategoryFilterProps {
  categories: ProductCategoryOption[];
  selectedCategories: string[];
  onToggleCategory: (categoryId: string) => void;
  onClearCategories: () => void;
}

export function CategoryFilter({
  categories,
  selectedCategories,
  onToggleCategory,
  onClearCategories,
}: CategoryFilterProps) {
  const { language, t } = useI18n();

  if (categories.length === 0) return null;

  return (
    <div className="flex min-h-0 items-center gap-1.5">
      <span className="hidden shrink-0 text-[11px] font-medium text-muted-foreground sm:inline">
        {t("Категории:")}
      </span>
      <div className="-mx-1 flex min-w-0 flex-1 flex-nowrap gap-1 overflow-x-auto px-1 py-0.5 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map((category) => {
          const isSelected = selectedCategories.includes(category.id);
          const label = language === "en" ? category.labelEn : category.label;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onToggleCategory(category.id)}
              aria-pressed={isSelected}
              aria-label={`${isSelected ? t("Убрать категорию") : t("Добавить категорию")}: ${label}`}
              className={cn(
                "min-h-9 shrink-0 rounded-full transition-opacity duration-150 focus-ring",
                !isSelected && "hover:opacity-90 active:opacity-80",
              )}
            >
              <Badge
                variant={isSelected ? "default" : "outline"}
                className={cn(
                  "min-h-7 cursor-pointer gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] transition-colors",
                  isSelected && "border-transparent",
                )}
              >
                <span aria-hidden>{category.icon}</span>
                {label}
              </Badge>
            </button>
          );
        })}
        {selectedCategories.length > 0 ? (
          <button
            type="button"
            onClick={onClearCategories}
            className="flex min-h-9 shrink-0 items-center gap-1 rounded-sm py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground focus-ring"
            aria-label={t("Сбросить выбранные категории")}
          >
            <X className="h-3 w-3" />
            <span className="sm:inline">{t("Сбросить")}</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}
