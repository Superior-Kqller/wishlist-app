"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WishlistItem } from "@/types";

export function ItemMediaSection({
  item,
  className,
}: {
  item: WishlistItem;
  className?: string;
}) {
  const [imageError, setImageError] = useState(false);
  const mainImage = item.images?.[0] ?? null;

  useEffect(() => {
    setImageError(false);
  }, [item.id]);

  return (
    <div
      className={cn(
        "h-[min(34vh,230px)] w-full shrink-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.12),transparent_34%),hsl(var(--surface-1))] p-2.5 sm:h-full sm:min-h-[360px] sm:p-4",
        className,
      )}
    >
      <div className="relative h-full min-h-0 overflow-hidden rounded-xl border border-border/42 bg-[hsl(var(--surface-2))/0.42] shadow-[inset_0_1px_0_hsl(var(--foreground)/0.035)]">
        {mainImage && !imageError ? (
          <Image
            src={mainImage}
            alt={item.title}
            fill
            className={cn(
              "object-contain drop-shadow-[0_18px_36px_rgba(0,0,0,0.36)]",
              item.purchased && "grayscale",
            )}
            sizes="(max-width: 640px) 100vw, 520px"
            unoptimized
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-16 w-16 text-muted-foreground/30" />
          </div>
        )}
      </div>
    </div>
  );
}
