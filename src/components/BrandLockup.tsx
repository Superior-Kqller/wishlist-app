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
        src="/assets/logo/logo-glass-512.png"
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
        <div className="inline-flex w-fit max-w-[65vw] flex-col items-start sm:max-w-none">
          <span className="line-clamp-2 text-xs text-muted-foreground/90 sm:line-clamp-none sm:text-[0.95rem] md:text-[1.08rem]">
            Умный вишлист для желаний
          </span>
          <span
            aria-hidden="true"
            className="mt-2 h-px w-full rounded-full bg-gradient-to-r from-primary via-fuchsia-500/80 to-pink-500/85"
          />
        </div>
      </div>
    </div>
  );
}
