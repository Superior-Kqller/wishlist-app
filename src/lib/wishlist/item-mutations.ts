import type { CreateItemPayload, UpdateItemPayload } from "@/types";
import type { ItemStatus } from "@/lib/item-status";

/*
 * Правка желаний: транспорт и его исходы, без React и без словаря.
 *
 * Раньше десять fetch жили прямо в компоненте страницы, и каждый решал по-своему,
 * что считать провалом: где-то ошибка бросалась, где-то глоталась, где-то ответ
 * вообще не проверялся. Здесь исход называется явно — вызывающий обязан его
 * разобрать, а не догадываться по исключению. Подписи и тосты остаются снаружи:
 * модуль ничего не знает о языке интерфейса.
 */

/** Ответ сервера на правку одного желания. */
export type ItemMutationResult =
  | { kind: "ok" }
  /** 409: состояние изменилось под руками, список нужно перечитать. */
  | { kind: "stale" }
  | { kind: "error"; message: string | null };

/** Исход массовой правки: что просили и что не получилось. */
export interface BulkMutationResult {
  requestedIds: string[];
  failedIds: string[];
}

const JSON_HEADERS = { "Content-Type": "application/json" };

async function readErrorMessage(res: Response): Promise<string | null> {
  const body: unknown = await res.json().catch(() => null);
  if (body && typeof body === "object" && "error" in body) {
    const { error } = body as { error?: unknown };
    return typeof error === "string" && error.trim() ? error : null;
  }
  return null;
}

async function toResult(res: Response): Promise<ItemMutationResult> {
  if (res.ok) return { kind: "ok" };
  if (res.status === 409) return { kind: "stale" };
  return { kind: "error", message: await readErrorMessage(res) };
}

export async function createItem(
  payload: CreateItemPayload | UpdateItemPayload,
): Promise<ItemMutationResult> {
  return toResult(
    await fetch("/api/items", {
      method: "POST",
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    }),
  );
}

export async function updateItem(
  id: string,
  payload: CreateItemPayload | UpdateItemPayload,
): Promise<ItemMutationResult> {
  return toResult(
    await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify(payload),
    }),
  );
}

export async function deleteItem(id: string): Promise<ItemMutationResult> {
  return toResult(await fetch(`/api/items/${id}`, { method: "DELETE" }));
}

export async function setItemStatus(id: string, status: ItemStatus): Promise<ItemMutationResult> {
  return updateItem(id, { status });
}

/*
 * Массовая правка идёт до конца и отчитывается поимённо.
 *
 * Оборванный запрос и ответ 4xx — один и тот же исход для человека: желание не
 * тронуто. Поэтому оба попадают в failedIds, а не теряются: вызывающий оставляет
 * уцелевшие выбранными и повторяет попытку ровно по ним.
 */
/**
 * Одновременных запросов — не больше этого числа.
 *
 * Выбор из сотни желаний уходил на сервер сотней одновременных запросов:
 * всплеск нагрузки и часть отказов 429 на ровном месте. Очередь не отменяет
 * лимит частоты — при достаточно большом выборе отказ всё равно возможен, и
 * поимённый отчёт остаётся тем же способом повторить только неудавшееся.
 */
const BULK_CONCURRENCY = 6;

async function runBulk(
  ids: string[],
  request: (id: string) => Promise<Response>,
): Promise<BulkMutationResult> {
  const results = new Array<PromiseSettledResult<Response>>(ids.length);
  let next = 0;

  async function worker(): Promise<void> {
    while (next < ids.length) {
      const index = next;
      next += 1;
      results[index] = await Promise.allSettled([request(ids[index])]).then(
        (settled) => settled[0],
      );
    }
  }

  await Promise.all(Array.from({ length: Math.min(BULK_CONCURRENCY, ids.length) }, () => worker()));

  const failedIds = ids.filter((_, index) => {
    const result = results[index];
    return result.status === "rejected" || !result.value.ok;
  });
  return { requestedIds: ids, failedIds };
}

export async function deleteItems(ids: string[]): Promise<BulkMutationResult> {
  return runBulk(ids, (id) => fetch(`/api/items/${id}`, { method: "DELETE" }));
}

export async function markItemsPurchased(ids: string[]): Promise<BulkMutationResult> {
  // Тот же переход, что и у одиночной карточки: проверка и защита от гонки общие.
  return runBulk(ids, (id) =>
    fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: JSON_HEADERS,
      body: JSON.stringify({ status: "PURCHASED" }),
    }),
  );
}

export type ImportResult =
  { kind: "ok"; imported: number } | { kind: "error"; message: string | null };

/*
 * Файл импорта приходит в двух формах: голый массив желаний или объект с полем
 * items. Подборка берётся из файла, если он её называет, иначе — та, что открыта
 * сейчас. Без этого импорт из общего вида молча ронял желания в никуда.
 */
export function buildImportPayload(parsed: unknown, targetListId: string | null): unknown {
  if (Array.isArray(parsed)) {
    return { items: parsed, listId: targetListId };
  }
  if (parsed && typeof parsed === "object") {
    const source = parsed as { listId?: unknown };
    return {
      ...source,
      listId: "listId" in source ? source.listId : targetListId,
    };
  }
  return { items: parsed, listId: targetListId };
}

export async function importItems(payload: unknown): Promise<ImportResult> {
  const res = await fetch("/api/items/import", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    return { kind: "error", message: await readErrorMessage(res) };
  }
  const body: unknown = await res.json().catch(() => null);
  const imported =
    body &&
    typeof body === "object" &&
    typeof (body as { imported?: unknown }).imported === "number"
      ? (body as { imported: number }).imported
      : 0;
  return { kind: "ok", imported };
}

export type ExportResult =
  { kind: "ok"; blob: Blob; filename: string } | { kind: "error"; message: null };

/** Имя файла называет сервер; на молчание отвечаем предсказуемым запасным именем. */
export function exportFilename(contentDisposition: string | null, format: string): string {
  return contentDisposition?.match(/filename="(.+)"/)?.[1] ?? `wishlist.${format}`;
}

export async function exportItems(format: "csv" | "json"): Promise<ExportResult> {
  const res = await fetch(`/api/items/export?format=${format}`);
  if (!res.ok) return { kind: "error", message: null };
  return {
    kind: "ok",
    blob: await res.blob(),
    filename: exportFilename(res.headers.get("Content-Disposition"), format),
  };
}
