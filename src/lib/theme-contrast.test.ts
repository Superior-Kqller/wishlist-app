import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio, parseHslTriple, type Rgb } from "@/lib/color-contrast";

/*
 * У продукта одна тема — фиолетовая, объявленная в `:root, .dark`. Раньше тем
 * было четыре, и каждая пара «текст на поверхности» проверялась четырежды;
 * следы ручной проверки видны в истории `globals.css`: винная краска буквой
 * давала 1.8:1, статусные цвета светлой темы наследовались из тёмной, рамка
 * выбранного чипа брала 1.95:1. Все три нашли глазами и после того, как они
 * уехали пользователям.
 *
 * Тест берёт значения прямо из `globals.css` — единственного места, где тема
 * объявлена, — и не даёт тронуть токен, не заметив просевшую пару. Заодно он
 * стережёт сам канон: вернувшийся класс `.theme-*` роняет сборку.
 *
 * Границы намеренно проверяются только у сплошных пар. Разметка часто кладёт
 * текст на подложку с прозрачностью (`bg-primary/16`), и её фактический цвет
 * зависит от того, что лежит ниже, — такие сочетания этот тест не считает.
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

/** Блок объявлений темы: единственный, в `:root, .dark`. */
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
  { label: "нейтральная рамка на панели", fg: "--border", bg: "--surface-2", min: 1.4 },
  // Инициалы на подложке аватара: мелкая полужирная буква, обычный текст.
  ...Array.from({ length: 10 }, (_, index) => ({
    label: `инициалы на аватаре ${index + 1}`,
    fg: "--avatar-foreground",
    bg: `--avatar-${index + 1}`,
    min: 4.5,
  })),
];

describe("контраст токенов темы", () => {
  it("тема в продукте одна: классов `.theme-*` в `globals.css` нет", () => {
    expect(CSS.match(/\.theme-[\w-]+/g)).toBeNull();
  });

  for (const pair of PAIRS) {
    it(`${pair.label} — не ниже ${pair.min}:1`, () => {
      const ratio = contrastRatio(resolve(BASE, pair.fg), resolve(BASE, pair.bg));
      expect(ratio, `${pair.label}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(pair.min);
    });
  }
});
