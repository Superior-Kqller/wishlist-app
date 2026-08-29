"use client";

import { memo, useState } from "react";
import Image from "next/image";
import {
  Check,
  CheckCircle2,
  ExternalLink,
  MoreHorizontal,
  Pencil,
  Trash2,
  Undo2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { WishlistItem } from "@/types";
import { cn, formatPrice } from "@/lib/utils";
import { getInitials, getAvatarColor } from "@/lib/avatar-utils";
import { PriorityBadgeOverlay } from "./priority-badge";
import { IconButton } from "@/components/ui/icon-button";
import { useI18n } from "@/components/i18n/language-provider";
import { getProductCategoryLabel } from "@/lib/categories";
import { getPurchaseToggleTarget, isItemPurchased } from "@/lib/item-status";
import { ProductCategoryIcon } from "@/lib/category-icons";

export interface WishCardProps {
  item: WishlistItem;
  onEdit: (item: WishlistItem) => void;
  onDelete: (id: string) => void;
  onTogglePurchased: (id: string, purchased: boolean) => void;
  onSetStatus?: (id: string, status: "AVAILABLE" | "PURCHASED") => void;
  statusPending?: boolean;
  /** Товар только что отмечен купленным в этой сессии. */
  justPurchased?: boolean;
  onOpenDetail?: (item: WishlistItem) => void;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  currentUserId?: string;
  currentUserRole?: "ADMIN" | "USER" | null;
}

export const WishCard = memo(function WishCard({
  item,
  onEdit,
  onDelete,
  onTogglePurchased,
  onSetStatus,
  statusPending = false,
  justPurchased = false,
  onOpenDetail,
  selectionMode,
  isSelected,
  onToggleSelect,
  currentUserId,
  currentUserRole,
}: WishCardProps) {
  const { language, t } = useI18n();
  const [imageError, setImageError] = useState(false);
  const [ownerImageError, setOwnerImageError] = useState(false);

  const imageUrl = item.images?.[0] ?? null;
  const isBought = isItemPurchased(item);

  const canManage = currentUserId === item.userId || currentUserRole === "ADMIN";
  const showFooter = selectionMode || Boolean(item.price != null || item.url || canManage);

  const ownerName = item.user?.name;
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

  const handleMarkPurchased = () => {
    if (onSetStatus) {
      onSetStatus(item.id, getPurchaseToggleTarget(item));
    } else {
      onTogglePurchased(item.id, !item.purchased);
    }
  };

  const showImage = Boolean(imageUrl && !imageError);
  const categoryLabel = getProductCategoryLabel(item.category, language);

  return (
    <Card
      data-testid="wishlist-card-v2"
      className={cn(
        "group/card flex h-full flex-col overflow-hidden rounded-2xl border-border/45 bg-[hsl(var(--surface-2))] shadow-none",
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
                "cursor-pointer appearance-none bg-transparent transition-colors duration-[var(--dur-base)] hover:bg-[hsl(var(--surface-3)/0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
            onClick={isCardInteractive ? handleCardClick : undefined}
            aria-pressed={selectionMode ? isSelected : undefined}
          >
            <div
              data-testid="wishlist-card-v2-media"
              className={cn(
                "relative w-full shrink-0 overflow-hidden bg-[hsl(var(--surface-1))]",
                showImage
                  ? // На узком экране карточки идут в один столбец, поэтому кадр
                    // здесь шире: иначе один товар занимает пол-экрана по высоте.
                    "aspect-[16/10] sm:aspect-[4/3]"
                  : // Без снимка кадр незачем держать: желания, набранные руками,
                    // отдавали половину экрана телефона подарочной иконке в пустой
                    // рамке. Остаётся полоса — ровно чтобы принять метку важности,
                    // которая живёт поверх кадра.
                    "h-14 sm:h-[3.75rem]",
              )}
            >
              {/*
               * Фотографии товаров приходят с чужих сайтов: разные пропорции и
               * разные фоны. Размытая копия снимка заполняет кадр целиком, а
               * резкая версия остаётся целой поверх — так карточки выстраиваются
               * в ровную сетку, и ни один товар не обрезается.
               */}
              {showImage ? (
                <>
                  {/*
                   * Подложка — CSS-фон, а не второй <Image>: адрес тот же, браузер
                   * берёт уже раскодированный снимок из кэша. Сетка из двух
                   * десятков карточек иначе платила за вдвое больше декодирований
                   * ради изображения, которое всё равно размыто.
                   */}
                  <div
                    aria-hidden
                    style={{ backgroundImage: `url(${JSON.stringify(imageUrl!)})` }}
                    className="absolute inset-0 scale-125 bg-cover bg-center opacity-40 blur-2xl"
                  />
                  <Image
                    src={imageUrl!}
                    alt=""
                    fill
                    className="wish-card-image relative object-contain p-4 sm:p-5"
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                    unoptimized
                    onError={() => setImageError(true)}
                  />
                </>
              ) : (
                // Подарочная иконка убрана вместе с кадром: в полосе высотой
                // 56px она сталкивалась бы с меткой важности, а украшать
                // отсутствие снимка нечем и незачем.
                <div className="h-full w-full bg-[linear-gradient(140deg,hsl(var(--surface-3))_0%,hsl(var(--surface-1))_100%)]" />
              )}

              {/*
               * Растушёвка нижней кромки принадлежит снимку: она гасит его край
               * перед текстом. В полосе без снимка её 80px накрыли бы всю
               * полосу целиком, вместе с меткой важности.
               */}
              {showImage ? (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[hsl(var(--surface-2))] via-[hsl(var(--surface-2)/0.55)] to-transparent"
                />
              ) : null}

              <PriorityBadgeOverlay priority={item.priority} />

              {selectionMode ? (
                <div
                  className={cn(
                    "absolute right-2.5 top-2.5 z-20 rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md",
                    isSelected
                      ? "border-primary/55 bg-primary/24 text-foreground"
                      : "border-white/24 bg-zinc-950/70 text-white/95",
                  )}
                >
                  {isSelected ? t("Выбрано") : t("Выбрать")}
                </div>
              ) : null}
            </div>

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

              {item.category || ownerName ? (
                <div
                  data-testid="wishlist-card-v2-meta"
                  className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-muted-foreground"
                >
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

                  {item.category && ownerName ? (
                    <span aria-hidden className="size-0.5 rounded-full bg-muted-foreground/45" />
                  ) : null}

                  {ownerName ? (
                    <span
                      data-testid="wishlist-card-v2-owner"
                      className="inline-flex min-w-0 items-center gap-1.5"
                    >
                      <Avatar className="size-[18px] shrink-0">
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
                          <AvatarFallback
                            className={cn(
                              "text-[8px] font-semibold text-avatar-foreground",
                              getAvatarColor(ownerId),
                            )}
                          >
                            {getInitials(ownerName)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <span className="min-w-0 truncate">{ownerName}</span>
                    </span>
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
          className="mt-auto flex min-h-[3.25rem] items-center justify-between gap-2 border-t border-border/32 px-3.5 py-2.5 sm:px-4"
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
                  className="min-w-0 flex-1 truncate text-[17px] font-semibold leading-none tabular-nums tracking-[-0.01em] text-foreground"
                >
                  {formatPrice(item.price, item.currency, language)}
                </p>
              ) : (
                <span className="min-w-0 flex-1" aria-hidden />
              )}

              {item.url || canManage ? (
                <TooltipProvider delayDuration={450} skipDelayDuration={200}>
                  <div className="flex shrink-0 items-center gap-1">
                    {/*
                     * Действия — иконки, а не подписанные кнопки: повторённое
                     * восемь раз в сетке слово «Открыть» весит больше, чем
                     * названия самих товаров. Подписи остаются во всплывающей
                     * подсказке и в `aria-label`.
                     */}
                    {item.url ? (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <IconButton
                            asChild
                            iconSize="sm"
                            aria-label={t("Открыть ссылку на товар в новой вкладке")}
                            className="size-11 min-h-[44px] min-w-[44px] border-transparent bg-transparent text-muted-foreground hover:border-primary/32 hover:bg-primary/10 hover:text-foreground sm:size-9 sm:min-h-9 sm:min-w-9"
                          >
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink aria-hidden />
                            </a>
                          </IconButton>
                        </TooltipTrigger>
                        <TooltipContent>{t("Открыть в новой вкладке")}</TooltipContent>
                      </Tooltip>
                    ) : null}

                    {canManage ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <IconButton
                            type="button"
                            data-testid="wishlist-card-actions"
                            iconSize="sm"
                            aria-label={t("Действия с карточкой")}
                            className="size-11 min-h-[44px] min-w-[44px] border-transparent bg-transparent text-muted-foreground hover:border-primary/32 hover:bg-primary/10 hover:text-foreground sm:size-9 sm:min-h-9 sm:min-w-9"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal aria-hidden />
                          </IconButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkPurchased();
                            }}
                            disabled={statusPending}
                          >
                            {isBought ? (
                              <Undo2 className="mr-2 h-4 w-4" />
                            ) : (
                              <Check className="mr-2 h-4 w-4" />
                            )}
                            {isBought ? t("Вернуть в доступные") : t("Отметить купленным")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(item);
                            }}
                            disabled={statusPending}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            {t("Редактировать")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(item.id);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("Удалить")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : null}
                  </div>
                </TooltipProvider>
              ) : null}
            </>
          )}
        </div>
      ) : null}
    </Card>
  );
});
