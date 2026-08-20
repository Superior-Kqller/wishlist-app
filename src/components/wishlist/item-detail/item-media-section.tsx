"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WishlistItem } from "@/types";
import { isItemPurchased } from "@/lib/item-status";

export function ItemMediaSection({ item, className }: { item: WishlistItem; className?: string }) {
  const [imageError, setImageError] = useState(false);
  const mainImage = item.images?.[0] ?? null;

  useEffect(() => {
    setImageError(false);
  }, [item.id]);

  return (
    <div
      className={cn(
        "h-[min(31vh,240px)] w-full shrink-0 bg-[hsl(var(--surface-1))] p-0 sm:h-full sm:min-h-[430px] sm:p-5",
        className,
      )}
    >
      <div className="relative h-full min-h-0 overflow-hidden border-b border-border/45 bg-[hsl(var(--surface-2))] sm:rounded-lg sm:border">
        {mainImage && !imageError ? (
          <Image
            src={mainImage}
            alt={item.title}
            fill
            className={cn("object-contain p-3 sm:p-3", isItemPurchased(item) && "grayscale")}
            sizes="(max-width: 640px) 100vw, 520px"
            unoptimized
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
