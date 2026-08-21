/**
 * Палитра цветов-предпочтений: единственный источник.
 *
 * Раньше список жил дважды — в редакторе (сторона записи) и в сводке (сторона
 * чтения), без связи между ними. Новый цвет, добавленный в редактор,
 * отрисовывался серым фолбэком во всех сводках, пока карту не поправят руками.
 *
 * Значения — данные предметной области, а не токены поверхности: «Бордовый»
 * обязан выглядеть бордовым, и заменить его `--surface-*` нельзя.
 */

export type PreferenceColor = {
  /** Русская подпись: она же то, что хранится в профиле. */
  label: string;
  hex: string;
  /** Написания через «е» вместо «ё» и прочие варианты из старых записей. */
  aliases?: string[];
};

export const preferenceColors: PreferenceColor[] = [
  { label: "Розовый", hex: "#e7a6b8" },
  { label: "Красный", hex: "#c75b64" },
  { label: "Бордовый", hex: "#8f3e4b" },
  { label: "Оранжевый", hex: "#d78a4d" },
  { label: "Жёлтый", hex: "#d8b84a", aliases: ["Желтый"] },
  { label: "Зелёный", hex: "#6f9b76", aliases: ["Зеленый"] },
  { label: "Хаки", hex: "#7b7d57" },
  { label: "Мятный", hex: "#8bbfaf" },
  { label: "Голубой", hex: "#77aabd" },
  { label: "Синий", hex: "#56789f" },
  { label: "Фиолетовый", hex: "#8c729c" },
  { label: "Лавандовый", hex: "#b5a6cf" },
  { label: "Белый", hex: "#ece9e1" },
  { label: "Молочный", hex: "#f1eadc" },
  { label: "Бежевый", hex: "#cdbb9f" },
  { label: "Коричневый", hex: "#80604d" },
  { label: "Серый", hex: "#8c9097" },
  { label: "Графитовый", hex: "#454a52" },
  { label: "Серебристый", hex: "#b8bdc4" },
  { label: "Деним", hex: "#4f6787" },
  { label: "Чёрный", hex: "#292a2e", aliases: ["Черный"] },
];

function normalizeColorKey(value: string) {
  return value.trim().toLocaleLowerCase("ru-RU").replace(/ё/g, "е");
}

const colorByKey = new Map<string, string>();
for (const color of preferenceColors) {
  for (const name of [color.label, ...(color.aliases ?? [])]) {
    colorByKey.set(normalizeColorKey(name), color.hex);
  }
}

/**
 * Оттенок известного цвета или `null`.
 *
 * `null`, а не серый фолбэк: раньше «Изумрудный» и «Терракотовый» получали
 * один и тот же `#77777f`, то есть кружок молча врал о цвете. Не знаем —
 * не рисуем, подпись рядом и так называет цвет словом.
 */
export function getPreferenceColor(value: string): string | null {
  return colorByKey.get(normalizeColorKey(value)) ?? null;
}
