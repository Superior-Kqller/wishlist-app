/*
 * Текст ошибки из ответа API.
 *
 * Сервер кладёт объяснение в `error` (и в `message` у разбора ссылки), но
 * ответ не всегда JSON: прокси отвечает HTML-страницей на 502, а таймаут —
 * пустым телом. Раньше каждый компонент читал тело сам: половина вызывала
 * `res.json()` без страховки и на HTML показывала пользователю
 * «Unexpected token <» вместо своей подписи. Здесь чтение одно на всех:
 * не-JSON и пустое поле дают `null`, а подпись выбирает вызывающий.
 */

export async function readErrorMessage(res: Response): Promise<string | null> {
  const body: unknown = await res.json().catch(() => null);
  if (!body || typeof body !== "object") return null;
  for (const field of ["error", "message"]) {
    const value = (body as Record<string, unknown>)[field];
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

/** `Error` с текстом сервера, а если его нет — с запасной подписью. */
export async function responseError(res: Response, fallback: string): Promise<Error> {
  return new Error((await readErrorMessage(res)) ?? fallback);
}

/**
 * Запрос к собственному API: не-2xx превращается в `Error` с текстом сервера
 * (или `fallback`). Объект в `body` уходит как JSON, `FormData` — как есть.
 */
export async function apiRequest(
  url: string,
  { method = "GET", body }: { method?: string; body?: unknown },
  fallback: string,
): Promise<Response> {
  const res = await fetch(
    url,
    body === undefined
      ? { method }
      : body instanceof FormData
        ? { method, body }
        : { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
  );
  if (!res.ok) throw await responseError(res, fallback);
  return res;
}
