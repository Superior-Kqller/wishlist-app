"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  WishlistItem,
  CreateItemPayload,
  UpdateItemPayload,
  ListWithMeta,
} from "@/types";
import { getPriorityLabel, getPriorityShortLabel } from "@/lib/priority-labels";
import {
  clampWishlistPriority,
  priorityBadgeToneByPriority,
  priorityDotClassByPriority,
  type WishlistPriority,
} from "@/lib/priority-styles";
import { cn } from "@/lib/utils";
import { AlertTriangle, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { useI18n } from "@/components/i18n/language-provider";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: WishlistItem | null;
  onSave: (data: CreateItemPayload | UpdateItemPayload) => Promise<void>;
  initialData?: Partial<CreateItemPayload>;
  existingLists?: ListWithMeta[];
  /** Один раз при открытии вызвать парсинг по полю URL (для bookmarklet с fill=1) */
  autoFillFromUrlOnce?: boolean;
  /** Предвыбранная подборка при добавлении (например, первая своя подборка) */
  defaultListId?: string | null;
  /** Нельзя сохранить без подборки; скрыть пункт «Без подборки» */
  listPickerRequired?: boolean;
}

const CURRENCIES = [
  { value: "RUB", label: "₽ RUB" },
  { value: "USD", label: "$ USD" },
  { value: "EUR", label: "€ EUR" },
  { value: "CNY", label: "¥ CNY" },
];

const PRIORITY_OPTIONS: WishlistPriority[] = [1, 2, 3, 4, 5];

function areStringArraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function ItemFormDialog({
  open,
  onOpenChange,
  item,
  onSave,
  initialData,
  existingLists = [],
  autoFillFromUrlOnce = false,
  defaultListId = null,
  listPickerRequired = false,
}: ItemFormDialogProps) {
  const { language, t } = useI18n();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("RUB");
  const [priority, setPriority] = useState(3);
  const [listId, setListId] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [parsingUrl, setParsingUrl] = useState(false);
  const autoFillOnceDoneRef = useRef(false);

  const isEdit = !!item;

  const resetForm = useCallback(() => {
    setTitle("");
    setUrl("");
    setPrice("");
    setCurrency("RUB");
    setPriority(3);
    setListId(listPickerRequired ? defaultListId ?? null : null);
    setCategory(null);
    setNotes("");
    setImageUrl("");
  }, [listPickerRequired, defaultListId]);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setUrl(item.url || "");
      setPrice(item.price?.toString() || "");
      setCurrency(item.currency);
      setPriority(item.priority);
      setListId(item.listId ?? null);
      setCategory(item.category);
      setNotes(item.notes || "");
      setImageUrl(item.images?.[0] ?? "");
    } else if (initialData) {
      setTitle(initialData.title || "");
      setUrl(initialData.url || "");
      setPrice(initialData.price?.toString() || "");
      setCurrency(initialData.currency || "RUB");
      setPriority(initialData.priority || 3);
      setListId(initialData.listId ?? defaultListId ?? null);
      setCategory(initialData.category ?? null);
      setNotes(initialData.notes || "");
      setImageUrl(initialData.images?.[0] ?? "");
    } else {
      resetForm();
    }
  }, [item, initialData, open, defaultListId, resetForm]);

  useEffect(() => {
    if (!open) {
      autoFillOnceDoneRef.current = false;
    }
  }, [open]);

  const handleFillFromUrl = useCallback(async () => {
    const u = url.trim();
    if (!u) {
      toast.error(t("Вставьте ссылку в поле ниже"));
      return;
    }
    setParsingUrl(true);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: u }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || t("Не удалось получить данные по ссылке"));
      }
      const data: {
        title?: string;
        price?: number | null;
        currency?: string;
        images?: string[];
        description?: string;
      } = await res.json();
      if (data.title?.trim()) setTitle(data.title.trim());
      if (data.price != null && !Number.isNaN(Number(data.price))) {
        setPrice(String(data.price));
      }
      if (data.currency) setCurrency(data.currency);
      if (data.images?.[0]) setImageUrl(data.images[0]);
      if (data.description?.trim()) {
        const d = data.description.trim();
        setNotes((prev) => {
          const p = prev.trim();
          if (!p) return d;
          if (p.includes(d)) return prev;
          return `${p}\n\n${d}`;
        });
      }
      toast.success(t("Поля заполнены по ссылке"));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : t("Ошибка парсинга");
      toast.error(msg);
    } finally {
      setParsingUrl(false);
    }
  }, [url, t]);

  useEffect(() => {
    if (!open || isEdit || !autoFillFromUrlOnce || autoFillOnceDoneRef.current) {
      return;
    }
    const u = url.trim();
    if (!u) return;
    autoFillOnceDoneRef.current = true;
    void handleFillFromUrl();
  }, [open, isEdit, autoFillFromUrlOnce, url, handleFillFromUrl]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextTitle = title.trim();
    const nextUrl = url.trim();
    const nextNotes = notes.trim();
    const nextImageUrl = imageUrl.trim();
    const nextImages = nextImageUrl ? [nextImageUrl] : [];
    const nextPriceText = price.trim().replace(",", ".");
    const nextPrice = nextPriceText ? Number(nextPriceText) : null;

    if (!nextTitle) {
      toast.error(t("Введите название"));
      return;
    }
    if (nextPrice !== null && (!Number.isFinite(nextPrice) || nextPrice < 0)) {
      toast.error(t("Введите корректную цену"));
      return;
    }

    const effectiveListId =
      listId || (listPickerRequired ? defaultListId : null);
    if (listPickerRequired && !effectiveListId) {
      toast.error(
        existingLists.length === 0
          ? t("Сначала создайте подборку в фильтрах на главной")
          : t("Выберите подборку"),
      );
      return;
    }

    setSaving(true);
    try {
      if (item) {
        const nextListId = effectiveListId ?? null;
        const data: UpdateItemPayload = {};

        if (nextTitle !== item.title) data.title = nextTitle;
        if (nextUrl !== (item.url ?? "")) data.url = nextUrl || null;
        if (nextPrice !== item.price) data.price = nextPrice;
        if (currency !== item.currency) data.currency = currency;
        if (priority !== item.priority) data.priority = priority;
        if (nextListId !== (item.listId ?? null)) data.listId = nextListId;
        if (category !== (item.category ?? null)) data.category = category;
        if (nextNotes !== (item.notes ?? "")) data.notes = nextNotes || null;
        if (!areStringArraysEqual(nextImages, item.images)) data.images = nextImages;

        if (Object.keys(data).length === 0) {
          toast.info(t("Нет изменений для сохранения"));
          return;
        }

        await onSave(data);
      } else {
        await onSave({
          title: nextTitle,
          url: nextUrl || undefined,
          price: nextPrice ?? undefined,
          currency,
          priority,
          listId: effectiveListId || undefined,
          category,
          notes: nextNotes || undefined,
          images: nextImages,
        });
      }
      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("Ошибка при сохранении"));
    } finally {
      setSaving(false);
    }
  }

  const selectedPriority = clampWishlistPriority(priority);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-5xl xl:max-w-[68rem]"
        bodyClassName="gap-0 overflow-y-auto p-0"
      >
        <div className="border-b border-border/34 bg-[hsl(var(--surface-2))/0.72] px-4 py-3 sm:px-5">
          <DialogHeader className="space-y-1 pr-10 sm:pr-12">
            <DialogTitle className="text-xl leading-tight">
              {isEdit ? t("Редактировать") : t("Добавить товар")}
            </DialogTitle>
            <DialogDescription className="max-w-3xl text-sm leading-snug">
              {isEdit
                ? t("Измените данные и сохраните")
                : t("По ссылке / Вручную: ссылка необязательна, можно заполнить карточку самому или подтянуть данные со страницы товара.")}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="min-h-0">
          <div className="grid min-h-0 lg:grid-cols-[minmax(0,0.95fr)_minmax(19rem,0.72fr)]">
            <div className="space-y-3.5 px-4 py-4 sm:px-5">
              <div className="space-y-2">
                <Label htmlFor="title">{t("Название")} *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="iPhone 16 Pro Max"
                  required
                />
              </div>

              <div className="space-y-2 rounded-xl border border-border/34 bg-[hsl(var(--surface-3))/0.28] p-3">
                <div className="space-y-1">
                  <Label htmlFor="url">{t("Ссылка (необязательно)")}</Label>
                  <p className="text-xs leading-snug text-muted-foreground">
                    {t("Вставьте URL страницы товара и нажмите «Заполнить» — подтянем название, цену, изображения и краткое описание, где это доступно.")}
                  </p>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                  <Input
                    id="url"
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://..."
                    className="min-w-0"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0 px-3"
                    disabled={parsingUrl || !url.trim() || isEdit}
                    onClick={handleFillFromUrl}
                    title={
                      isEdit
                        ? t("Автозаполнение по ссылке доступно только при добавлении товара")
                        : undefined
                    }
                  >
                    {parsingUrl && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                    )}
                    {parsingUrl ? t("Загрузка…") : t("Заполнить")}
                  </Button>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {existingLists.length > 0 && (
                  <div className="space-y-2">
                    <Label>{t("Подборка")}{listPickerRequired ? " *" : ""}</Label>
                    <Select
                      value={
                        listPickerRequired
                          ? (listId || defaultListId || existingLists[0]?.id || "")
                          : (listId ?? "none")
                      }
                      onValueChange={(v) => setListId(v === "none" ? null : v)}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            listPickerRequired ? t("Выберите подборку") : t("Без подборки")
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {!listPickerRequired && (
                          <SelectItem value="none">{t("Без подборки")}</SelectItem>
                        )}
                        {existingLists.map((list) => (
                          <SelectItem key={list.id} value={list.id}>
                            {list.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>{t("Категория")}</Label>
                  <Select value={category ?? "none"} onValueChange={(value) => setCategory(value === "none" ? null : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("Выберите категорию")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">{t("Без категории")}</SelectItem>
                      {PRODUCT_CATEGORIES.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.icon} {language === "en" ? option.labelEn : option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {existingLists.length > 0 && !listPickerRequired && !listId && (
                <p className="flex items-start gap-1.5 rounded-lg border border-warning/24 bg-warning/8 px-2.5 py-2 text-xs text-warning">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {t("Товар без подборки будет скрыт. Привяжите его к подборке, чтобы он стал виден.")}
                </p>
              )}

              <div className="space-y-2">
                <Label htmlFor="notes">{t("Заметка")}</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("Дополнительная информация…")}
                  rows={4}
                  className="min-h-24 resize-y"
                />
              </div>
            </div>

            <aside className="space-y-3.5 border-t border-border/34 bg-[hsl(var(--surface-1))/0.24] px-4 py-4 sm:px-5 lg:border-l lg:border-t-0">
              <div className="space-y-2">
                <Label htmlFor="item-image-url">{t("Изображение")}</Label>
                <div className="relative aspect-[16/9] overflow-hidden rounded-xl border border-border/38 bg-[hsl(var(--surface-2))/0.72] shadow-[inset_0_1px_0_hsl(var(--foreground)/0.035)]">
                  {imageUrl.trim() ? (
                    <>
                      <Image
                        src={imageUrl.trim()}
                        alt={title.trim() || t("Изображение товара")}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 320px"
                        unoptimized
                      />
                      <button
                        type="button"
                        onClick={() => setImageUrl("")}
                        aria-label={t("Убрать изображение")}
                        className="absolute right-2 top-2 z-10 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border/70 bg-[hsl(var(--surface-1)/0.78)] text-foreground transition-colors backdrop-blur-md hover:bg-[hsl(var(--surface-2))/0.9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        title={t("Убрать изображение")}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center px-4 text-center text-muted-foreground/70">
                      <span className="text-sm font-medium">{t("Предпросмотр")}</span>
                      <span className="mt-1 text-xs">{t("Добавьте URL изображения ниже")}</span>
                    </div>
                  )}
                </div>
                <Input
                  id="item-image-url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder={t("URL изображения (необязательно)")}
                />
              </div>

              <div className="grid grid-cols-[1fr_7.5rem] gap-2">
                <div className="space-y-2">
                  <Label htmlFor="price">{t("Ориентировочная цена")}</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t("Валюта")}</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CURRENCIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t("Приоритет")}</Label>
                <div
                  role="group"
                  aria-label={t("Приоритет")}
                  data-testid="priority-select-dialog"
                  className="grid grid-cols-2 gap-2"
                >
                  {PRIORITY_OPTIONS.map((value) => {
                    const isSelected = selectedPriority === value;
                    const label = getPriorityLabel(value, language);
                    const shortLabel = getPriorityShortLabel(value, language);

                    return (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={isSelected}
                        aria-label={`${t("Приоритет")} ${value}: ${label}`}
                        onClick={() => setPriority(value)}
                        className={cn(
                          "flex min-h-[44px] items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          isSelected
                            ? priorityBadgeToneByPriority[value]
                            : "border-border/50 bg-[hsl(var(--surface-2))/0.58] text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        <span
                          aria-hidden="true"
                          className={cn(
                            "h-2.5 w-2.5 shrink-0 rounded-full",
                            priorityDotClassByPriority[value],
                          )}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate">{label}</span>
                          <span className="block truncate text-[11px] font-medium text-muted-foreground/82 sm:text-xs">
                            {t("Уровень")} {value} · {shortLabel}
                          </span>
                        </span>
                        {isSelected ? (
                          <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">
                            {t("Выбрано")}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>

            </aside>
          </div>

          <DialogFooter className="grid grid-cols-2 border-t border-border/34 bg-[hsl(var(--surface-2))/0.72] px-4 py-3 sm:flex sm:px-5">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("Отмена")}
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? t("Сохранить") : t("Добавить")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
