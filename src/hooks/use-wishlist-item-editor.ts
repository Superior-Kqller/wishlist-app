"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { mutate } from "swr";
import type { CreateItemPayload, UpdateItemPayload } from "@/types";
import type { ItemStatus } from "@/lib/item-status";
import {
  buildImportPayload,
  createItem,
  deleteItem,
  deleteItems,
  exportItems,
  importItems,
  markItemsPurchased,
  setItemPurchased,
  setItemStatus,
  updateItem as updateItemRequest,
} from "@/lib/wishlist/item-mutations";

/** Печать «куплено» держится ровно на время анимации карточки. */
const JUST_PURCHASED_MS = 1200;

/*
 * Отказ массового удаления несёт с собой имена уцелевших.
 *
 * Диалог подтверждения показывает текст ошибки внутри себя и остаётся открытым,
 * поэтому исключение здесь — часть договора, а не аварийный выход. Но вызывающему
 * нужно ещё и оставить уцелевшие желания выбранными, а вытаскивать их из текста
 * сообщения — значит договариваться через строку.
 */
export class BulkDeleteFailure extends Error {
  constructor(
    message: string,
    readonly failedIds: string[],
  ) {
    super(message);
    this.name = "BulkDeleteFailure";
  }
}

type Translate = (value: string) => string;

interface EditorParams {
  mutateItems: () => Promise<unknown> | unknown;
  t: Translate;
}

/*
 * Правка желаний как один шов между страницей и сетью.
 *
 * Страница держала десять fetch подряд и вместе с ними — карту незавершённых
 * запросов, таймер печати и разбор частичных провалов. Здесь остаётся только то,
 * что действительно про React: состояние, тосты и перечитывание списка. Что
 * считать успехом, устареванием и провалом, решает item-mutations, и это
 * проверено тестами.
 */
export function useWishlistItemEditor({ mutateItems, t }: EditorParams) {
  const [pendingStatusByItemId, setPendingStatusByItemId] = useState<Record<string, boolean>>({});
  const [justPurchasedId, setJustPurchasedId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  /*
   * Защита от двойного нажатия живёт в ref, а не в состоянии: состояние попадало
   * в зависимости колбэка, тот пересоздавался на каждое изменение карты, и
   * проверка успевала прочитать устаревший снимок.
   */
  const inFlightIds = useRef<Set<string>>(new Set());
  const justPurchasedTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (justPurchasedTimer.current !== null) {
        window.clearTimeout(justPurchasedTimer.current);
      }
    };
  }, []);

  const handleCreateItem = useCallback(
    async (data: CreateItemPayload | UpdateItemPayload) => {
      const result = await createItem(data);
      if (result.kind !== "ok") {
        throw new Error(
          (result.kind === "error" && result.message) || t("Ошибка при создании желания"),
        );
      }
      toast.success(t("Добавлено в список!"));
      await mutateItems();
    },
    [mutateItems, t],
  );

  const updateItemById = useCallback(
    async (id: string, data: CreateItemPayload | UpdateItemPayload) => {
      const result = await updateItemRequest(id, data);
      if (result.kind !== "ok") {
        throw new Error(
          (result.kind === "error" && result.message) || t("Ошибка при обновлении желания"),
        );
      }
      toast.success(t("Сохранено!"));
      await mutateItems();
    },
    [mutateItems, t],
  );

  const confirmDeleteItem = useCallback(
    async (id: string) => {
      const result = await deleteItem(id);
      if (result.kind !== "ok") {
        throw new Error(
          (result.kind === "error" && result.message) || t("Ошибка при удалении желания"),
        );
      }
      toast.success(t("Удалено"));
      await mutateItems();
    },
    [mutateItems, t],
  );

  const handleTogglePurchased = useCallback(
    async (id: string, purchased: boolean) => {
      const result = await setItemPurchased(id, purchased);
      if (result.kind !== "ok") {
        throw new Error(
          (result.kind === "error" && result.message) || t("Ошибка при обновлении желания"),
        );
      }
      toast.success(purchased ? t("Отмечено как купленное") : t("Отметка снята"));
      await mutateItems();
    },
    [mutateItems, t],
  );

  const handleSetItemStatus = useCallback(
    async (id: string, status: ItemStatus) => {
      if (inFlightIds.current.has(id)) return;
      inFlightIds.current.add(id);
      setPendingStatusByItemId((prev) => ({ ...prev, [id]: true }));
      try {
        const result = await setItemStatus(id, status);

        if (result.kind === "stale") {
          await mutateItems();
          toast.error(t("Статус уже изменился, список обновлён"));
          return;
        }
        if (result.kind === "error") {
          throw new Error(result.message || t("Ошибка смены статуса"));
        }

        toast.success(status === "AVAILABLE" ? t("Отметка снята") : t("Отмечено купленным"));
        if (status === "PURCHASED") {
          setJustPurchasedId(id);
          if (justPurchasedTimer.current !== null) {
            window.clearTimeout(justPurchasedTimer.current);
          }
          justPurchasedTimer.current = window.setTimeout(() => {
            justPurchasedTimer.current = null;
            setJustPurchasedId((current) => (current === id ? null : current));
          }, JUST_PURCHASED_MS);
        }
        await mutateItems();
      } finally {
        inFlightIds.current.delete(id);
        setPendingStatusByItemId((prev) => ({ ...prev, [id]: false }));
      }
    },
    [mutateItems, t],
  );

  /*
   * Массовое удаление необратимо, поэтому провал не маскируется под успех:
   * уцелевшие желания остаются выбранными, чтобы попытку можно было повторить
   * ровно по ним, а не по всему исходному набору.
   */
  const handleBulkDelete = useCallback(
    async (ids: string[], titleOf: (id: string) => string | undefined) => {
      if (ids.length === 0) return;
      setBulkProcessing(true);
      try {
        const { failedIds } = await deleteItems(ids);
        await mutateItems();

        if (failedIds.length > 0) {
          const failedTitles = failedIds
            .map(titleOf)
            .filter((title): title is string => Boolean(title))
            .slice(0, 3);
          throw new BulkDeleteFailure(
            `${t("Не удалось удалить")}: ${failedIds.length} ${t("из")} ${ids.length}. ${
              failedTitles.length > 0 ? failedTitles.join(", ") : ""
            }`.trim(),
            failedIds,
          );
        }

        toast.success(`${t("Удалено желаний")}: ${ids.length}`);
      } finally {
        setBulkProcessing(false);
      }
    },
    [mutateItems, t],
  );

  const handleBulkMarkPurchased = useCallback(
    async (ids: string[]) => {
      if (ids.length === 0) return;
      setBulkProcessing(true);
      try {
        const { failedIds } = await markItemsPurchased(ids);
        const ok = ids.length - failedIds.length;
        if (failedIds.length > 0) {
          toast.error(`${t("Отмечено купленным")}: ${ok} / ${ids.length}`);
        } else {
          toast.success(`${t("Отмечено купленным")}: ${ok} / ${ids.length}`);
        }
        await mutateItems();
      } finally {
        setBulkProcessing(false);
      }
    },
    [mutateItems, t],
  );

  const handleImportFile = useCallback(
    async (file: File, targetListId: string | null) => {
      setIsImporting(true);
      try {
        const parsed = JSON.parse(await file.text()) as unknown;
        const result = await importItems(buildImportPayload(parsed, targetListId));
        if (result.kind === "error") {
          throw new Error(result.message || t("Не удалось импортировать каталог"));
        }
        toast.success(`${t("Импортировано желаний")}: ${result.imported}`);
        await mutateItems();
        await mutate("/api/users/stats");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("Не удалось импортировать каталог"));
      } finally {
        setIsImporting(false);
      }
    },
    [mutateItems, t],
  );

  const handleExport = useCallback(
    async (format: "csv" | "json") => {
      const result = await exportItems(format);
      if (result.kind === "error") {
        toast.error(t("Не удалось экспортировать желания"));
        return;
      }
      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.filename;
      anchor.click();
      URL.revokeObjectURL(url);
    },
    [t],
  );

  return useMemo(
    () => ({
      pendingStatusByItemId,
      justPurchasedId,
      isImporting,
      bulkProcessing,
      handleCreateItem,
      updateItemById,
      confirmDeleteItem,
      handleTogglePurchased,
      handleSetItemStatus,
      handleBulkDelete,
      handleBulkMarkPurchased,
      handleImportFile,
      handleExport,
    }),
    [
      pendingStatusByItemId,
      justPurchasedId,
      isImporting,
      bulkProcessing,
      handleCreateItem,
      updateItemById,
      confirmDeleteItem,
      handleTogglePurchased,
      handleSetItemStatus,
      handleBulkDelete,
      handleBulkMarkPurchased,
      handleImportFile,
      handleExport,
    ],
  );
}
