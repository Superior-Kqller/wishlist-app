"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WishlistItem } from "@/types";
import { isItemPurchased } from "@/lib/item-status";

export function ItemMediaSection({ item, className }: { item: WishlistItem; className?: string }) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const mainImage = item.images?.[0] ?? null;

  useEffect(() => {
    setImageError(false);
    setImageLoaded(false);
  }, [item.id]);

  return (
    <div
      className={cn(
        "h-[min(31vh,240px)] w-full shrink-0 bg-[hsl(var(--surface-1))] p-2 sm:h-full sm:min-h-[430px] sm:p-5",
        className,
      )}
    >
      <div
        className={cn(
          "relative h-full min-h-0 overflow-hidden rounded-xl",
          // Светлая подложка — только под загруженным снимком.
          mainImage && !imageError && imageLoaded
            ? "media-tile"
            : "border border-border/45 bg-[hsl(var(--surface-2))]",
        )}
      >
        {mainImage && !imageError ? (
          <Image
            src={mainImage}
            alt={item.title}
            fill
            className={cn("object-contain p-3 sm:p-3", isItemPurchased(item) && "grayscale")}
            sizes="(max-width: 640px) 100vw, 520px"
            unoptimized
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground/32" />
          </div>
        )}
      </div>
    </div>
  );
}
