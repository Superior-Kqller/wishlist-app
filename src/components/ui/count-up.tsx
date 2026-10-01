"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** 1400ms — длительность Odometer Count-up (kinetics.colorion.co). */
export const COUNT_UP_MS = 1400;

/**
 * Срабатывает один раз, когда элемент наполовину виден (порог 0.5, как у
 * Odometer Count-up). Нужен и самим числам, и полосам, которые растут
 * вместе с ними.
 */
export function useInViewOnce<T extends Element>() {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || inView) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        setInView(true);
      },
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [inView]);

  return [ref, inView] as const;
}

/**
 * Odometer Count-up (kinetics): число отсчитывается от нуля до цели за
 * 1400ms по кривой `1 − (1 − p)³`, когда попадает в кадр; цифры
 * моноширинные, чтобы строка не дрожала. При `prefers-reduced-motion`
 * сразу стоит итог.
 */
export function CountUp({
  value,
  format = (n) => n.toLocaleString(),
  className,
}: {
  value: number;
  format?: (n: number) => string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const [ref, inView] = useInViewOnce<HTMLSpanElement>();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView || reduceMotion) return;
    let frame = 0;
    const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / COUNT_UP_MS, 1);
      setShown(Math.round(value * (1 - Math.pow(1 - p, 3))));
      if (p < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduceMotion, value]);

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      {/* Скринридер читает итог сразу, а не промежуточные кадры. */}
      <span aria-hidden>{format(reduceMotion ? value : shown)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  );
}
