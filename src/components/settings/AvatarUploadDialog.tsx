"use client";

import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/UserAvatar";
import { Loader2, Upload, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

interface AvatarUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentAvatarUrl?: string | null;
  userName: string;
  userId: string;
  onSuccess: () => void;
}

export function AvatarUploadDialog({
  open,
  onOpenChange,
  currentAvatarUrl,
  userName,
  userId,
  onSuccess,
}: AvatarUploadDialogProps) {
  const [uploadMethod, setUploadMethod] = useState<"file" | "url">("file");
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileLabel, setFileLabel] = useState<string>("");
  const [url, setUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.currentTarget.files?.[0];
    if (!selectedFile) return;

    setFileLabel(`${selectedFile.name}${selectedFile.type ? ` (${selectedFile.type})` : ""}`);

    // Валидация типа
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error(
        selectedFile.type
          ? `Недопустимый тип файла: ${selectedFile.type}. Разрешены: JPEG, PNG, WebP, GIF`
          : "Не удалось определить тип файла. Попробуйте PNG/JPEG/WebP/GIF",
      );
      return;
    }

    // Валидация размера (2MB)
    if (selectedFile.size > 2 * 1024 * 1024) {
      toast.error("Файл слишком большой. Максимум: 2MB");
      return;
    }

    setFile(selectedFile);
    // Создаем превью
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUrl(e.target.value);
  };

  const handleSubmit = async () => {
    setUploading(true);
    try {
      const selectedFile = file ?? fileInputRef.current?.files?.[0] ?? null;

      if (uploadMethod === "file" && selectedFile) {
        // Загрузка файла
        const formData = new FormData();
        formData.append("avatar", selectedFile);

        const res = await fetch("/api/users/me/avatar", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Ошибка при загрузке файла");
        }

        toast.success("Аватар загружен");
      } else if (uploadMethod === "url" && url.trim()) {
        // Валидация URL
        try {
          new URL(url);
        } catch {
          toast.error("Некорректный URL");
          setUploading(false);
          return;
        }

        // Обновление через PATCH
        const res = await fetch("/api/users/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ avatarUrl: url.trim() }),
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Ошибка при обновлении аватара");
        }

        toast.success("Аватар обновлен");
      } else {
        toast.error("Выберите файл или введите URL");
        setUploading(false);
        return;
      }

      onSuccess();
      onOpenChange(false);
      // Сброс состояния
      setFile(null);
      setFilePreview(null);
      setFileLabel("");
      setUrl("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      toast.error(err.message || "Ошибка при загрузке аватара");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    try {
      const res = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: "" }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Ошибка при удалении аватара");
      }

      toast.success("Аватар удален");
      onSuccess();
      onOpenChange(false);
      setFile(null);
      setFilePreview(null);
      setFileLabel("");
      setUrl("");
    } catch (err: any) {
      toast.error(err.message || "Ошибка при удалении аватара");
    } finally {
      setUploading(false);
    }
  };

  const previewUrl = uploadMethod === "file" && filePreview
    ? filePreview
    : uploadMethod === "url" && url.trim()
    ? url
    : currentAvatarUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Изменить аватар</DialogTitle>
          <DialogDescription>
            Загрузите изображение или укажите URL
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Превью */}
          <div className="flex justify-center">
            <UserAvatar
              avatarUrl={previewUrl || undefined}
              name={userName}
              userId={userId}
              size="xl"
            />
          </div>

          <Tabs value={uploadMethod} onValueChange={(v) => setUploadMethod(v as "file" | "url")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">
                <Upload className="w-4 h-4 mr-2" />
                Файл
              </TabsTrigger>
              <TabsTrigger value="url">
                <LinkIcon className="w-4 h-4 mr-2" />
                URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="avatar-file">Выберите файл</Label>
                <Input
                  id="avatar-file"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleFileSelect}
                  onInput={(e) => handleFileSelect(e as unknown as React.ChangeEvent<HTMLInputElement>)}
                  onClick={() => {
                    // Чтобы повторный выбор того же файла тоже триггерил change
                    if (fileInputRef.current) fileInputRef.current.value = "";
                    setFile(null);
                    setFilePreview(null);
                    setFileLabel("");
                  }}
                  ref={fileInputRef}
                  disabled={uploading}
                />
                {fileLabel && (
                  <p className="text-xs text-muted-foreground">
                    Выбран файл: {fileLabel}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Максимальный размер: 2MB. Форматы: JPEG, PNG, WebP, GIF
                </p>
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="avatar-url">URL изображения</Label>
                <Input
                  id="avatar-url"
                  type="url"
                  placeholder="https://example.com/avatar.jpg"
                  value={url}
                  onChange={handleUrlChange}
                  disabled={uploading}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex gap-2 justify-end">
            {currentAvatarUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemove}
                disabled={uploading}
              >
                Удалить
              </Button>
            )}
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={
                uploading ||
                (uploadMethod === "file" &&
                  !(file ?? fileInputRef.current?.files?.[0])) ||
                (uploadMethod === "url" && !url.trim())
              }
            >
              {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Сохранить
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
