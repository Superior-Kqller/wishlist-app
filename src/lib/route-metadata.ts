import type { Metadata } from "next";
import { cookies } from "next/headers";
import { LANGUAGE_COOKIE_NAME, normalizeLanguage, translate } from "@/lib/i18n";

/**
 * Заголовок вкладки для раздела. Страницы — клиентские компоненты и
 * объявить метаданные сами не могут, поэтому их объявляет пустой layout
 * маршрута. Без этого у всех вкладок было одно имя «Вишлист», и среди
 * открытых разделов нельзя было найти нужный.
 */
export function routeTitle(key: string) {
  return async function generateMetadata(): Promise<Metadata> {
    const cookieStore = await cookies();
    const language = normalizeLanguage(cookieStore.get(LANGUAGE_COOKIE_NAME)?.value);
    return { title: translate(language, key) };
  };
}
