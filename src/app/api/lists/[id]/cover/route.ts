import { NextRequest, NextResponse } from "next/server";
import { getSessionUserIdVerified } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { sanitizeError } from "@/lib/logger";
import { mkdir, unlink, writeFile } from "fs/promises";
import { join } from "path";
import sharp from "sharp";
import { unauthorizedResponse } from "@/lib/api-responses";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const uploadDir = join(process.cwd(), "public", "uploads", "lists");

async function ownedList(id: string, userId: string) {
  const list = await prisma.list.findUnique({ where: { id }, select: { userId: true } });
  return list?.userId === userId;
}

// POST /api/lists/[id]/cover — своя обложка подборки (только владелец)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.default);
  if (rateLimitResponse) return rateLimitResponse;

  const userId = await getSessionUserIdVerified();
  if (!userId) return unauthorizedResponse();

  const { id } = await params;
  if (!(await ownedList(id, userId))) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  try {
    const file = (await req.formData()).get("cover") as File | null;
    if (!file) return NextResponse.json({ error: "Файл не выбран" }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Недопустимый тип файла. Разрешены: JPEG, PNG, WebP, GIF" },
        { status: 400 },
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Файл слишком большой. Максимум: 5 МБ" }, { status: 400 });
    }

    // id — cuid из БД, а не пользовательский ввод: выйти из каталога имя файла не может.
    await mkdir(uploadDir, { recursive: true });
    const buffer = await sharp(Buffer.from(await file.arrayBuffer()))
      .resize(800, 800, { fit: "cover" })
      .webp({ quality: 85 })
      .toBuffer();
    await writeFile(join(uploadDir, `${id}.webp`), buffer);

    // Имя файла стабильно, поэтому `?v=` сбрасывает кэш браузера.
    const coverUrl = `/uploads/lists/${id}.webp?v=${Date.now()}`;
    await prisma.list.update({ where: { id }, data: { coverUrl } });
    return NextResponse.json({ coverUrl });
  } catch (err) {
    sanitizeError("Upload list cover error", err, { listId: id });
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}

// DELETE /api/lists/[id]/cover — убрать обложку
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.default);
  if (rateLimitResponse) return rateLimitResponse;

  const userId = await getSessionUserIdVerified();
  if (!userId) return unauthorizedResponse();

  const { id } = await params;
  if (!(await ownedList(id, userId))) {
    return NextResponse.json({ error: "Не найдено" }, { status: 404 });
  }

  try {
    await prisma.list.update({ where: { id }, data: { coverUrl: null } });
    await unlink(join(uploadDir, `${id}.webp`)).catch(() => {});
    return NextResponse.json({ success: true });
  } catch (err) {
    sanitizeError("Delete list cover error", err, { listId: id });
    return NextResponse.json({ error: "Внутренняя ошибка сервера" }, { status: 500 });
  }
}
