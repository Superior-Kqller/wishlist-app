import { test as setup, expect } from "@playwright/test";

/**
 * Демонстрационные желания для локальной тестовой базы.
 *
 * Часть проверок (карточки, теги, режимы просмотра) требует хоть какого-то
 * содержимого: на пустой базе они падают не из-за интерфейса, а из-за
 * отсутствия данных. Набор создаётся один раз перед прогоном и только если
 * список пуст — на базе с настоящими данными ничего не добавляется.
 */
const items = [
  { title: "Наушники с шумоподавлением", price: 24990, priority: 1, category: "Электроника" },
  { title: "Кофеварка для дома", price: 15900, priority: 2, category: "Дом" },
  { title: "Механическая клавиатура", price: 8990, priority: 2, category: "Электроника" },
  { title: "Плед из шерсти", price: 4500, priority: 3, category: "Дом" },
  { title: "Настольная игра на компанию", price: 3200, priority: 3, category: "Игры" },
  { title: "Кроссовки для бега", price: 11900, priority: 4, category: "Спорт" },
  { title: "Книга о городском садоводстве", price: 1290, priority: 5, category: "Книги" },
];

setup("наполнить базу демо-желаниями", async ({ request }) => {
  const existing = await request.get("/api/items");
  expect(existing.ok(), `GET /api/items -> ${existing.status()}`).toBeTruthy();
  const body = (await existing.json()) as { items?: unknown[] };
  if ((body.items?.length ?? 0) > 0) return;

  for (const item of items) {
    const response = await request.post("/api/items", {
      data: { ...item, currency: "RUB", notes: "", images: [] },
    });
    expect(response.ok(), `не удалось создать «${item.title}»`).toBeTruthy();
  }
});
