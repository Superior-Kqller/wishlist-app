"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">;

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
        className="peer size-full cursor-pointer appearance-none rounded-sm border border-input bg-[hsl(var(--surface-3))] outline-none transition-[background-color,border-color,box-shadow] duration-[var(--dur-fast)] checked:border-foreground checked:bg-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
        {...props}
      />
      {/* Checkbox Draw (kinetics): галочка прорисовывается штрихом за 320ms. */}
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="pointer-events-none absolute inset-0 m-auto size-3.5 text-background [stroke-dasharray:24] [stroke-dashoffset:24] transition-[stroke-dashoffset] delay-[50ms] duration-[320ms] ease-[cubic-bezier(0.16,1,0.3,1)] peer-checked:[stroke-dashoffset:0]"
      >
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  ),
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
