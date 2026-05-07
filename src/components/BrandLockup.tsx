"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLockupProps {
  className?: string;
}

export function BrandLockup({ className }: BrandLockupProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2 sm:gap-3", className)}>
      <Image
        src="/assets/logo/logo-mark-1.8.0-512.png"
        alt="Логотип Вишлист"
        width={72}
        height={72}
        priority
        unoptimized
        className="h-8 w-8 shrink-0 rounded-lg object-contain sm:h-10 sm:w-10 sm:rounded-xl"
      />
      <div className="flex min-w-0 flex-col items-start text-left leading-tight">
        <span className="truncate text-[15px] font-bold text-foreground sm:text-lg">
          Вишлист
        </span>
        <span className="line-clamp-1 max-w-[65vw] text-[10px] uppercase tracking-[0.06em] text-muted-foreground sm:max-w-none sm:text-[11px]">
          Каталог желаний
        </span>
      </div>
    </div>
  );
}
