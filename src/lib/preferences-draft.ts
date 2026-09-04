/**
 * Ключ черновика подарочного профиля в sessionStorage.
 *
 * Живёт отдельным модулем, потому что им пользуются две страницы: редактор
 * пишет и восстанавливает черновик, а список предпочтений только проверяет,
 * осталась ли незавершённая работа.
 */
const DRAFT_STORAGE_PREFIX = "wishlist:gift-preferences-draft:";

export function giftPreferencesDraftKey(userId: string): string {
  return `${DRAFT_STORAGE_PREFIX}${userId}`;
}
