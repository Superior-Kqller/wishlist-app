"use client";

import { useState } from "react";
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
import { Loader2, Link, Sparkles } from "lucide-react";
import { ParsedProductResponse } from "@/types";
import { toast } from "sonner";

interface ParseUrlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onParsed: (data: ParsedProductResponse) => void;
}

export function ParseUrlDialog({
  open,
  onOpenChange,
  onParsed,
}: ParseUrlDialogProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleParse(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Не удалось распарсить страницу");
      }

      const data: ParsedProductResponse = await res.json();
      toast.success("Данные получены!");
      onParsed(data);
      onOpenChange(false);
      setUrl("");
    } catch (err: any) {
      toast.error(err.message || "Ошибка при парсинге URL");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Добавить из ссылки
          </DialogTitle>
          <DialogDescription>
            Вставьте ссылку на товар с Wildberries, Ozon, AliExpress или другого
            сайта. Мы автоматически получим название, цену и изображения.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleParse} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="parse-url">Ссылка на товар</Label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="parse-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.wildberries.ru/catalog/..."
                className="pl-10"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-1 bg-muted rounded-md">Wildberries</span>
            <span className="px-2 py-1 bg-muted rounded-md">Ozon</span>
            <span className="px-2 py-1 bg-muted rounded-md">AliExpress</span>
            <span className="px-2 py-1 bg-muted rounded-md">Любой сайт</span>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Отмена
            </Button>
            <Button type="submit" disabled={loading || !url.trim()}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Парсинг...
                </>
              ) : (
                "Получить данные"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
