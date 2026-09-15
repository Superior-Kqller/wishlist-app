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
