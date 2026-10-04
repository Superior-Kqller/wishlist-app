"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { WishlistItem } from "@/types";
import { isItemPurchased } from "@/lib/item-status";

/** Снимок заполняет плитку, если его пропорции отличаются от неё не больше чем на четверть. */
const fits = (ratio: number, tile: number) => ratio >= tile * 0.8 && ratio <= tile * 1.25;

/**
 * Фото желания: на телефоне — квадрат от края до края листа, с `md` — плитка
 * 4:3 со скруглением 14px. Как в сетке (DESIGN.md → «Карточка желания»):
 * снимок близких пропорций занимает плитку целиком, вытянутый вписывается с
 * полями 24px. Раньше любой снимок стоял с полями 32px, и магазинное фото со
 * своим фоном читалось картинкой в картинке.
 * Снимок не загрузился — плитки нет совсем: пустой кадр читался «не догрузилось».
 */
export function ItemMediaSection({ item, className }: { item: WishlistItem; className?: string }) {
  const [imageError, setImageError] = useState(false);
  const [ratio, setRatio] = useState<number | null>(null);
  const mainImage = item.images?.[0] ?? null;

  useEffect(() => {
    setImageError(false);
    setRatio(null);
  }, [item.id]);

  if (!mainImage || imageError) return null;

  const fillMobile = ratio != null && fits(ratio, 1);
  const fillDesktop = ratio != null && fits(ratio, 4 / 3);

  return (
    <div
      className={cn(
        "relative aspect-square w-full overflow-hidden rounded-xl md:aspect-[4/3]",
        // Плитка под `multiply` — только под загруженным снимком.
        ratio != null ? "media-tile" : "bg-[hsl(var(--surface-3))]",
        className,
      )}
    >
      <Image
        src={mainImage}
        alt={item.title}
        fill
        className={cn(
          fillMobile ? "max-md:object-cover" : "max-md:object-contain max-md:p-6",
          fillDesktop ? "md:object-cover" : "md:object-contain md:p-6",
          isItemPurchased(item) && "grayscale",
        )}
        sizes="(max-width: 768px) 100vw, 640px"
        unoptimized
        onLoad={(event) => {
          const { naturalWidth: w, naturalHeight: h } = event.currentTarget;
          setRatio(h > 0 ? w / h : 1);
        }}
        onError={() => setImageError(true)}
      />
    </div>
  );
}
