/**
 * Портрет желания без фото: несколько вложенных фигур одной формы.
 * Строится детерминированно из названия — у одного желания рисунок всегда один.
 * Координаты — в поле 100×100 с центром в (50, 50).
 */
export const PORTRAIT_SHAPES = ["circle", "square", "arch", "triangle"] as const;
export type PortraitShape = (typeof PORTRAIT_SHAPES)[number];

export interface PortraitRing {
  /** Половина размера фигуры. */
  size: number;
  /** Поворот в градусах. */
  rotate: number;
  cx: number;
  cy: number;
}

export interface WishPortrait {
  shape: PortraitShape;
  rings: PortraitRing[];
  dot: { x: number; y: number };
}

const OUTER = 34;
const INNER = 13;
const round = (value: number) => Math.round(value * 100) / 100;

export function buildWishPortrait(seed: string): WishPortrait {
  // FNV-1a: соседние названия («Кружка», «Кружки») дают разные рисунки.
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  hash >>>= 0;
  const pick = (options: number) => {
    const value = hash % options;
    hash = Math.floor(hash / options);
    return value;
  };

  const shape = PORTRAIT_SHAPES[pick(PORTRAIT_SHAPES.length)];
  const count = 3 + pick(2);
  const rotateStep = pick(5) * 9;
  const driftAngle = (pick(8) * Math.PI) / 4;
  const drift = pick(3) * 3;
  const dotAngle = (pick(12) * Math.PI) / 6;

  const rings = Array.from({ length: count }, (_, i) => ({
    size: round(OUTER - ((OUTER - INNER) * i) / (count - 1)),
    rotate: i * rotateStep,
    cx: round(50 + Math.cos(driftAngle) * drift * i),
    cy: round(50 + Math.sin(driftAngle) * drift * i),
  }));

  return {
    shape,
    rings,
    dot: { x: round(50 + Math.cos(dotAngle) * 43), y: round(50 + Math.sin(dotAngle) * 43) },
  };
}
