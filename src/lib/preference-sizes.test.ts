import { describe, expect, test } from "vitest";
import {
  composeSizePreferences,
  hasPresetToken,
  parseSizePreferences,
  splitSizeParts,
  togglePresetToken,
} from "./preference-sizes";

describe("разбор строки размеров", () => {
  test("запятая внутри значения не начинает новую категорию", () => {
    const { fields, custom } = parseSizePreferences("Одежда: M, L");

    expect(fields.clothes).toBe("M, L");
    expect(custom).toBe("");
  });

  test("запятая перед именем категории по-прежнему разделяет — старые записи не ломаются", () => {
    const { fields, custom } = parseSizePreferences("Одежда: M, Обувь: 42");

    expect(fields.clothes).toBe("M");
    expect(fields.shoes).toBe("42");
    expect(custom).toBe("");
  });

  test("свободная заметка с запятыми остаётся одной строкой", () => {
    const { custom } = parseSizePreferences("длина рукава 60, обхват запястья 17");

    expect(custom).toBe("длина рукава 60, обхват запястья 17");
  });

  test("псевдоним категории распознаётся наравне с основным именем", () => {
    const { fields } = parseSizePreferences("Джинсы: W30/L32; Пояс: 95 см");

    expect(fields.pants).toBe("W30/L32");
    expect(fields.belts).toBe("95 см");
  });

  test("склейка и разбор — обратные операции", () => {
    const fields = {
      clothes: "M, L",
      shoes: "42",
      pants: "",
      outerwear: "",
      rings: "17",
      belts: "",
    };
    const composed = composeSizePreferences(fields, "длина рукава 60");

    expect(parseSizePreferences(composed).fields).toEqual(fields);
    expect(parseSizePreferences(composed).custom).toBe("длина рукава 60");
  });

  test("пустые куски отбрасываются", () => {
    expect(splitSizeParts("Одежда: M;; , \n Обувь: 42")).toEqual(["Одежда: M", "Обувь: 42"]);
  });
});

describe("пресеты размеров", () => {
  test("пресет дописывается к набранному вручную, а не затирает его", () => {
    expect(togglePresetToken("46", "M")).toBe("46, M");
  });

  test("повторное нажатие снимает только свой пресет", () => {
    expect(togglePresetToken("46, M, L", "M")).toBe("46, L");
  });

  test("активность пресета не зависит от регистра", () => {
    expect(hasPresetToken("46, m", "M")).toBe(true);
    expect(hasPresetToken("46", "M")).toBe(false);
  });
});

describe("каноническая форма строки размеров", () => {
  test("склейка разбора — неподвижная точка: повторный проход ничего не меняет", () => {
    for (const input of [
      "Одежда: M, L; Обувь: 42",
      "Брюки: W30; Пояс: 95 см",
      "Куртка: 48; Джинсы: W32; длина рукава 60",
      "",
    ]) {
      const once = composeSizePreferences(
        parseSizePreferences(input).fields,
        parseSizePreferences(input).custom,
      );
      const twice = composeSizePreferences(
        parseSizePreferences(once).fields,
        parseSizePreferences(once).custom,
      );
      expect(twice).toBe(once);
    }
  });

  test("псевдоним разворачивается в полную подпись и строка растёт", () => {
    const input = "Брюки: W30";
    const canonical = composeSizePreferences(
      parseSizePreferences(input).fields,
      parseSizePreferences(input).custom,
    );

    // Именно это удлинение запирало поле, когда охрана потолка сравнивала
    // каноническую строку с исходной.
    expect(canonical).toBe("Брюки и джинсы: W30");
    expect(canonical.length).toBeGreaterThan(input.length);
  });
});
