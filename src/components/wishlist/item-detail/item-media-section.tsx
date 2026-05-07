"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WishlistItem } from "@/types";

export function ItemMediaSection({ item }: { item: WishlistItem }) {
  const [imageError, setImageError] = useState(false);
  const mainImage = item.images?.[0] ?? null;

  useEffect(() => {
    setImageError(false);
  }, [item.id]);

  return (
    <div className="relative h-[min(30vh,200px)] w-full shrink-0 overflow-hidden bg-[radial-gradient(circle_at_50%_10%,hsl(var(--primary)/0.12),transparent_22rem),hsl(var(--surface-1))] sm:h-[280px]">
      {mainImage && !imageError ? (
        <Image
          src={mainImage}
          alt={item.title}
          fill
          className={cn(
            "object-contain drop-shadow-[0_18px_36px_rgba(0,0,0,0.36)]",
            item.purchased && "grayscale",
          )}
          sizes="(max-width: 640px) 100vw, 768px"
          unoptimized
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
        </div>
      )}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[hsl(var(--surface-3))] to-transparent"
        aria-hidden
      />
    </div>
  );
}
