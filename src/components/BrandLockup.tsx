"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLockupProps {
  className?: string;
}

export function BrandLockup({ className }: BrandLockupProps) {
  return (
    <div className={cn("flex items-center gap-3 sm:gap-4", className)}>
      <Image
        src="/assets/logo/logo-glass-512.png"
        alt="Логотип Вишлист"
        width={64}
        height={64}
        priority
        unoptimized
        className="h-12 w-12 object-contain sm:h-14 sm:w-14"
      />
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-2xl font-extrabold tracking-tight text-foreground sm:text-[2rem]">
          Вишлист
        </span>
        <span className="truncate text-sm text-muted-foreground/90 sm:text-base">
          Умный вишлист для желаний
        </span>
        <span
          aria-hidden="true"
          className="mt-2 h-0.5 w-24 rounded-full bg-gradient-to-r from-primary via-fuchsia-500/80 to-pink-500/85 sm:w-28"
        />
      </div>
    </div>
  );
}
