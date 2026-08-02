"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

/**
 * Флажок продукта.
 *
 * Внутри остаётся настоящий `<input type="checkbox">` — он приносит семантику,
 * фокус и работу с клавиатуры бесплатно, — но рисуется он собственной
 * коробкой. Раньше эти поля отдавались браузеру: системная синяя галочка
 * стояла рядом с фирменным переключателем и не подчинялась ни одной теме.
 */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => (
    <span className={cn("relative inline-flex size-5 shrink-0", className)}>
      <input
        ref={ref}
        type="checkbox"
        className="peer size-full cursor-pointer appearance-none rounded-[0.3rem] border border-input bg-[hsl(var(--surface-3))] outline-none transition-[background-color,border-color,box-shadow] duration-[var(--dur-fast)] checked:border-primary checked:bg-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      />
      <Check
        aria-hidden
        className="pointer-events-none absolute inset-0 m-auto size-3.5 scale-75 text-primary-foreground opacity-0 transition-[opacity,transform] duration-[var(--dur-fast)] ease-[var(--ease-soft)] peer-checked:scale-100 peer-checked:opacity-100"
        strokeWidth={3}
      />
    </span>
  ),
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
