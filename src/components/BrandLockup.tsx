"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLockupProps {
  className?: string;
}

export function BrandLockup({ className }: BrandLockupProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2.5 sm:gap-3", className)}>
      <Image
        src="/assets/logo/logo-on-dark-512.png"
        alt="Логотип Вишлист"
        width={72}
        height={72}
        priority
        unoptimized
        className="h-9 w-9 shrink-0 object-contain sm:h-10 sm:w-10"
      />
      <div className="flex min-w-0 flex-col items-start text-left leading-tight">
        <span className="truncate text-base font-bold tracking-[-0.01em] text-foreground sm:text-lg">
          Вишлист
        </span>
        <span className="line-clamp-1 max-w-[65vw] text-[11px] uppercase tracking-[0.08em] text-muted-foreground sm:max-w-none">
          Каталог желаний
        </span>
      </div>
    </div>
  );
}
