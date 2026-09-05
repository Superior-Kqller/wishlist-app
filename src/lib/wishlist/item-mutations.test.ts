import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildImportPayload,
  deleteItems,
  exportFilename,
  importItems,
  markItemsPurchased,
  setItemStatus,
  updateItem,
} from "./item-mutations";

function respond(init: { status?: number; body?: unknown } = {}): Response {
  const status = init.status ?? 200;
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => init.body ?? {},
  } as Response;
}

function stubFetch(handler: (url: string, init?: RequestInit) => Promise<Response> | Response) {
  // Настоящий fetch на сетевом сбое возвращает отклонённый промис, а не бросает
  // синхронно, — двойник обязан вести себя так же, иначе тест проверяет не то.
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => handler(url, init));
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("правка одного желания", () => {
  it("отделяет успех от отказа и достаёт причину с сервера", async () => {
    stubFetch(() => respond({ status: 400, body: { error: "Слишком длинное название" } }));
    await expect(updateItem("item-1", { title: "x" })).resolves.toEqual({
      kind: "error",
      message: "Слишком длинное название",
    });
  });

  it("молчание сервера не выдаёт за причину", async () => {
    stubFetch(() => respond({ status: 500, body: "не json" }));
    await expect(updateItem("item-1", { title: "x" })).resolves.toEqual({
      kind: "error",
      message: null,
    });
  });

  /*
   * 409 — не ошибка, а устаревшее представление: кто-то отметил желание раньше.
   * Отдельный исход нужен, чтобы список перечитали, а человеку не показали
   * красный текст про сбой там, где сбоя не было.
   */
  it("называет 409 устаревшим состоянием, а не ошибкой", async () => {
    stubFetch(() => respond({ status: 409 }));
    await expect(setItemStatus("item-1", "PURCHASED")).resolves.toEqual({ kind: "stale" });
  });

  it("отправляет статус патчем по адресу желания", async () => {
    const fetchMock = stubFetch(() => respond());
    await setItemStatus("item-7", "AVAILABLE");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/items/item-7",
      expect.objectContaining({ method: "PATCH", body: JSON.stringify({ status: "AVAILABLE" }) }),
    );
  });
});

describe("массовая правка", () => {
  it("возвращает поимённо то, что не удалось удалить", async () => {
    stubFetch((url) => (url.endsWith("b") ? respond({ status: 403 }) : respond()));
    await expect(deleteItems(["a", "b", "c"])).resolves.toEqual({
      requestedIds: ["a", "b", "c"],
      failedIds: ["b"],
    });
  });

  /*
   * Оборванный запрос раньше терялся между Promise.allSettled и подсчётом
   * успехов: человек видел «отмечено 2 из 3» без единого слова о третьем.
   */
  it("считает провалом и оборванный запрос, не только отказ сервера", async () => {
    stubFetch((url) => {
      if (url.endsWith("b")) throw new Error("сеть отвалилась");
      return respond();
    });
    await expect(markItemsPurchased(["a", "b"])).resolves.toEqual({
      requestedIds: ["a", "b"],
      failedIds: ["b"],
    });
  });

  it("не отправляет весь выбор разом", async () => {
    let inFlight = 0;
    let peak = 0;
    const release: Array<() => void> = [];
    stubFetch(
      () =>
        new Promise((resolve) => {
          inFlight += 1;
          peak = Math.max(peak, inFlight);
          release.push(() => {
            inFlight -= 1;
            resolve(new Response(null, { status: 200 }));
          });
        }),
    );

    const ids = Array.from({ length: 25 }, (_, index) => `item-${index}`);
    const pending = deleteItems(ids);
    // Отпускаем запросы по мере их появления: очередь должна дойти до конца.
    for (let done = 0; done < ids.length; done += 1) {
      while (release.length === 0) await Promise.resolve();
      release.shift()!();
      await Promise.resolve();
    }

    await expect(pending).resolves.toEqual({ requestedIds: ids, failedIds: [] });
    expect(peak).toBeLessThanOrEqual(6);
    expect(peak).toBeGreaterThan(1);
  });

  it("на пустом наборе не ходит в сеть", async () => {
    const fetchMock = stubFetch(() => respond());
    await expect(deleteItems([])).resolves.toEqual({ requestedIds: [], failedIds: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("импорт каталога", () => {
  it("оборачивает голый массив и подставляет открытую подборку", () => {
    expect(buildImportPayload([{ title: "Кофеварка" }], "list-1")).toEqual({
      items: [{ title: "Кофеварка" }],
      listId: "list-1",
    });
  });

  it("уважает подборку, названную в самом файле", () => {
    expect(buildImportPayload({ items: [], listId: "from-file" }, "list-1")).toEqual({
      items: [],
      listId: "from-file",
    });
  });

  it("сохраняет явный null из файла, а не подменяет его текущей подборкой", () => {
    expect(buildImportPayload({ items: [], listId: null }, "list-1")).toEqual({
      items: [],
      listId: null,
    });
  });

  it("сообщает число ввезённых желаний", async () => {
    stubFetch(() => respond({ body: { imported: 12 } }));
    await expect(importItems({ items: [] })).resolves.toEqual({ kind: "ok", imported: 12 });
  });

  it("не выдаёт отказ за пустой импорт", async () => {
    stubFetch(() => respond({ status: 422, body: { error: "Неверный формат" } }));
    await expect(importItems({ items: [] })).resolves.toEqual({
      kind: "error",
      message: "Неверный формат",
    });
  });
});

describe("экспорт каталога", () => {
  it("берёт имя файла из заголовка", () => {
    expect(exportFilename('attachment; filename="wishlist-2026.csv"', "csv")).toBe(
      "wishlist-2026.csv",
    );
  });

  it("на молчание отвечает предсказуемым именем", () => {
    expect(exportFilename(null, "json")).toBe("wishlist.json");
  });
});
