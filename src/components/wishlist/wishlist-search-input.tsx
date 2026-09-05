"use client";

import { SearchField } from "@/components/ui/search-field";
import { cn } from "@/lib/utils";
import { filterBarTriggerClass } from "@/lib/filter-toolbar-styles";
import { useI18n } from "@/components/i18n/language-provider";

interface WishlistSearchInputProps {
  search: string;
  onSearchChange: (value: string) => void;
  /**
   * Оформление под место: в ряду фильтров поиск вторичен и равняется по высоте
   * ряда, на мобильной панели он стоит один и держит собственную высоту.
   */
  variant?: "toolbar" | "mobile";
  className?: string;
}

const INPUT_CLASS_BY_VARIANT = {
  // Поиск в ряду фильтров не несёт собственной тени: он вторичный контрол,
  // а выглядел самым тяжёлым объектом экрана.
  toolbar: cn(
    filterBarTriggerClass,
    "rounded-lg border-border/55 bg-[hsl(var(--surface-3)/0.7)] pl-10 pr-3 text-sm placeholder:text-muted-foreground-subtle hover:border-primary/32 hover:bg-[hsl(var(--surface-3)/0.85)]",
  ),
  mobile:
    "h-11 min-h-[44px] rounded-xl border-border/55 bg-[linear-gradient(180deg,hsl(var(--surface-3)_/_0.82),hsl(var(--surface-2)_/_0.66))] pl-10 text-sm shadow-[inset_0_1px_0_hsl(var(--foreground)/0.045)] placeholder:text-muted-foreground-subtle",
} as const;

export function WishlistSearchInput({
  search,
  onSearchChange,
  variant = "toolbar",
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
      inputClassName={INPUT_CLASS_BY_VARIANT[variant]}
    />
  );
}
