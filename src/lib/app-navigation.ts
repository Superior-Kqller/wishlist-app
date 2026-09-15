import { BarChart3, CalendarDays, Gift, Home, Settings, Shield } from "lucide-react";
import type { ComponentType } from "react";

/*
 * Разделы приложения — один список на оба меню.
 *
 * Боковая панель и мобильная шапка раньше держали по своей копии: новый
 * раздел приходилось вписывать дважды, и порядок в них уже успел разойтись
 * по мелочи. Здесь только состав и порядок; как разложить по строкам и
 * выпадашкам, решает само меню через `group`.
 */

type AppNavItem = {
  label: string;
  /**
   * Подпись для узкой вкладки: «Подарочные профили» не помещаются в пятую
   * часть телефонного экрана ни в одном кегле.
   */
  shortLabel?: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  /** Основные разделы стоят в ряду, остальные прячутся под «Ещё». */
  group: "primary" | "secondary";
};

type Translate = (key: string) => string;

export function getAppNavItems(t: Translate, { isAdmin }: { isAdmin: boolean }): AppNavItem[] {
  const items: AppNavItem[] = [
    { label: t("Главная"), href: "/", icon: Home, group: "primary" },
    { label: t("Календарь"), href: "/calendar", icon: CalendarDays, group: "primary" },
    { label: t("Статистика"), href: "/stats", icon: BarChart3, group: "primary" },
    {
      label: t("Подарочные профили"),
      shortLabel: t("Профили"),
      href: "/preferences",
      icon: Gift,
      group: "primary",
    },
    { label: t("Настройки"), href: "/settings", icon: Settings, group: "secondary" },
  ];
  if (isAdmin) {
    items.push({ label: t("Администрирование"), href: "/admin", icon: Shield, group: "secondary" });
  }
  return items;
}
