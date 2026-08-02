import * as React from "react";
import { cn } from "@/lib/utils";
import { staggerDelayMs } from "@/lib/motion";

export interface RevealProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Позиция в последовательности: задаёт задержку каскада. */
  index?: number;
  /** Готовая задержка в миллисекундах, если каскад считается снаружи. */
  delayMs?: number;
  asChild?: boolean;
}

/**
 * Появление контента без JS-анимации: элемент уже в разметке, CSS лишь
 * проигрывает `rise-in`. При `prefers-reduced-motion` анимация выключается
 * в `globals.css`, и содержимое просто остаётся на месте.
 */
export function Reveal({ className, index = 0, delayMs, style, ...props }: RevealProps) {
  const delay = delayMs ?? staggerDelayMs(index);

  return (
    <div
      data-reveal=""
      className={cn(className)}
      style={{ ...style, "--reveal-delay": `${delay}ms` } as React.CSSProperties}
      {...props}
    />
  );
}
