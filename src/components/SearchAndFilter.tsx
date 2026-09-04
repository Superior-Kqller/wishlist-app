"use client";

import { SearchField } from "@/components/ui/search-field";
import { cn } from "@/lib/utils";
import { filterBarTriggerClass } from "@/lib/filter-toolbar-styles";
import { useI18n } from "@/components/i18n/language-provider";

interface WishlistSearchInputProps {
  search: string;
  onSearchChange: (value: string) => void;
  className?: string;
}

export function WishlistSearchInput({
  search,
  onSearchChange,
  className,
}: WishlistSearchInputProps) {
  const { t } = useI18n();

  return (
    <SearchField
      value={search}
      onValueChange={onSearchChange}
      placeholder={t("Поиск…")}
      aria-label={t("Поиск")}
      wrapperClassName={cn("group", className)}
      iconClassName="left-3.5 text-muted-foreground/55 transition-colors duration-200 group-focus-within:text-primary-accent/85"
      inputClassName={cn(
        filterBarTriggerClass,
        // Поиск равняется по общей высоте ряда и больше не несёт собственной
        // тени: он вторичный контрол, а выглядел самым тяжёлым объектом экрана.
        "rounded-lg border-border/55 bg-[hsl(var(--surface-3)/0.7)] pl-10 pr-3 text-sm placeholder:text-muted-foreground-subtle hover:border-primary/32 hover:bg-[hsl(var(--surface-3)/0.85)]",
      )}
    />
  );
}
