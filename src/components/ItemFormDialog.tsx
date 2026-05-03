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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WishlistItem, CreateItemPayload, Tag, ListWithMeta } from "@/types";
import { getPriorityShortLabel } from "@/lib/priority-labels";
import {
  clampWishlistPriority,
  priorityBadgeToneByPriority,
  priorityDotClassByPriority,
  type WishlistPriority,
} from "@/lib/priority-styles";
import { cn, getTagColor } from "@/lib/utils";
import { AlertTriangle, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

interface ItemFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item?: WishlistItem | null;
  onSave: (data: CreateItemPayload) => Promise<void>;
  initialData?: Partial<CreateItemPayload>;
  existingTags?: Tag[];
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

export function ItemFormDialog({
  open,
  onOpenChange,
  item,
  onSave,
  initialData,
  existingTags = [],
  existingLists = [],
  autoFillFromUrlOnce = false,
  defaultListId = null,
  listPickerRequired = false,
}: ItemFormDialogProps) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("RUB");
  const [priority, setPriority] = useState(3);
  const [listId, setListId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
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
    setNotes("");
    setImageUrl("");
    setTagInput("");
    setTags([]);
  }, [listPickerRequired, defaultListId]);

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setUrl(item.url || "");
      setPrice(item.price?.toString() || "");
      setCurrency(item.currency);
      setPriority(item.priority);
      setListId(item.listId ?? null);
      setNotes(item.notes || "");
      setImageUrl(item.images?.[0] ?? "");
      setTags(item.tags.map((t) => t.name));
    } else if (initialData) {
      setTitle(initialData.title || "");
      setUrl(initialData.url || "");
      setPrice(initialData.price?.toString() || "");
      setCurrency(initialData.currency || "RUB");
      setPriority(initialData.priority || 3);
      setListId(initialData.listId ?? defaultListId ?? null);
      setNotes(initialData.notes || "");
      setImageUrl(initialData.images?.[0] ?? "");
      setTags(initialData.tags || []);
    } else {
      resetForm();
    }
  }, [item, initialData, open, defaultListId, resetForm]);

  useEffect(() => {
    if (!open) {
      autoFillOnceDoneRef.current = false;
    }
  }, [open]);

  function addTag() {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  const handleFillFromUrl = useCallback(async () => {
    const u = url.trim();
    if (!u) {
      toast.error("Вставьте ссылку в поле ниже");
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
        throw new Error(err.message || "Не удалось получить данные по ссылке");
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
      toast.success("Поля заполнены по ссылке");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Ошибка парсинга";
      toast.error(msg);
    } finally {
      setParsingUrl(false);
    }
  }, [url]);

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
    if (!title.trim()) {
      toast.error("Введите название");
      return;
    }

    const effectiveListId =
      listId || (listPickerRequired ? defaultListId : null);
    if (listPickerRequired && !effectiveListId) {
      toast.error(
        existingLists.length === 0
          ? "Сначала создайте подборку в фильтрах на главной"
          : "Выберите подборку",
      );
      return;
    }

    setSaving(true);
    try {
      await onSave({
        title: title.trim(),
        url: url.trim() || undefined,
        price: price ? parseFloat(price) : undefined,
        currency,
        priority,
        listId: effectiveListId || undefined,
        notes: notes.trim() || undefined,
        images: imageUrl.trim() ? [imageUrl.trim()] : [],
        tags,
      });
      onOpenChange(false);
      resetForm();
    } catch {
      toast.error("Ошибка при сохранении");
    } finally {
      setSaving(false);
    }
  }

  const selectedPriority = clampWishlistPriority(priority);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Редактировать" : "Добавить товар"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Измените данные и сохраните"
              : "По ссылке / Вручную. Ссылка необязательна — заполните название и при желании цену, фото и теги."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Название *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="iPhone 16 Pro Max"
              required
            />
          </div>

          {/* URL */}
          <div className="space-y-2">
            <Label htmlFor="url">Ссылка (необязательно)</Label>
            <p className="text-xs text-muted-foreground">
              Вставьте URL страницы товара и нажмите «Заполнить» — подтянем название,
              цену, изображения и краткое описание (Open Graph), где это доступно.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="sm:flex-1"
              />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 sm:w-auto"
                disabled={parsingUrl || !url.trim() || isEdit}
                onClick={handleFillFromUrl}
                title={
                  isEdit
                    ? "Автозаполнение по ссылке доступно только при добавлении товара"
                    : undefined
                }
              >
                {parsingUrl && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                )}
                {parsingUrl ? "Загрузка…" : "Заполнить по ссылке"}
              </Button>
            </div>
          </div>

          {/* List (optional при редактировании; при добавлении с главной — обязательна) */}
          {existingLists.length > 0 && (
            <div className="space-y-2">
              <Label>Подборка{listPickerRequired ? " *" : ""}</Label>
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
                      listPickerRequired ? "Выберите подборку" : "Без подборки"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {!listPickerRequired && (
                    <SelectItem value="none">Без подборки</SelectItem>
                  )}
                  {existingLists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!listPickerRequired && !listId && (
                <p className="flex items-start gap-1.5 text-xs text-warning">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  Товар без подборки будет скрыт. Привяжите его к подборке, чтобы он стал виден.
                </p>
              )}
            </div>
          )}

          {/* Price + Currency */}
          <div className="grid grid-cols-[1fr_120px] gap-2">
            <div className="space-y-2">
              <Label htmlFor="price">Цена</Label>
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
              <Label>Валюта</Label>
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

          {/* Priority */}
          <div className="space-y-2">
            <Label>Приоритет</Label>
            <div
              role="group"
              aria-label="Приоритет"
              data-testid="priority-select-dialog"
              className="grid grid-cols-2 gap-2 sm:grid-cols-5"
            >
              {PRIORITY_OPTIONS.map((value) => {
                const isSelected = selectedPriority === value;

                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setPriority(value)}
                    className={cn(
                      "flex min-h-[48px] items-center gap-2 rounded-lg border px-3 text-left text-xs font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:flex-col sm:items-start sm:justify-center sm:gap-1.5",
                      isSelected
                        ? priorityBadgeToneByPriority[value]
                        : "border-input bg-card text-muted-foreground hover:border-border/90 hover:bg-accent hover:text-foreground",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        priorityDotClassByPriority[value],
                      )}
                    />
                    <span className="truncate">{getPriorityShortLabel(value)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Одно изображение по URL */}
          <div className="space-y-2">
            <Label htmlFor="item-image-url">Изображение</Label>
            {imageUrl.trim() ? (
              <div className="relative h-24 w-24 overflow-hidden rounded-lg border group">
                <Image
                  src={imageUrl.trim()}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="96px"
                  unoptimized
                />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  aria-label="Убрать изображение"
                  className="absolute right-1.5 top-1.5 z-10 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-border/70 bg-[hsl(var(--surface-1)/0.78)] text-foreground opacity-100 transition-opacity backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                  title="Убрать изображение"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}
            <Input
              id="item-image-url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="URL изображения (необязательно)"
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label>Теги</Label>
            {existingTags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-muted-foreground w-full">Выберите из существующих:</span>
                {existingTags.map((t) => {
                  const selected = tags.includes(t.name);
                  const color = t.color === "#6366f1" ? getTagColor(t.name) : t.color;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => (selected ? removeTag(t.name) : setTags([...tags, t.name]))}
                      aria-pressed={selected}
                      aria-label={`${selected ? "Убрать тег" : "Добавить тег"}: ${t.name}`}
                      className="min-h-[44px] rounded-full transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <Badge
                        variant={selected ? "default" : "outline"}
                        className="min-h-[36px] cursor-pointer px-3"
                        style={selected ? { backgroundColor: color, borderColor: color } : { borderColor: color, color }}
                      >
                        {t.name}
                      </Badge>
                    </button>
                  );
                })}
              </div>
            )}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-muted-foreground w-full">Выбранные:</span>
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      aria-label={`Убрать тег: ${tag}`}
                      className="-mr-2 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="Новый тег (Enter)"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addTag}
                title="Добавить тег"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Заметка</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Дополнительная информация..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEdit ? "Сохранить" : "Добавить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
