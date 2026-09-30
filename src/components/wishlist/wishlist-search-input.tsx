"use client";

import { SearchField } from "@/components/ui/search-field";
import { cn } from "@/lib/utils";
import { uiLayout } from "@/lib/ui-contract";
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

// Пилюля поиска (DESIGN.md → «Поиск»): одна форма, высота по месту.
const INPUT_CLASS_BY_VARIANT = {
  toolbar: cn(uiLayout.filterBarTrigger, "pl-10 pr-4 text-sm placeholder:text-muted-foreground"),
  mobile: "h-11 min-h-[44px] pl-10 text-base placeholder:text-muted-foreground",
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
      iconClassName="left-4"
      inputClassName={INPUT_CLASS_BY_VARIANT[variant]}
      data-hotkey="search"
    />
  );
}
