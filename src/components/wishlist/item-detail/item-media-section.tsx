"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { WishlistItem } from "@/types";
import { isItemPurchased } from "@/lib/item-status";

/**
 * Фото желания: плитка 4:3 со скруглением 14px, как у карточки в сетке.
 * Снимок не загрузился — плитки нет совсем: пустой кадр читался «не догрузилось».
 */
export function ItemMediaSection({ item, className }: { item: WishlistItem; className?: string }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const mainImage = item.images?.[0] ?? null;

  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [item.id]);

  if (!mainImage || imageError) return null;

  return (
    <div
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden rounded-xl",
        // Плитка под `multiply` — только под загруженным снимком.
        imageLoaded ? "media-tile" : "bg-[hsl(var(--surface-3))]",
        className,
      )}
    >
      <Image
        src={mainImage}
        alt={item.title}
        fill
        className={cn("object-contain p-8", isItemPurchased(item) && "grayscale")}
        sizes="(max-width: 768px) 100vw, 640px"
        unoptimized
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
      />
    </div>
  );
}
