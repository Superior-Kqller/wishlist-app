import type { CSSProperties } from "react";
import { buildWishPortrait, type PortraitShape } from "@/lib/wishlist/wish-portrait";
import { cn } from "@/lib/utils";

function shapeProps(delay: number) {
  return {
    // pathLength=1 — одна длина штриха для любой фигуры, прорисовка через .draw-ring.
    pathLength: 1,
    className: "draw-ring",
    style: { "--draw-length": 1, animationDelay: `${delay}ms` } as CSSProperties,
  };
}

function Shape({ shape, size: s, delay }: { shape: PortraitShape; size: number; delay: number }) {
  const props = shapeProps(delay);
  switch (shape) {
    case "circle":
      return <circle r={s} {...props} />;
    case "square":
      return (
        <rect
          x={-s * 0.85}
          y={-s * 0.85}
          width={s * 1.7}
          height={s * 1.7}
          rx={s * 0.25}
          {...props}
        />
      );
    case "arch":
      return (
        <path
          d={`M${-s * 0.8} ${s * 0.9}V${-s * 0.1}A${s * 0.8} ${s * 0.8} 0 0 1 ${s * 0.8} ${-s * 0.1}V${s * 0.9}Z`}
          {...props}
        />
      );
    case "triangle":
      return <path d={`M0 ${-s}L${s * 0.87} ${s * 0.6}H${-s * 0.87}Z`} {...props} />;
  }
}

/** Рисунок линиями на плитке желания без фото. Декоративный: скрыт от скринридера. */
export function WishPortrait({ seed, className }: { seed: string; className?: string }) {
  const { shape, rings, dot } = buildWishPortrait(seed);
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={0.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("pointer-events-none text-muted-foreground opacity-50", className)}
    >
      {rings.map((ring, i) => (
        <g key={i} transform={`translate(${ring.cx} ${ring.cy}) rotate(${ring.rotate})`}>
          <Shape shape={shape} size={ring.size} delay={i * 90} />
        </g>
      ))}
      <circle cx={dot.x} cy={dot.y} r={1.4} fill="currentColor" stroke="none" />
    </svg>
  );
}
