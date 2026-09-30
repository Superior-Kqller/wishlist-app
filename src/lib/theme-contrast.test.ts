import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
type Rgb = { r: number; g: number; b: number };

function parseHslTriple(value: string): Rgb | null {
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

function relativeLuminance({ r, g, b }: Rgb): number {
  return 0.2126 * channelLuminance(r) + 0.7152 * channelLuminance(g) + 0.0722 * channelLuminance(b);
}

function contrastRatio(a: Rgb, b: Rgb): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [light, dark] = la >= lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

/*
 * Две темы: светлая в `:root`, тёмная переопределяет её под
 * `:root[data-theme="dark"]` (DESIGN.md → «Цвет»). Тест берёт значения прямо
 * из `globals.css` и не даёт тронуть токен, не заметив просевшую пару.
 *
 * Проверяются только сплошные пары: у полупрозрачной подложки фактический
 * цвет зависит от того, что лежит ниже.
 */

/*
 * Переводы строк нормализуются: селекторы ниже ищутся по подстроке с `
`,
 * а на Windows с `core.autocrlf=true` рабочая копия приходит с CRLF — тест
 * падал не на контрасте, а на переносе строки.
 */
const CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8").replaceAll(
  "\r\n",
  "\n",
);

/** Блок объявлений темы по его первой строке. */
function readThemeBlock(selector: string): Record<string, string> {
  const start = CSS.indexOf(selector);
  if (start === -1) throw new Error(`Не найден блок темы: ${selector}`);

  const open = CSS.indexOf("{", start);
  let depth = 0;
  let end = open;
  for (let i = open; i < CSS.length; i += 1) {
    if (CSS[i] === "{") depth += 1;
    if (CSS[i] === "}") {
      depth -= 1;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }

  const body = CSS.slice(open + 1, end);
  const tokens: Record<string, string> = {};
  for (const [, name, value] of body.matchAll(/(--[\w-]+)\s*:\s*([^;{}]+);/g)) {
    tokens[name] = value.trim();
  }
  return tokens;
}

const LIGHT = readThemeBlock(":root {\n    color-scheme: light;");
const DARK = { ...LIGHT, ...readThemeBlock(':root[data-theme="dark"] {\n    color-scheme: dark;') };
const THEMES = { светлая: LIGHT, тёмная: DARK };

/**
 * Значение токена в теме: собственное, иначе унаследованное из базовой.
 * `var(--x)` разрешается по тем же правилам, так что `--card: var(--surface-3)`
 * читается как цвет, а не как строка.
 */
function resolve(tokens: Record<string, string>, name: string, seen = new Set<string>()): Rgb {
  if (seen.has(name)) throw new Error(`Циклическая ссылка токена: ${name}`);
  seen.add(name);

  const raw = tokens[name];
  if (raw === undefined) throw new Error(`Токен не объявлен: ${name}`);

  const reference = raw.match(/^var\((--[\w-]+)\)$/);
  if (reference) return resolve(tokens, reference[1], seen);

  const rgb = parseHslTriple(raw);
  if (!rgb) throw new Error(`Токен ${name} не является тройкой HSL: ${raw}`);
  return rgb;
}

/**
 * Пары, за которые тест отвечает.
 *
 * 4.5 — обычный текст (WCAG AA). 3 — крупный текст и нетекстовые указатели:
 * фокус-кольцо, рамка выбранного элемента, статусный маркер.
 */
const PAIRS: ReadonlyArray<{ label: string; fg: string; bg: string; min: number }> = [
  { label: "текст на фоне страницы", fg: "--foreground", bg: "--background", min: 4.5 },
  { label: "текст на панели", fg: "--foreground", bg: "--surface-2", min: 4.5 },
  { label: "текст на карточке", fg: "--foreground", bg: "--surface-3", min: 4.5 },
  { label: "полутон на панели", fg: "--muted-foreground", bg: "--surface-2", min: 4.5 },
  {
    label: "тихий полутон на панели",
    fg: "--muted-foreground-subtle",
    bg: "--surface-2",
    min: 4.5,
  },
  { label: "текст на заливке кнопки", fg: "--primary-foreground", bg: "--primary", min: 4.5 },
  {
    label: "текст на разрушающем действии",
    fg: "--destructive-foreground",
    bg: "--destructive",
    min: 4.5,
  },
  // Голос фирменной краски: ссылка, бейдж «Это вы», рамка своей карточки.
  { label: "фирменный акцент на фоне", fg: "--primary-accent", bg: "--background", min: 3 },
  { label: "фирменный акцент на панели", fg: "--primary-accent", bg: "--surface-2", min: 3 },
  // Указатель фокуса — нетекстовый элемент интерфейса.
  { label: "кольцо фокуса на фоне", fg: "--ring", bg: "--background", min: 3 },
  { label: "кольцо фокуса на панели", fg: "--ring", bg: "--surface-2", min: 3 },
  // Статусы: маркер состояния сущности, часто рядом с подписью того же цвета.
  { label: "успех на панели", fg: "--success", bg: "--surface-2", min: 3 },
  { label: "предупреждение на панели", fg: "--warning", bg: "--surface-2", min: 3 },
  { label: "ошибка на панели", fg: "--error", bg: "--surface-2", min: 3 },
  { label: "сведения на панели", fg: "--info", bg: "--surface-2", min: 3 },
  // Волосяная линия — разделитель, а не указатель (DESIGN.md → «Глубина»).
  { label: "нейтральная рамка на панели", fg: "--border", bg: "--surface-2", min: 1.3 },
  // Рамка поля плотнее: поле подписано, но граница должна читаться.
  { label: "рамка поля на фоне", fg: "--input", bg: "--background", min: 1.75 },
  // Инициалы на подложке аватара: мелкая полужирная буква, обычный текст.
  ...Array.from({ length: 10 }, (_, index) => ({
    label: `инициалы на аватаре ${index + 1}`,
    fg: "--avatar-foreground",
    bg: `--avatar-${index + 1}`,
    min: 4.5,
  })),
];

describe("контраст токенов темы", () => {
  for (const [theme, tokens] of Object.entries(THEMES)) {
    for (const pair of PAIRS) {
      it(`${theme}: ${pair.label} — не ниже ${pair.min}:1`, () => {
        const ratio = contrastRatio(resolve(tokens, pair.fg), resolve(tokens, pair.bg));
        expect(ratio, `${pair.label}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(pair.min);
      });
    }
  }
});
