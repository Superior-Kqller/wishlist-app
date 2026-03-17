"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface PriorityStarsProps {
  priority: number;
  onChange?: (priority: number) => void;
  size?: "sm" | "md";
}

export function PriorityStars({
  priority,
  onChange,
  size = "sm",
}: PriorityStarsProps) {
  const starSize = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          disabled={!onChange}
          className={cn(
            "transition-colors",
            onChange
              ? "cursor-pointer hover:scale-110 active:scale-95"
              : "cursor-default"
          )}
        >
          <Star
            className={cn(
              starSize,
              "transition-colors",
              star <= priority
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/30"
            )}
          />
        </button>
      ))}
    </div>
  );
}
