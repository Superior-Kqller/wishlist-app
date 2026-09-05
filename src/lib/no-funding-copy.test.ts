import { describe, expect, test } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";

/*
 * Продукт не собирает деньги: у желания нет цели сбора, взноса и оплаты —
 * есть ориентировочная цена и отметка «куплено». Решение больше нигде не
 * записано, поэтому объяснение живёт здесь, рядом со сторожем.
 *
 * Сторож намеренно узкий, и это исправление прежней версии. Она искала
 * подстроки — «перев», «собра», «сбор», «средств», «внести», «fund», «goal»
 * — в тексте файлов целиком, а такой поиск не отличает донат от обычного
 * слова. «Переводится», «собранное», «собранной», «сборку» уже лежат в
 * src/lib, в одном каталоге от проверяемых; стоило любому из этих
 * предложений перекочевать в компонент — и набор падал с сообщением про
 * донаты. «Средства» ловились бы на категории «средства ухода», «fund» на
 * `refund`, «checkout» на комментарии про git.
 *
 * Отсюда два правила. Слово опознаётся с начала, а не с середины, — так
 * «оплата» ловится, а «переводится» нет. И в списке остаются только те
 * основы, с которых не начинается ни одно невинное слово: неоднозначные
 * убраны, их работу берёт на себя фраза целиком.
 */

/** Основы, называющие сбор денег. Совпадение считается с начала слова. */
const FORBIDDEN: ReadonlyArray<{ pattern: string; example: string }> = [
  { pattern: "донат", example: "донат, донаты, донатить" },
  { pattern: "donat", example: "donate, donation" },
  { pattern: "краудфанд", example: "краудфандинг" },
  { pattern: "crowdfund", example: "crowdfunding" },
  { pattern: "складчин", example: "складчина, вскладчину" },
  { pattern: "пожертвован", example: "пожертвование" },
  { pattern: "скинуться", example: "скинуться на подарок" },
  { pattern: "взнос", example: "взнос, взносы" },
  { pattern: "оплат", example: "оплата, оплатить" },
  { pattern: "payment", example: "payment, payments" },
  { pattern: "сбор[а-яё]* средств", example: "сбор средств" },
];

/** Начало слова: перед основой нет ни буквы, ни цифры любого алфавита. */
const WORD_START = "(?<![\p{L}\p{N}_])";

function findForbiddenTerms(text: string): string[] {
  return FORBIDDEN.filter(({ pattern }) =>
    new RegExp(`${WORD_START}(?:${pattern})`, "iu").test(text),
  ).map(({ pattern }) => pattern);
}

/**
 * Текст без комментариев.
 *
 * Комментарии в интерфейс не попадают, а обсуждать в них платежи никто не
 * запрещал — в том числе объясняя, почему их нет. Строки при этом остаются
 * нетронутыми: `//` внутри `https://` не должен съесть половину строки.
 */
function withoutComments(source: string): string {
  let result = "";
  let index = 0;

  while (index < source.length) {
    const char = source[index];

    if (char === "/" && source[index + 1] === "/") {
      while (index < source.length && source[index] !== "\n") index += 1;
      continue;
    }

    if (char === "/" && source[index + 1] === "*") {
      const end = source.indexOf("*/", index + 2);
      index = end === -1 ? source.length : end + 2;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      const quote = char;
      result += char;
      index += 1;
      while (index < source.length && source[index] !== quote) {
        if (source[index] === "\\") {
          result += source.slice(index, index + 2);
          index += 2;
          continue;
        }
        result += source[index];
        index += 1;
      }
      result += quote;
      index += 1;
      continue;
    }

    result += char;
    index += 1;
  }

  return result;
}

const rootsToScan = ["src/app", "src/components"];
const fileExtensions = new Set([".ts", ".tsx"]);

function listSourceFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const fullPath = join(root, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) return listSourceFiles(fullPath);
    if (!stats.isFile()) return [];
    if (!fileExtensions.has(fullPath.slice(fullPath.lastIndexOf(".")))) return [];

    return [fullPath];
  });
}

describe("no-funding product copy", () => {
  /*
   * Точность сторожа — часть его работы, поэтому она проверяется отдельно.
   * Слова слева — те самые, на которых прежняя версия и подрывалась.
   */
  test("не считает обычные слова разговором о деньгах", () => {
    const innocent = [
      "Порядок слов принадлежит языку: собранное из кусков предложение переводится",
      "Потолок собранной строки размеров",
      "класс `.theme-*` роняет сборку",
      "Средства ухода",
      "Перевод интерфейса",
      "Сбор данных отключён",
      "refund",
      "goalkeeper",
      "git checkout main",
    ];

    for (const phrase of innocent) {
      expect(findForbiddenTerms(phrase), phrase).toEqual([]);
    }
  });

  test("узнаёт разговор о сборе денег в любой форме", () => {
    const funding = [
      "Задонатить на подарок",
      "Donation goal",
      "Скинуться всем отделом",
      "Внести взнос",
      "Оплатить картой",
      "Сбора средств не будет",
      "Краудфандинг",
      "Payment method",
      "Купить вскладчину",
      "Пожертвование",
    ];

    for (const phrase of funding) {
      expect(findForbiddenTerms(phrase), phrase).not.toEqual([]);
    }
  });

  test("не выставляет наружу сбор денег в интерфейсе", () => {
    const matches = rootsToScan.flatMap((root) =>
      listSourceFiles(root).flatMap((file) => {
        const text = withoutComments(readFileSync(file, "utf8"));
        return findForbiddenTerms(text).map(
          (pattern) => `${relative(process.cwd(), file)} содержит «${pattern}»`,
        );
      }),
    );

    expect(matches).toEqual([]);
  });
});
