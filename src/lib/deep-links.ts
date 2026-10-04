/** Главная с открытой формой добавления: ссылка подставлена и сразу разбирается. */
export function buildAddItemPath(link: string): string {
  return `/?addUrl=${encodeURIComponent(link)}&fill=1`;
}

/** Первая http(s)-ссылка в присланном: Android кладёт её то в `url`, то в `text`. */
export function findSharedLink(...parts: Array<string | null>): string | null {
  return parts.join(" ").match(/https?:\/\/\S+/)?.[0] ?? null;
}

/**
 * Куда вернуть после входа. Берём только путь своего же сайта: полный адрес
 * или `//host` из `callbackUrl` увёл бы на чужой домен.
 */
export function safeCallbackPath(raw: string | null): string {
  if (!raw) return "/";
  try {
    const { pathname, search, hash } = new URL(raw, "http://local");
    const path = `${pathname}${search}${hash}`;
    return path.startsWith("//") ? "/" : path;
  } catch {
    return "/";
  }
}
