import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];

// POST /api/users/me/avatar — загрузка файла аватара
export async function POST(req: NextRequest) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.default);
  if (rateLimitResponse) return rateLimitResponse;

  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "Файл не выбран" },
        { status: 400 }
      );
    }

    // Валидация типа файла
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Недопустимый тип файла. Разрешены: JPEG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Валидация размера файла
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Файл слишком большой. Максимум: 2 МБ" },
        { status: 400 }
      );
    }

    // Определяем расширение файла на основе MIME типа (безопаснее чем имя файла)
    const mimeToExt: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
      "image/gif": "gif",
    };
    const extension = mimeToExt[file.type] || "jpg";
    const filename = `${userId}.${extension}`;
    const uploadDir = join(process.cwd(), "public", "uploads", "avatars");
    const filepath = join(uploadDir, filename);
    
    // Защита от path traversal: убеждаемся что путь находится в нужной директории
    if (!filepath.startsWith(uploadDir)) {
      return NextResponse.json(
        { error: "Недопустимый путь к файлу" },
        { status: 400 }
      );
    }

    // Создаем директорию если её нет
    // Используем try-catch для обработки ошибок прав доступа
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (mkdirError: any) {
      // Если директория уже существует, это нормально
      if (mkdirError.code !== "EEXIST") {
        sanitizeError("Failed to create upload directory", mkdirError, { uploadDir });
        return NextResponse.json(
          { error: "Не удалось создать папку для загрузок. Проверьте права на сервере." },
          { status: 500 }
        );
      }
    }

    // Конвертируем File в Buffer и сохраняем
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    // Обновляем avatarUrl в БД
    const avatarUrl = `/uploads/avatars/${filename}`;
    await prisma.user.update({
      where: { id: userId },
      data: { 
        avatarUrl: avatarUrl,
      },
    });

    return NextResponse.json({ avatarUrl });
  } catch (err) {
    sanitizeError("Upload avatar error", err, { userId });
    return NextResponse.json(
      { error: "Внутренняя ошибка сервера" },
      { status: 500 }
    );
  }
}
