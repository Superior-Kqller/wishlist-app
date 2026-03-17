"use client";

import { useState, useEffect } from "react";
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
import { PriorityStars } from "./PriorityStars";
import { WishlistItem, CreateItemPayload, Tag, ListWithMeta } from "@/types";
import { getTagColor } from "@/lib/utils";
import { Loader2, Plus, X } from "lucide-react";
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
      setListId(initialData.listId ?? null);
      setNotes(initialData.notes || "");
      setImages(initialData.images || []);
      setTags(initialData.tags || []);
    } else {
      resetForm();
    }
  }, [item, initialData, open]);

  function resetForm() {
    setTitle("");
    setUrl("");
    setPrice("");
    setCurrency("RUB");
    setPriority(3);
    setListId(null);
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Введите название");
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
        listId: listId || undefined,
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
            {isEdit ? "Редактировать" : "Добавить желание"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Измените данные и сохраните"
              : "Ссылка необязательна — можно добавить товар вручную. Заполните название и при желании цену, фото и теги."}
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
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          {/* List (optional) */}
          {existingLists.length > 0 && (
            <div className="space-y-2">
              <Label>Подборка</Label>
              <Select value={listId ?? "none"} onValueChange={(v) => setListId(v === "none" ? null : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Без подборки" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Без подборки</SelectItem>
                  {existingLists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <PriorityStars
              priority={priority}
              onChange={setPriority}
              size="md"
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
