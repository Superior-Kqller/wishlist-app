# Wishlist App

<p align="center">
  <img src="public/assets/github/readme-banner.png" alt="Вишлист — баннер" width="960">
</p>

Современное веб-приложение для управления вишлистами: личные и общие подборки, бронирование и покупка подарков, экспорт, парсинг карточек по ссылке и Telegram-бот для быстрых действий.

## Ключевые возможности

- Аутентификация с ролями `USER` и `ADMIN`.
- Управление пользователями (создание, редактирование, удаление) для админов.
- Подборки (`List`) с доступом владельца и приглашённых зрителей.
- Карточки подарков с приоритетом, тегами, ценой, ссылкой и изображением.
- Статусы подарков: `AVAILABLE` / `CLAIMED` / `PURCHASED`.
- Поиск, фильтры, сортировка, бесконечная прокрутка.
- Экспорт данных в `CSV` и `JSON`.
- Парсинг карточки товара по URL (`/api/parse`, best effort).
- PWA-режим (установка как приложение).
- Telegram-интеграция: привязка профиля, команды, действия по статусам и уведомления.

## Скриншоты

<p align="center">
  <img src="assets/app-demo.png" alt="Вишлист — главный экран" width="920">
</p>

<p align="center"><em>Главный экран: карточки, фильтры, поиск</em></p>

<p align="center">
  <img src="assets/add-smth.png" alt="Вишлист — добавление товара" width="920">
</p>

<p align="center"><em>Добавление товара (в том числе по ссылке)</em></p>

## Технологии

- Ядро: `Next.js 16` (App Router), `React 19`, `TypeScript`.
- UI: `Tailwind CSS`, `shadcn/ui`, `Framer Motion`.
- Auth: `NextAuth` (credentials flow).
- БД: `PostgreSQL 17`, `Prisma 7`.
- Rate limit: `ioredis` + in-memory fallback.
- E2E: `Playwright`.
- Unit/integration: `Vitest`.
- Production: Docker image + `docker-compose.prod.yml`.

## Структура проекта

```text
.
├── src/
│   ├── app/                         # страницы и API routes (App Router)
│   │   └── api/
│   │       ├── auth/[...nextauth]  # вход/сессия
│   │       ├── users/               # профиль, админ-операции, статистика
│   │       ├── items/               # CRUD карточек, статусы, комментарии, экспорт
│   │       ├── lists/               # CRUD подборок
│   │       ├── tags/                # агрегированные теги
│   │       ├── parse/               # парсинг карточки по URL
│   │       ├── health/              # healthcheck БД
│   │       ├── version/             # версия приложения
│   │       └── integrations/telegram/webhook
│   ├── components/                  # UI-компоненты
│   ├── lib/                         # доменная и инфраструктурная логика
│   │   └── telegram/                # Telegram service layer
│   └── types/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   ├── seed.js
│   └── promote-admin.js
├── e2e/
├── docker-compose.prod.yml
├── Dockerfile
└── docker-entrypoint.sh
```

## Требования для локальной разработки

- `Node.js 22+`
- `npm 10+`
- `PostgreSQL 17+`
- (опционально) `Valkey/Redis`, если нужен полноценный rate-limit storage

## Быстрый локальный старт

1. Клонировать репозиторий.
2. Установить зависимости.
3. Создать `.env`.
4. Поднять БД и применить схему.
5. Выполнить сидирование.
6. Запустить dev-сервер.

```bash
git clone https://github.com/Superior-Kqller/wishlist-app.git
cd wishlist-app
npm install
cp .env.example .env
# отредактируйте .env
npm run db:push
npm run db:seed
npm run dev
```

Приложение доступно по адресу `http://localhost:4030`.

## Переменные окружения

Базовый шаблон находится в `.env.example`.

| Переменная | Обязательна | Описание |
| --- | --- | --- |
| `DATABASE_URL` | Да | URL подключения Prisma к PostgreSQL |
| `DB_PASSWORD` | Да (для docker-compose) | Пароль postgres-пользователя `wishlist` |
| `NEXTAUTH_SECRET` | Да | Секрет NextAuth (рекомендуется 32+ символа) |
| `NEXTAUTH_URL` | Да | Базовый URL приложения |
| `APP_PORT` | Для docker-compose | Локальный порт публикации контейнера |
| `REDIS_URL` | Нет | Valkey/Redis endpoint или unix socket |
| `TELEGRAM_BOT_TOKEN` | Нет | Токен Telegram-бота для интеграции |
| `TELEGRAM_WEBHOOK_SECRET` | Нет | Секрет проверки webhook Telegram |
| `SEED_USER1_*`, `SEED_USER2_*` | Да для bootstrap | Параметры двух стартовых пользователей |

## Команды разработки

| Команда | Назначение |
| --- | --- |
| `npm run dev` | Локальный запуск |
| `npm run build` | Production-сборка |
| `npm run start` | Запуск собранного приложения |
| `npm run lint` | ESLint |
| `npm run test` | Unit/integration тесты (Vitest) |
| `npm run test:e2e` | E2E тесты (Playwright) |
| `npm run db:push` | Применить Prisma schema |
| `npm run db:check-migrations` | Проверка наличия SQL-миграций |
| `npm run db:seed` | Сидирование пользователей |
| `npm run db:studio` | Prisma Studio |

## Docker и production-деплой

Проект рассчитан на запуск через образ `ghcr.io/superior-kqller/wishlist-app:latest` и `docker-compose.prod.yml`.

### Что делает compose

- `wishlist-db`: PostgreSQL 17.
- `wishlist-valkey`: Valkey 8 c unix socket.
- `wishlist-app`: приложение (порт `127.0.0.1:${APP_PORT}:4030`).

### Запуск

```bash
docker network create proxy
cp .env.example .env
# отредактируйте .env
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Проверка:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f wishlist-app
```

### Что делает entrypoint

- Создаёт каталоги загрузок.
- Ждёт доступность БД.
- Выполняет `prisma migrate deploy`.
- Пытается выполнить `seed` (без падения, если данные уже есть).
- Запускает сервер от пользователя `nextjs`.

## Версии и релизы

- Версия UI/API берётся из `APP_VERSION` или `package.json` (`/api/version`).
- История изменений: `CHANGELOG.md`.
- Важно: git-тег и GitHub Release — это разные сущности.
- После публикации тега release при необходимости создаётся отдельно (`gh release create ...`).

## Модель данных (кратко)

- `User`: аккаунт, роль, профиль, Telegram-поля.
- `List`: подборка владельца.
- `ListViewer`: доступ пользователя к чужой подборке.
- `Item`: карточка подарка со статусом и связями.
- `ItemComment`: комментарии к карточке.
- `Tag`: справочник тегов.

## Статусы подарков

- `AVAILABLE`: доступен для брони.
- `CLAIMED`: забронирован.
- `PURCHASED`: куплен.

Переходы контролируются сервером и правами:
- `AVAILABLE -> CLAIMED`
- `CLAIMED -> AVAILABLE`
- `CLAIMED -> PURCHASED`

## Telegram-интеграция (MVP)

### Возможности

- Привязка Telegram к профилю на странице `/settings` через `Telegram ID`.
- Подтверждение привязки через `/start` у бота.
- Команды: `/myitems`, `/available`.
- Действия по кнопкам: `claim`, `unclaim`, `bought`.
- Уведомления владельцу/участнику при изменении статусов.

### Настройка

1. Создайте бота через BotFather.
2. Добавьте в `.env`:

```bash
TELEGRAM_BOT_TOKEN=<token>
TELEGRAM_WEBHOOK_SECRET=<secret>
```

3. Настройте webhook на endpoint:
- `POST /api/integrations/telegram/webhook`.
- Передавайте `secret_token`, равный `TELEGRAM_WEBHOOK_SECRET`.

## Bookmarklet и deep-link добавления

Можно добавить закладку в браузер для быстрого добавления текущего URL:

```text
javascript:(function(){var B='https://wishlist.yourdomain.com';var u=encodeURIComponent(location.href);window.open(B.replace(/\/$/,'')+'/?addUrl='+u+'&fill=1','_blank');})();
```

- `addUrl` передаёт ссылку.
- `fill=1` запускает парсинг автоматически.

## API обзор

| Группа | Endpoint |
| --- | --- |
| Auth | `GET|POST /api/auth/[...nextauth]` |
| Сервисные | `GET /api/health`, `GET /api/version` |
| Профиль | `GET|PATCH /api/users/me`, `POST /api/users/me/avatar` |
| Пользователи (admin) | `GET|POST /api/users`, `GET|PATCH|DELETE /api/users/[id]`, `PATCH /api/users/[id]/password` |
| Подборки | `GET|POST /api/lists`, `GET|PATCH|DELETE /api/lists/[id]` |
| Подарки | `GET|POST /api/items`, `GET|PATCH|DELETE /api/items/[id]`, `GET /api/items/export` |
| Комментарии | `GET|POST /api/items/[id]/comments`, `DELETE /api/items/[id]/comments/[commentId]` |
| Теги | `GET /api/tags` |
| Парсинг | `POST /api/parse` |
| Telegram | `POST /api/integrations/telegram/webhook` |

## Безопасность и ограничения

- Rate limit для auth/read/write/parse endpoint'ов.
- Проверка прав доступа к подборкам и карточкам на сервере.
- Приватность `CLAIMED` статусов (ограниченное раскрытие личности бронирующего).
- Валидация входных данных через `zod`.
- Для production seed запрещает небезопасные пароли (`changeme` и пустые значения).

## Диагностика

### Проверка здоровья

```bash
curl -s http://localhost:4030/api/health
```

Ожидаемо: `status: ok` и `database: connected`.

### Проверка версии

```bash
curl -s http://localhost:4030/api/version
```

### Частые проблемы

- `Unauthorized` на API: проверьте, что выполнен вход и корректно задан `NEXTAUTH_URL`.
- Не применяются миграции: проверьте `DATABASE_URL` и выполните `npm run db:check-migrations`.
- Telegram не отвечает: проверьте `TELEGRAM_BOT_TOKEN`, webhook URL и `TELEGRAM_WEBHOOK_SECRET`.
- Парсинг карточки не извлекает данные: endpoint работает в режиме best effort, часть сайтов защищена от ботов.

## Тестирование

Быстрый цикл:

```bash
npm run lint
npm run test
```

E2E:

```bash
npm run test:e2e
```

## Лицензия

MIT

## Автор

Superior-Kqller
