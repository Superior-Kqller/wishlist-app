"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface BrandLockupProps {
  className?: string;
}

export function BrandLockup({ className }: BrandLockupProps) {
  return (
    <div className={cn("flex items-center gap-3.5 sm:gap-4.5", className)}>
      <Image
        src="/assets/logo/logo-on-dark-512.png"
        alt="Логотип Вишлист"
        width={72}
        height={72}
        priority
        unoptimized
        className="h-14 w-14 object-contain sm:h-16 sm:w-16"
      />
      <div className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-[2rem] font-extrabold tracking-[-0.02em] text-foreground sm:text-[2.35rem]">
          Вишлист
        </span>
        <span className="truncate text-[1.02rem] text-muted-foreground/90 sm:text-[1.28rem]">
          Умный вишлист для желаний
        </span>
        <span
          aria-hidden="true"
          className="mt-2 h-px w-24 rounded-full bg-gradient-to-r from-primary via-fuchsia-500/80 to-pink-500/85 sm:w-30"
        />
      </div>
    </div>
  );
}
