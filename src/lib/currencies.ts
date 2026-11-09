export const CURRENCIES = [
  { value: "RUB", label: "₽ RUB" },
  { value: "USD", label: "$ USD" },
  { value: "EUR", label: "€ EUR" },
  { value: "CNY", label: "¥ CNY" },
];

/** Валюта из ссылки: только из известного списка, остальное — «любая». */
export function parseCurrency(value: string | null | undefined): string | null {
  return CURRENCIES.some((c) => c.value === value) ? (value as string) : null;
}
