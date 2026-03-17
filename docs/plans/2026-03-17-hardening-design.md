# Wishlist App — Закаливание: баги, безопасность, качество, тесты

**Дата:** 2026-03-17
**Статус:** Утверждён

## Обзор

Полное закаливание проекта Wishlist App перед дальнейшей разработкой фич.
Четыре фазы: критические баги → качество кода → безопасность/инфраструктура → тесты.

## Что НЕ входит

- Починка URL-парсера (парсер не работает, отложен)
- SSRF-уязвимость в парсере (следствие вышеуказанного)
- Новые фичи (шеринг, резервирование, пагинация UI)
- PWA, i18n, browser extension

---

## Фаза 1: Критические баги

### 1.1. Middleware не работает

**Проблема:** `src/proxy.ts` не подхватывается Next.js — файл должен называться `middleware.ts`.
Защита маршрутов и проверка роли ADMIN не выполняются.

**Решение:** Переименовать `src/proxy.ts` → `src/middleware.ts`. Код внутри валидный.

**Файлы:**
- `src/proxy.ts` → `src/middleware.ts`

### 1.2. Prisma db push в production

**Проблема:** `docker-entrypoint.sh` использует `prisma db push` при каждом старте.
Может удалить данные при изменении схемы, нет миграционной истории.

**Решение:**
- Создать baseline-миграцию из текущей схемы
- Заменить `prisma db push` на `prisma migrate deploy` в entrypoint
- Добавить `prisma/migrations/` в репозиторий

**Файлы:**
- `docker-entrypoint.sh`
- `prisma/migrations/` (новая папка)

---

## Фаза 2: Качество кода

### 2.1. Расширение типов NextAuth

**Проблема:** `(session?.user as any).id` разбросано по ~15-20 местам.

**Решение:** Создать `src/types/next-auth.d.ts`:
```typescript
import { DefaultSession, DefaultJWT } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: "USER" | "ADMIN";
    } & DefaultSession["user"];
  }
  interface User {
    role: "USER" | "ADMIN";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    username: string;
    role: "USER" | "ADMIN";
  }
}
```

Убрать все `as any` в auth-связанном коде.

**Файлы:**
- `src/types/next-auth.d.ts` (новый)
- `src/lib/auth.ts`
- `src/app/page.tsx`
- Все API routes с `session.user`
- `src/components/Header.tsx`

### 2.2. Дедупликация fetcher

**Проблема:** Один и тот же `fetcher` в 3+ файлах.

**Решение:** Вынести в `src/lib/fetcher.ts`, импортировать.

**Файлы:**
- `src/lib/fetcher.ts` (новый)
- `src/app/page.tsx`, `settings/page.tsx`, `stats/page.tsx`

### 2.3. ConfirmDialog вместо window.confirm

**Проблема:** `window.confirm` для удаления — блокирует UI, не кастомизируется.

**Решение:** Создать `ConfirmDialog` на базе shadcn `AlertDialog`.

**Файлы:**
- `src/components/ConfirmDialog.tsx` (новый)
- `src/app/page.tsx` (handleDeleteItem)
- `src/components/admin/DeleteUserDialog.tsx`

### 2.4. Header в layout

**Проблема:** `Header` дублируется в каждой странице с разными пропсами.

**Решение:** Перенести в `layout.tsx`. Для навигационных действий использовать router.

**Файлы:**
- `src/app/layout.tsx`
- `src/app/page.tsx`, `settings/page.tsx`, `stats/page.tsx`, `admin/page.tsx`

---

## Фаза 3: Безопасность и инфраструктура

### 3.1. Redis для Rate Limiting

**Текущее:** In-memory `Map` — сбрасывается при рестарте.

**Решение:**
- Добавить `redis:7-alpine` в `docker-compose.prod.yml`
- Установить `ioredis`
- Переписать `rate-limit.ts` с `INCR` + `EXPIRE` в Redis
- Graceful fallback на in-memory для dev без Docker
- Добавить `REDIS_URL` в `.env.example`

**Файлы:**
- `docker-compose.prod.yml`
- `src/lib/rate-limit.ts`
- `.env.example`
- `package.json`

### 3.2. Ограничение images.remotePatterns

**Текущее:** Разрешены все HTTP и HTTPS хосты.

**Решение:** Убрать `http: **`, оставить только `https: **`.
При необходимости — добавить whitelist конкретных CDN.

**Файлы:**
- `next.config.mjs`

### 3.3. CSP nonce для production

**Текущее:** `unsafe-eval` + `unsafe-inline` в script-src.

**Решение:**
- Использовать nonce-based CSP для скриптов в production
- Next.js 16 поддерживает `nonce` через middleware
- Оставить `unsafe-eval` только для `NODE_ENV=development`

**Файлы:**
- `next.config.mjs`
- `src/middleware.ts`

### 3.4. Prisma Migrations

Описано в Фазе 1 (п. 1.2).

---

## Фаза 4: Тестирование

### 4.1. Unit-тесты (Vitest)

**Покрытие:**
- `src/lib/rate-limit.ts` — лимиты, очистка, Redis/fallback
- `src/lib/password-validation.ts` — валидация паролей
- `src/lib/utils.ts` — formatPrice, getTagColor, priorityBorderClass
- API routes — через mock Prisma, проверка авторизации, валидации

**Файлы:**
- `vitest.config.ts` (новый)
- `src/__tests__/` (новая папка)
- `package.json` (скрипт `test`)

### 4.2. E2E-тесты (Playwright)

**Сценарии:**
- Логин / неверный пароль
- Создание элемента / редактирование / удаление
- Фильтрация и поиск
- Админ-панель (создание пользователя)
- Смена пароля

**Файлы:**
- `playwright.config.ts` (новый)
- `e2e/` (новая папка)
- `package.json` (скрипт `test:e2e`)

---

## Порядок реализации

1. Фаза 1 — middleware + migrations (блокеры безопасности)
2. Фаза 2 — типизация, дедупликация, ConfirmDialog, Header
3. Фаза 3 — Redis, images, CSP
4. Фаза 4 — Vitest, затем Playwright
