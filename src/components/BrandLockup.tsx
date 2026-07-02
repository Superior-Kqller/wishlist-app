"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/language-provider";

interface BrandLockupProps {
  className?: string;
  compact?: boolean;
}

export function BrandLockup({ className, compact = false }: BrandLockupProps) {
  const { t } = useI18n();

  return (
    <div className={cn("flex min-w-0 items-center gap-1.5 sm:gap-3", className)}>
      <span
        aria-hidden
        className={cn(
          "relative grid h-7 w-7 shrink-0 place-items-center overflow-hidden rounded-lg border border-primary/30 bg-[radial-gradient(circle_at_32%_22%,hsl(var(--foreground)/0.18),transparent_24%),linear-gradient(145deg,hsl(var(--primary)/0.62),hsl(var(--theme-warm)/0.34)_54%,hsl(var(--surface-3)))] shadow-[inset_0_1px_0_hsl(var(--foreground)/0.18),0_10px_24px_hsl(var(--primary)/0.13)] sm:h-10 sm:w-10 sm:rounded-xl",
          compact && "sm:h-9 sm:w-9",
        )}
      >
        <span className="absolute inset-[3px] rounded-[36%_64%_38%_62%/58%_34%_66%_42%] border border-white/12 bg-[linear-gradient(145deg,hsl(var(--surface-1)/0.22),hsl(var(--background)/0.28))] shadow-[inset_0_0_18px_hsl(var(--background)/0.28)]" />
        <span className="relative h-2.5 w-2.5 rotate-45 rounded-[2px] bg-[hsl(var(--foreground))] shadow-[0_0_14px_hsl(var(--primary)/0.5)] sm:h-3.5 sm:w-3.5" />
      </span>
      <div className="flex min-w-0 flex-col items-start text-left leading-tight">
        <span className={cn(
          "truncate text-sm font-bold text-foreground sm:text-lg",
          compact && "max-w-[8rem] sm:max-w-none sm:text-base",
        )}>
          {t("Вишлист")}
        </span>
        <span className={cn(
          "line-clamp-1 max-w-[65vw] text-[9px] uppercase tracking-[0.05em] text-muted-foreground/75 sm:max-w-none sm:text-[11px]",
          compact && "max-sm:hidden sm:text-[10px]",
        )}>
          {t("Каталог желаний")}
        </span>
      </div>
    </div>
  );
}
