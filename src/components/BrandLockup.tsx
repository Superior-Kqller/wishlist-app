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
          "h-7 w-7 shrink-0 bg-[radial-gradient(circle_at_32%_24%,hsl(var(--foreground)/0.92),hsl(var(--primary))_42%,hsl(var(--theme-warm))_76%)] shadow-[0_0_18px_hsl(var(--primary)/0.34)] transition-[background,filter] duration-200 [mask-image:url('/assets/logo/logo-mark-1.8.0-512.png')] [mask-position:center] [mask-repeat:no-repeat] [mask-size:contain] [-webkit-mask-image:url('/assets/logo/logo-mark-1.8.0-512.png')] [-webkit-mask-position:center] [-webkit-mask-repeat:no-repeat] [-webkit-mask-size:contain] sm:h-10 sm:w-10",
          compact && "sm:h-9 sm:w-9",
        )}
      />
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
