"use client";

import { useState } from "react";
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
  const [hoverValue, setHoverValue] = useState(0);
  const starSize = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  const displayValue = hoverValue || priority;

  const StarWrapper = onChange ? "button" : "span";

  return (
    <div
      className="flex gap-0.5"
      onMouseLeave={() => onChange && setHoverValue(0)}
      role={onChange ? undefined : "img"}
      aria-label={onChange ? undefined : `Приоритет: ${priority} из 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <StarWrapper
          key={star}
          type={onChange ? "button" : undefined}
          onClick={onChange ? (e: React.MouseEvent) => {
            e.stopPropagation();
            onChange(star);
          } : undefined}
          onMouseEnter={onChange ? () => setHoverValue(star) : undefined}
          aria-label={onChange ? `Приоритет ${star}` : undefined}
          className={cn(
            "transition-all duration-100",
            onChange
              ? "cursor-pointer hover:scale-125 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
              : "cursor-default",
          )}
        >
          <Star
            className={cn(
              starSize,
              "transition-colors duration-100",
              star <= displayValue
                ? "fill-amber-400 text-amber-400"
                : "fill-transparent text-muted-foreground/30",
            )}
          />
        </StarWrapper>
      ))}
    </div>
  );
}
