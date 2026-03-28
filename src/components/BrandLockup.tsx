"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLockupProps {
  className?: string;
}

export function BrandLockup({ className }: BrandLockupProps) {
  return (
    <div className={cn("flex min-w-0 items-center gap-2 sm:gap-3.5 md:gap-4.5", className)}>
      <Image
        src="/assets/logo/logo-on-dark-512.png"
        alt="Логотип Вишлист"
        width={72}
        height={72}
        priority
        unoptimized
        className="h-11 w-11 shrink-0 object-contain sm:h-14 sm:w-14 md:h-16 md:w-16"
      />
      <div className="flex min-w-0 flex-col items-start text-left leading-tight">
        <span className="truncate text-lg font-extrabold tracking-[-0.02em] text-foreground sm:text-[1.85rem] md:text-[2.15rem]">
          Вишлист
        </span>
        <span className="line-clamp-2 max-w-[65vw] text-xs text-muted-foreground/90 sm:line-clamp-none sm:max-w-none sm:text-[0.95rem] md:text-[1.08rem]">
          Умный вишлист для желаний
        </span>
      </div>
    </div>
  );
}
