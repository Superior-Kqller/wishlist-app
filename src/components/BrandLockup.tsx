"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/i18n/language-provider";
import { useColorTheme } from "@/components/theme/color-theme-provider";
import type { ColorTheme } from "@/lib/themes";

const logoByTheme: Record<ColorTheme, string> = {
  light: "/assets/logo/logo-mark-light-512.png",
  classic: "/assets/logo/logo-mark-1.8.0-512.png",
  graphite: "/assets/logo/logo-mark-graphite-512.png",
  "wine-sky": "/assets/logo/logo-mark-wine-sky-512.png",
};

interface BrandLockupProps {
  className?: string;
  compact?: boolean;
}

export function BrandLockup({ className, compact = false }: BrandLockupProps) {
  const { t } = useI18n();
  const { colorTheme } = useColorTheme();

  return (
    <div className={cn("flex min-w-0 items-center gap-1.5 sm:gap-3", className)}>
      <Image
        src={logoByTheme[colorTheme]}
        alt=""
        width={72}
        height={72}
        priority
        unoptimized
        className={cn(
          "h-7 w-7 shrink-0 object-contain sm:h-10 sm:w-10",
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
          "line-clamp-1 max-w-[65vw] text-[9px] text-muted-foreground/75 sm:max-w-none sm:text-[11px]",
          compact && "max-sm:hidden sm:text-[10px]",
        )}>
          {t("Каталог желаний")}
        </span>
      </div>
    </div>
  );
}
