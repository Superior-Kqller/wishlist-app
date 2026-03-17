# Ozon API Parser — дизайн

**Дата:** 2026-03-17
**Проблема:** Ozon агрессивно редиректит fetch-запросы, вызывая ошибку "redirect count exceeded"

## Решение

Вместо scraping HTML используем внутренний API Ozon (аналогично WB).

### API Endpoint

```
GET https://api.ozon.ru/composer-api.bx/page/json/v2?url=/product/<product-path>/
```

### Заголовки

```
User-Agent: ozonapp_android/17.40.1+14901
Accept: application/json
x-o3-app-name: ozonapp_android
x-o3-app-version: 17.40.1
```

### Формат ответа

```json
{
  "widgetStates": {
    "webProductHeading-*": "{ title }",
    "webPrice-*": "{ price, cardPrice, originalPrice }",
    "webGallery-*": "{ coverImage, images[] }"
  }
}
```

### Алгоритм

1. Извлечь product path из URL (`/product/<slug-id>/`)
2. Для коротких ссылок (`/t/...`) — один redirect:manual запрос для получения реального URL
3. Запросить API
4. Распарсить widgetStates (поиск по префиксу ключа)
5. При ошибке API — fallback на HTML-парсинг

### Обработка цены

Приоритет: `cardPrice` > `price` > `originalPrice`. Цена приходит как строка "2 499 ₽" — очищается от нецифровых символов.

### Изменения

- `src/lib/parser.ts` — новая `parseOzon()` с API + HTML fallback
- `src/lib/parser.test.ts` — тесты для API и fallback сценариев
