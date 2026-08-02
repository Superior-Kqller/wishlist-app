"use client";

import { useId, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { useI18n } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import type { ProductCategoryOption } from "@/lib/categories";

interface CategoryFilterProps {
  categories: ProductCategoryOption[];
  selectedCategories: string[];
  onToggleCategory: (categoryId: string) => void;
  onClearCategories: () => void;
  presentation?: "inline" | "disclosure";
}

export function CategoryFilter({
  categories,
  selectedCategories,
  onToggleCategory,
  onClearCategories,
  presentation = "inline",
}: CategoryFilterProps) {
  const { language, t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();

  if (categories.length === 0) return null;

  const selectedOptions = categories.filter((category) => selectedCategories.includes(category.id));

  const renderCategoryButton = (category: ProductCategoryOption) => {
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
          "min-h-9 shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors focus-ring",
          isSelected
            ? "border-primary/36 bg-primary/14 text-foreground"
            : "border-border bg-transparent text-foreground hover:border-primary/28 hover:bg-accent/55",
        )}
      >
        <span aria-hidden>{category.icon}</span> {label}
      </button>
    );
  };

  if (presentation === "disclosure") {
    const triggerLabel =
      selectedOptions.length > 0 ? `${t("Категории")}: ${selectedOptions.length}` : t("Категории");

    return (
      <div className="min-w-0 space-y-2" data-slot="category-filter-disclosure">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={contentId}
            aria-label={triggerLabel}
            onClick={() => setIsOpen((open) => !open)}
            className="flex min-h-9 items-center gap-2 rounded-lg border border-border/80 bg-[hsl(var(--surface-3)/0.78)] px-3 text-sm font-medium text-foreground transition-colors hover:border-primary/28 hover:bg-[hsl(var(--surface-4)/0.86)] focus-ring"
          >
            <span>{t("Категории")}</span>
            {selectedOptions.length > 0 ? (
              <span
                aria-hidden
                className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/16 px-1 text-[10px] font-semibold"
              >
                {selectedOptions.length}
              </span>
            ) : null}
            <ChevronDown
              aria-hidden
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180",
              )}
            />
          </button>

          {selectedOptions.map((category) => {
            const label = language === "en" ? category.labelEn : category.label;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => onToggleCategory(category.id)}
                aria-label={`${t("Убрать категорию")}: ${label}`}
                className="flex min-h-9 items-center gap-1.5 rounded-full border border-primary/36 bg-primary/14 px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors hover:bg-primary/20 focus-ring"
              >
                <span aria-hidden>{category.icon}</span>
                <span>{label}</span>
                <X aria-hidden className="h-3 w-3 text-muted-foreground" />
              </button>
            );
          })}

          {selectedOptions.length > 0 ? (
            <button
              type="button"
              onClick={onClearCategories}
              className="min-h-9 rounded-md px-2 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-ring"
              aria-label={t("Очистить категории")}
            >
              {t("Очистить")}
            </button>
          ) : null}
        </div>

        <div
          id={contentId}
          hidden={!isOpen}
          role="group"
          aria-label={t("Категории")}
          className="flex flex-wrap gap-1.5 rounded-xl border border-border/70 bg-[hsl(var(--surface-2)/0.58)] p-2"
        >
          {categories.map(renderCategoryButton)}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 items-center gap-1.5">
      <span className="hidden shrink-0 text-[11px] font-medium text-muted-foreground sm:inline">
        {t("Категории:")}
      </span>
      <div className="-mx-1 flex min-w-0 flex-1 flex-nowrap gap-1 overflow-x-auto px-1 py-0.5 scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {categories.map(renderCategoryButton)}
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
