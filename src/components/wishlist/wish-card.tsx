"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { CheckCircle2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { WishlistItem } from "@/types";
import { cn, formatPrice } from "@/lib/utils";
import { getAvatarColor } from "@/lib/avatar-utils";
import { PriorityBadgeInline } from "./priority-badge";
import { useI18n } from "@/components/i18n/language-provider";
import { getProductCategoryLabel } from "@/lib/categories";
import { isItemPurchased, type ItemStatus } from "@/lib/item-status";
import { ItemActionsMenu } from "./item-actions-menu";
import { ProductCategoryIcon } from "@/lib/category-icons";

interface WishCardProps {
  item: WishlistItem;
  onEdit: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
  onSetStatus: (id: string, status: ItemStatus) => void;
  statusPending?: boolean;
  /** Товар только что отмечен купленным в этой сессии. */
  justPurchased?: boolean;
  onOpenDetail?: (item: WishlistItem) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  currentUserId?: string;
  currentUserRole?: "ADMIN" | "USER" | null;
  hideOwner?: boolean;
}

export const WishCard = memo(function WishCard({
  item,
  onEdit,
  onDelete,
  onSetStatus,
  statusPending = false,
  justPurchased = false,
  onOpenDetail,
  selectionMode,
  isSelected,
  onToggleSelect,
  currentUserId,
  currentUserRole,
  hideOwner = false,
}: WishCardProps) {
  const { language, t } = useI18n();
  const [imageError, setImageError] = useState(false);
  // Подложка светлеет только под загруженным снимком: пока он грузится или
  // если ссылка мертва, кадр остаётся тёмным, а не пустым светлым окном.
  const [imageLoaded, setImageLoaded] = useState(false);
  const [ownerImageError, setOwnerImageError] = useState(false);

  const imageUrl = item.images?.[0] ?? null;
  const isBought = isItemPurchased(item);

  const canManage = currentUserId === item.userId || currentUserRole === "ADMIN";
  const showFooter = selectionMode || Boolean(item.price != null || item.url || canManage);

  const ownerName = hideOwner ? undefined : item.user?.name;
  const ownerId = item.user?.id ?? item.userId;
  const ownerImage = item.user?.avatarUrl ?? null;

  const isCardInteractive = Boolean(onOpenDetail || selectionMode);

  const handleCardClick = () => {
    if (selectionMode) {
      onToggleSelect?.(item.id);
      return;
    }
    onOpenDetail?.(item);
  };

  const showImage = Boolean(imageUrl && !imageError);
  /*
   * Карточке без снимка есть что показать вместо кадра — заметку и магазин.
   * Пустое место на её месте читалось «не догрузилось», а заметка — это как
   * раз то, ради чего такое желание записывали руками.
   */
  const shopHost = (() => {
    if (!item.url) return null;
    try {
      return new URL(item.url).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  })();
  const categoryLabel = getProductCategoryLabel(item.category, language);

  return (
    <Card
      data-testid="wishlist-card-v2"
      className={cn(
        "group/card relative flex h-full flex-col overflow-hidden rounded-2xl border-border/45 bg-[hsl(var(--surface-2))] shadow-[inset_0_1px_0_hsl(var(--foreground)/0.05)]",
        isBought && "opacity-[0.88] saturate-[0.85]",
        isCardInteractive &&
          "transition-[border-color,transform,box-shadow] duration-[var(--dur-base)] ease-[var(--ease-soft)] hover:-translate-y-1 hover:border-primary/45 hover:shadow-[var(--shadow-interactive-card-hover)]",
        selectionMode && "ring-1 ring-border/85",
        isSelected && "border-primary/70 ring-2 ring-primary/45 elevation-selected-card",
      )}
    >
      {(() => {
        const Wrapper = isCardInteractive ? "button" : "div";
        return (
          <Wrapper
            type={isCardInteractive ? "button" : undefined}
            className={cn(
              "flex min-w-0 flex-1 flex-col text-left",
              isCardInteractive &&
                "cursor-pointer appearance-none bg-transparent transition-colors duration-[var(--dur-base)] hover:bg-[hsl(var(--surface-3)/0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
            onClick={isCardInteractive ? handleCardClick : undefined}
            aria-pressed={selectionMode ? isSelected : undefined}
          >
            {/*
             * Кадра нет, если нет снимка.
             *
             * Раньше карточка без изображения держала полосу 60px — ровно чтобы
             * принять метку важности, которая жила поверх кадра. На сетке из
             * желаний, набранных руками, это давало ряд пустых рамок: четверть
             * высоты каждой карточки уходила на подложку под одну метку, а сама
             * сетка читалась как «не загрузилось». Важность переехала в строку
             * фактов, и полоса стала не нужна.
             */}
            {showImage ? (
              <div
                data-testid="wishlist-card-v2-media"
                className={cn(
                  /*
                   * Снимок лежит в «лотке» на светлой подложке, отбитом от краёв
                   * карточки. Раньше кадр шёл в край, а белый фон снимка
                   * заливал его светом; размытая копия снимка вокруг и
                   * растушёвка снизу лишь маскировали это.
                   */
                  "relative mx-2 mt-2 shrink-0 overflow-hidden rounded-xl",
                  imageLoaded ? "media-tile" : "bg-[hsl(var(--surface-1))]",
                  // На узком экране карточки идут в один столбец, поэтому кадр
                  // здесь шире: иначе один товар занимает пол-экрана по высоте.
                  "aspect-[16/10] sm:aspect-[4/3]",
                )}
              >
                {/* Снимки приходят в разных пропорциях: `contain` не обрезает ни один товар. */}
                <Image
                  src={imageUrl!}
                  alt=""
                  fill
                  className="wish-card-image object-contain p-4 sm:p-5"
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  unoptimized
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                />
              </div>
            ) : null}

            {selectionMode ? (
              <div
                className={cn(
                  "absolute right-2.5 top-2.5 z-20 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
                  isSelected
                    ? "border-primary-accent/70 bg-[hsl(var(--surface-4))] text-foreground"
                    : "border-border/70 bg-[hsl(var(--surface-3))] text-muted-foreground",
                )}
              >
                {isSelected ? t("Выбрано") : t("Выбрать")}
              </div>
            ) : null}

            <div className="flex min-w-0 flex-1 flex-col gap-2 px-3.5 pb-3 pt-3 sm:px-4">
              <h3
                data-testid="wishlist-card-v2-title"
                className={cn(
                  "line-clamp-2 min-h-[2.5rem] text-[15px] font-semibold leading-[1.25] tracking-[-0.008em] text-balance text-foreground sm:text-base",
                  isBought && "line-through decoration-muted-foreground/55",
                )}
              >
                {item.title}
              </h3>

              <div
                data-testid="wishlist-card-v2-meta"
                className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground sm:text-xs"
              >
                {/* Важность стоит первой среди фактов — и на карточке со снимком
                      тоже: плашка поверх фото закрывала сам товар. */}
                <PriorityBadgeInline priority={item.priority} />

                {/*
                 * Разделительных точек в строке нет. Каждый факт начинается со
                 * своего значка — важность, категория, аватар владельца, — и
                 * точка между ними ничего не разделяла, зато при переносе
                 * оставалась висеть в конце строки: «Винтажные пластинки ·» и
                 * пустота до края карточки. Разделяет теперь зазор.
                 */}
                {item.category ? (
                  <span
                    data-testid="wishlist-card-v2-category"
                    className="inline-flex min-w-0 items-center gap-1.5"
                  >
                    <ProductCategoryIcon
                      category={item.category}
                      className="size-3.5 shrink-0 text-muted-foreground/70"
                    />
                    <span className="truncate">{categoryLabel}</span>
                  </span>
                ) : null}

                {ownerName ? (
                  <span
                    data-testid="wishlist-card-v2-owner"
                    className="inline-flex min-w-0 items-center gap-1.5"
                  >
                    <span className="relative size-[18px] shrink-0 overflow-hidden rounded-full border border-primary/32">
                      {ownerImage && !ownerImageError ? (
                        <Image
                          src={ownerImage}
                          alt={ownerName}
                          fill
                          className="object-cover"
                          sizes="20px"
                          unoptimized={ownerImage.startsWith("/uploads/")}
                          onError={() => setOwnerImageError(true)}
                        />
                      ) : (
                        <span
                          aria-hidden
                          className={cn(
                            "flex size-full items-center justify-center rounded-full",
                            getAvatarColor(ownerId),
                          )}
                        />
                      )}
                    </span>
                    <span className="min-w-0 truncate">{ownerName}</span>
                  </span>
                ) : null}
              </div>

              {!showImage && (item.notes || shopHost) ? (
                <div className="flex min-w-0 flex-col gap-1.5 border-t border-border/32 pt-2.5">
                  {item.notes ? (
                    <p className="line-clamp-3 text-sm leading-snug text-muted-foreground">
                      {item.notes}
                    </p>
                  ) : null}
                  {shopHost ? (
                    <p className="truncate text-xs text-muted-foreground-subtle">{shopHost}</p>
                  ) : null}
                </div>
              ) : null}

              {isBought ? (
                <div
                  data-testid="wishlist-card-v2-purchased-label"
                  className={cn(
                    "relative inline-flex w-fit items-center gap-1.5 rounded-full border border-success/45 bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success",
                    // Печать проигрывается только по действию пользователя, а не
                    // при каждом появлении уже купленной карточки в списке.
                    justPurchased && "seal-in seal-ring",
                  )}
                >
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  {t("Уже куплено")}
                </div>
              ) : null}
            </div>
          </Wrapper>
        );
      })()}

      {showFooter ? (
        <div
          data-testid="wishlist-card-v2-footer"
          className="mt-auto flex min-h-[3.25rem] items-center justify-between gap-2 px-3.5 pb-3 pt-1 sm:px-4"
        >
          {selectionMode ? (
            <p className="text-xs text-muted-foreground">
              {isSelected
                ? t("Нажмите на карточку, чтобы снять выбор.")
                : t("Нажмите на карточку, чтобы выбрать её.")}
            </p>
          ) : (
            <>
              {item.price != null ? (
                <p
                  data-testid="wishlist-card-v2-price"
                  className="min-w-0 flex-1 truncate text-xl font-bold leading-none tabular-nums tracking-[-0.02em] text-foreground"
                >
                  {formatPrice(item.price, item.currency, language)}
                </p>
              ) : (
                <span className="min-w-0 flex-1" aria-hidden />
              )}

              {item.url || canManage ? (
                <div className="flex shrink-0 items-center gap-1">
                  {/*
                   * Действия — иконки, а не подписанные кнопки: повторённое
                   * восемь раз в сетке слово «Открыть» весит больше, чем
                   * названия самих товаров. Подписи остаются во всплывающей
                   * подсказке и в `aria-label`.
                   */}
                  {item.url ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      title={t("Открыть в новой вкладке")}
                      aria-label={t("Открыть ссылку на товар в новой вкладке")}
                      className="size-11 min-h-[44px] min-w-[44px] border-transparent bg-[hsl(var(--surface-3))] text-muted-foreground hover:bg-[hsl(var(--surface-4))] hover:text-foreground sm:size-9 sm:min-h-9 sm:min-w-9"
                    >
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ExternalLink aria-hidden />
                      </a>
                    </Button>
                  ) : null}

                  {canManage ? (
                    <ItemActionsMenu
                      item={item}
                      statusPending={statusPending}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onSetStatus={onSetStatus}
                      label={t("Действия с карточкой")}
                      testId="wishlist-card-actions"
                      triggerClassName="size-11 min-h-[44px] min-w-[44px] border-transparent bg-[hsl(var(--surface-3))] text-muted-foreground hover:bg-[hsl(var(--surface-4))] hover:text-foreground sm:size-9 sm:min-h-9 sm:min-w-9"
                    />
                  ) : null}
                </div>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </Card>
  );
});
