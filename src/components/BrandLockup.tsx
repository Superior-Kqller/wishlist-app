"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLockupProps {
  className?: string;
}

export function BrandLockup({ className }: BrandLockupProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-1.5 sm:gap-3", className)}>
      <Image
        src="/assets/logo/logo-mark-1.8.0-512.png"
        alt="Логотип Вишлист"
        width={72}
        height={72}
        priority
        unoptimized
        className="h-7 w-7 shrink-0 rounded-lg object-contain sm:h-10 sm:w-10 sm:rounded-xl"
      />
      <div className="flex min-w-0 flex-col items-start text-left leading-tight">
        <span className="truncate text-sm font-bold text-foreground sm:text-lg">
          Вишлист
        </span>
        <span className="line-clamp-1 max-w-[65vw] text-[9px] uppercase tracking-[0.05em] text-muted-foreground/75 sm:max-w-none sm:text-[11px]">
          Каталог желаний
        </span>
      </div>
    </div>
  );
}
