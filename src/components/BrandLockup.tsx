"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLockupProps {
  className?: string;
}

export function BrandLockup({ className }: BrandLockupProps) {
  return (
    <div className={cn("flex items-center gap-2.5 sm:gap-3", className)}>
      <Image
        src="/assets/logo/logo-glass-512.png"
        alt="Логотип Вишлист"
        width={48}
        height={48}
        priority
        unoptimized
        className="h-10 w-10 object-contain sm:h-12 sm:w-12"
      />
      <div className="flex min-w-0 flex-col leading-none">
        <span className="truncate text-base font-semibold text-foreground sm:text-lg">
          Вишлист
        </span>
        <span className="truncate text-[11px] text-muted-foreground sm:text-xs">
          Умный вишлист для желаний
        </span>
      </div>
    </div>
  );
}
