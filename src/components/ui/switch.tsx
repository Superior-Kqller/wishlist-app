"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type SwitchProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

/**
 * Переключатель включения возможности.
 *
 * Правило продукта: тумблер означает «включить/выключить» — уведомления,
 * напоминания, участие; флажок (`Checkbox`) означает выбор элементов из
 * списка. До этого соседние строки настроек с одинаковым смыслом рисовались
 * то тумблером, то системным флажком.
 */
const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(({ className, ...props }, ref) => (
  <span className={cn("relative inline-flex h-6 w-11 shrink-0", className)}>
    <input ref={ref} type="checkbox" className="peer sr-only" {...props} />
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-full border border-border/70 bg-muted transition-colors duration-[var(--dur-base)] after:absolute after:left-0.5 after:top-0.5 after:size-5 after:rounded-full after:bg-foreground/70 after:shadow-sm after:transition-transform after:duration-[var(--dur-base)] after:ease-[var(--ease-soft)] peer-checked:border-primary/55 peer-checked:bg-primary/70 peer-checked:after:translate-x-5 peer-checked:after:bg-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background peer-disabled:opacity-50"
    />
  </span>
));
Switch.displayName = "Switch";

export { Switch };
