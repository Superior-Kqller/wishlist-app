/**
 * Разбор и склейка строки размеров подарочного профиля.
 *
 * Логика жила внутри клиентского компонента редактора и потому не была ничем
 * накрыта, хотя именно она теряла введённое: запятая внутри значения резала
 * строку как разделитель категорий. Здесь она чистая и проверяемая.
 */

export type SizeCategoryId = "clothes" | "shoes" | "pants" | "outerwear" | "rings" | "belts";

export type SizeCategory = {
  id: SizeCategoryId;
  label: string;
  aliases?: string[];
  hint: string;
  placeholder: string;
  presets: string[];
};

export const sizeCategories: SizeCategory[] = [
  {
    id: "clothes",
    label: "Одежда",
    hint: "Футболки, худи, платья",
    placeholder: "Например, M или 46",
    presets: ["XS", "S", "M", "L", "XL", "42", "44", "46", "48"],
  },
  {
    id: "shoes",
    label: "Обувь",
    hint: "Кроссовки, ботинки, домашняя обувь",
    placeholder: "Например, 38 EU",
    presets: ["36", "37", "38", "39", "40", "41", "42", "43", "44"],
  },
  {
    id: "pants",
    label: "Брюки и джинсы",
    aliases: ["Брюки", "Джинсы"],
    hint: "Талия, длина или обычный размер",
    placeholder: "Например, W30/L32",
    presets: ["XS", "S", "M", "L", "W28", "W30", "W32", "W34"],
  },
  {
    id: "outerwear",
    label: "Верхняя одежда",
    aliases: ["Верх", "Куртка", "Пальто"],
    hint: "Куртки, пальто, жилеты",
    placeholder: "Например, M или 48",
    presets: ["S", "M", "L", "XL", "44", "46", "48", "50"],
  },
  {
    id: "rings",
    label: "Кольцо",
    hint: "Если украшения уместны",
    placeholder: "Например, 17",
    presets: ["15", "16", "16.5", "17", "17.5", "18", "18.5", "19"],
  },
  {
    id: "belts",
    label: "Ремень",
    aliases: ["Пояс"],
    hint: "Длина или обхват",
    placeholder: "Например, 95 см",
    presets: ["80 см", "85 см", "90 см", "95 см", "100 см", "105 см"],
  },
];

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function categoryPrefixMatcher(name: string) {
  return new RegExp(`^${escapeRegExp(name)}[:\\s-]+`, "i");
}

function categoryNames(category: SizeCategory) {
  return [category.label, ...(category.aliases ?? [])];
}

export function startsWithSizeCategory(part: string) {
  return sizeCategories.some((category) =>
    categoryNames(category).some((name) => categoryPrefixMatcher(name).test(part)),
  );
}

/**
 * Запятая внутри значения («Одежда: M, L») не начинает новую категорию.
 * Раньше строка резалась по `,` наравне с `;`, и «L» не совпадало ни с одним
 * префиксом — то есть уезжало в поле «Другое», а из «Одежды» пропадало.
 * Режем по `;` и переносам, а запятую считаем разделителем категорий только
 * тогда, когда следующий кусок сам начинается с имени категории: так выглядят
 * строки, набранные в старом едином поле.
 */
export function splitSizeParts(value: string) {
  const parts: string[] = [];
  for (const chunk of value.split(/[;\n]/)) {
    // Склейка живёт внутри куска: `;` — безусловная граница, иначе свободная
    // заметка после последней категории прилипала бы к ней.
    let isChunkStart = true;
    for (const piece of chunk.split(",")) {
      const trimmed = piece.trim();
      if (!trimmed) continue;
      if (!isChunkStart && parts.length > 0 && !startsWithSizeCategory(trimmed)) {
        parts[parts.length - 1] = `${parts[parts.length - 1]}, ${trimmed}`;
        continue;
      }
      parts.push(trimmed);
      isChunkStart = false;
    }
  }
  return parts;
}

export function parseSizePreferences(value: string) {
  const fields = Object.fromEntries(sizeCategories.map((category) => [category.id, ""])) as Record<
    SizeCategoryId,
    string
  >;
  const custom: string[] = [];

  for (const part of splitSizeParts(value)) {
    const matched = sizeCategories.find((category) =>
      categoryNames(category).some((name) => categoryPrefixMatcher(name).test(part)),
    );

    if (!matched) {
      custom.push(part);
      continue;
    }

    const matchedName = categoryNames(matched).find((name) =>
      categoryPrefixMatcher(name).test(part),
    );
    const nextValue = matchedName
      ? part.replace(categoryPrefixMatcher(matchedName), "").trim()
      : "";
    fields[matched.id] = [fields[matched.id], nextValue].filter(Boolean).join(", ");
  }

  return { fields, custom: custom.join("; ") };
}

export function composeSizePreferences(fields: Record<SizeCategoryId, string>, custom: string) {
  return [
    ...sizeCategories
      .map((category) => {
        const value = fields[category.id].trim();
        return value ? `${category.label}: ${value}` : "";
      })
      .filter(Boolean),
    custom.trim(),
  ]
    .filter(Boolean)
    .join("; ");
}

/** Значения внутри одной категории: «M, L» — это два размера, а не один. */
export function sizeTokens(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

/**
 * Пресет дописывается к набранному, а не затирает его: раньше нажатие на «M»
 * молча стирало введённое руками «46», и отменить это было нечем.
 */
export function togglePresetToken(value: string, preset: string) {
  const tokens = sizeTokens(value);
  const key = preset.toLocaleLowerCase("ru-RU");
  const next = tokens.some((token) => token.toLocaleLowerCase("ru-RU") === key)
    ? tokens.filter((token) => token.toLocaleLowerCase("ru-RU") !== key)
    : [...tokens, preset];
  return next.join(", ");
}

export function hasPresetToken(value: string, preset: string) {
  const key = preset.toLocaleLowerCase("ru-RU");
  return sizeTokens(value).some((token) => token.toLocaleLowerCase("ru-RU") === key);
}
