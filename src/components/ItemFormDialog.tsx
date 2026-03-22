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
import { PrioritySelect } from "./PrioritySelect";
import { WishlistItem, CreateItemPayload, Tag, ListWithMeta } from "@/types";
import { getTagColor } from "@/lib/utils";
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
  /** Предвыбранная подборка при добавлении (текущий фильтр на главной) */
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
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [parsingUrl, setParsingUrl] = useState(false);
  const autoFillOnceDoneRef = useRef(false);

  const isEdit = !!item;

  useEffect(() => {
    if (item) {
      setTitle(item.title);
      setUrl(item.url || "");
      setPrice(item.price?.toString() || "");
      setCurrency(item.currency);
      setPriority(item.priority);
      setListId(item.listId ?? null);
      setNotes(item.notes || "");
      setImages(item.images || []);
      setTags(item.tags.map((t) => t.name));
    } else if (initialData) {
      setTitle(initialData.title || "");
      setUrl(initialData.url || "");
      setPrice(initialData.price?.toString() || "");
      setCurrency(initialData.currency || "RUB");
      setPriority(initialData.priority || 3);
      setListId(initialData.listId ?? defaultListId ?? null);
      setNotes(initialData.notes || "");
      setImages(initialData.images || []);
      setTags(initialData.tags || []);
    } else {
      resetForm();
    }
  }, [item, initialData, open, defaultListId]);

  useEffect(() => {
    if (!open) {
      autoFillOnceDoneRef.current = false;
    }
  }, [open]);

  function resetForm() {
    setTitle("");
    setUrl("");
    setPrice("");
    setCurrency("RUB");
    setPriority(3);
    setListId(listPickerRequired ? defaultListId ?? null : null);
    setNotes("");
    setImages([]);
    setNewImageUrl("");
    setTagInput("");
    setTags([]);
  }

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

  function addImage() {
    const imgUrl = newImageUrl.trim();
    if (imgUrl && !images.includes(imgUrl)) {
      setImages([...images, imgUrl]);
    }
    setNewImageUrl("");
  }

  function removeImage(imgUrl: string) {
    setImages(images.filter((i) => i !== imgUrl));
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
      if (data.images?.length) setImages(data.images);
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
      toast.error("Выберите подборку");
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
        images,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
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
                <p className="flex items-start gap-1.5 text-xs text-amber-600 dark:text-amber-400">
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
            <PrioritySelect
              priority={priority}
              onChange={setPriority}
              triggerTestId="priority-select-dialog"
            />
          </div>

          {/* Images */}
          <div className="space-y-2">
            <Label>Изображения</Label>
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <div
                    key={i}
                    className="relative w-16 h-16 rounded-lg overflow-hidden border group"
                  >
                    <Image
                      src={img}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="64px"
                      unoptimized={img.startsWith("data:") || img.startsWith("blob:")}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(img)}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="URL изображения"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addImage();
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={addImage}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
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
                      className="transition-transform active:scale-95"
                    >
                      <Badge
                        variant={selected ? "default" : "outline"}
                        className="cursor-pointer"
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
                      className="hover:text-destructive rounded-full p-0.5 min-w-[20px] min-h-[20px]"
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
