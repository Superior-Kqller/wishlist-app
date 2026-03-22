/**
 * Убирает поле `list` из ответа API (служебная связь для maskClaimedByUser),
 * чтобы не светить его в JSON клиенту.
 */
export function itemResponseWithoutList<T extends { list: unknown }>(
  masked: T,
): Omit<T, "list"> {
  const { list, ...response } = masked;
  void list;
  return response;
}
