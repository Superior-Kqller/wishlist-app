/**
 * Контраст цветовых пар — арифметика WCAG 2.1.
 *
 * Токены тем хранятся тройками `H S% L%` без функции `hsl()`, потому что
 * разметка подставляет к ним прозрачность (`hsl(var(--primary) / 0.16)`).
 * Поэтому разбор начинается с тройки, а не с готового цвета.
 */

export type Rgb = { r: number; g: number; b: number };

/** `"222 16% 6%"` → RGB. Возвращает null, если строка не тройка HSL. */
export function parseHslTriple(value: string): Rgb | null {
  const match = value.trim().match(/^(-?[\d.]+)\s+(-?[\d.]+)%\s+(-?[\d.]+)%$/);
  if (!match) return null;

  const h = Number(match[1]);
  const s = Number(match[2]) / 100;
  const l = Number(match[3]) / 100;
  if (!Number.isFinite(h) || !Number.isFinite(s) || !Number.isFinite(l)) return null;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  const m = l - c / 2;

  const [r1, g1, b1] =
    hp < 1
      ? [c, x, 0]
      : hp < 2
        ? [x, c, 0]
        : hp < 3
          ? [0, c, x]
          : hp < 4
            ? [0, x, c]
            : hp < 5
              ? [x, 0, c]
              : [c, 0, x];

  return { r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255 };
}

function channelLuminance(channel: number): number {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** Относительная яркость по WCAG 2.1. */
function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

/** Отношение контраста двух непрозрачных цветов: от 1 до 21. */
export function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la >= lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}
