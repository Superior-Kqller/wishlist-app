import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { colorThemes } from "@/lib/themes";
import { contrastRatio, parseHslTriple, type Rgb } from "@/lib/color-contrast";

/*
 * Четыре темы переопределяют одни и те же семантические переменные, поэтому
 * каждая новая пара «текст на поверхности» проверяется четырежды. До этого
 * теста проверка была ручной, и её следы видны в самом `globals.css`: винная
 * краска буквой давала 1.8:1, статусные цвета светлой темы наследовались из
 * тёмной, рамка выбранного чипа брала 1.95:1. Все три нашли глазами и после
 * того, как они уехали пользователям.
 *
 * Тест берёт значения прямо из `globals.css` — единственного места, где темы
 * объявлены, — и не даёт добавить пятую тему или тронуть четыре имеющиеся,
 * не заметив просевшую пару.
 *
 * Границы намеренно проверяются только у сплошных пар. Разметка часто кладёт
 * текст на подложку с прозрачностью (`bg-primary/16`), и её фактический цвет
 * зависит от того, что лежит ниже, — такие сочетания этот тест не считает.
 */

const CSS = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");

/** Блок объявлений темы: базовая живёт в `:root, .dark`, остальные — в своём классе. */
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

const BASE = readThemeBlock(":root,\n  .dark");

/**
 * Значение токена в теме: собственное, иначе унаследованное из базовой.
 * `var(--x)` разрешается по тем же правилам, так что `--card: var(--surface-3)`
 * читается как цвет, а не как строка.
 */
function resolve(tokens: Record<string, string>, name: string, seen = new Set<string>()): Rgb {
  if (seen.has(name)) throw new Error(`Циклическая ссылка токена: ${name}`);
  seen.add(name);

  const raw = tokens[name] ?? BASE[name];
  if (raw === undefined) throw new Error(`Токен не объявлен ни в теме, ни в базе: ${name}`);

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
  { label: "нейтральная рамка на панели", fg: "--border", bg: "--surface-2", min: 1.4 },
  // Инициалы на подложке аватара: мелкая полужирная буква, обычный текст.
  ...Array.from({ length: 10 }, (_, index) => ({
    label: `инициалы на аватаре ${index + 1}`,
    fg: "--avatar-foreground",
    bg: `--avatar-${index + 1}`,
    min: 4.5,
  })),
];

const THEME_SELECTORS: Record<string, string> = {
  graphite: ":root,\n  .dark",
  classic: ".theme-classic",
  light: ".theme-light",
  "wine-sky": ".theme-wine-sky",
};

describe("контраст токенов во всех темах", () => {
  it("покрывает каждую тему из списка настроек", () => {
    expect(Object.keys(THEME_SELECTORS).sort()).toEqual(
      colorThemes.map((theme) => theme.value).sort(),
    );
  });

  for (const theme of colorThemes) {
    describe(theme.value, () => {
      const tokens = readThemeBlock(THEME_SELECTORS[theme.value]);

      for (const pair of PAIRS) {
        it(`${pair.label} — не ниже ${pair.min}:1`, () => {
          const ratio = contrastRatio(resolve(tokens, pair.fg), resolve(tokens, pair.bg));
          expect(
            Number(ratio.toFixed(2)),
            `${pair.fg} на ${pair.bg} в теме ${theme.value}`,
          ).toBeGreaterThanOrEqual(pair.min);
        });
      }
    });
  }
});
