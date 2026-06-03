# Вишлист

<p align="center">
  <img src="public/assets/github/readme-banner.png" alt="Wishlist banner" width="960">
</p>

Простое приложение для личных и общих списков желаний. Можно добавлять подарки, делиться списками, бронировать позиции, отмечать покупки и при желании подключить Telegram-бота.

История изменений: [CHANGELOG.md](CHANGELOG.md).

## Возможности

- личные и общие вишлисты;
- бронирование подарков без дублей;
- статусы `доступно`, `забронировано`, `куплено`;
- добавление вручную или по ссылке на товар;
- теги, приоритеты, цены, заметки, изображения и комментарии;
- поиск, фильтры, сортировка, карточки и таблица;
- роли пользователей и админ-панель;
- экспорт в `CSV` и `JSON`;
- PWA-установка на телефон;
- опциональный Telegram-бот.

## Скриншоты

<p align="center">
  <img src="assets/app-demo.png" alt="Главный экран Вишлиста" width="920">
</p>

<p align="center">
  <img src="assets/add-smth.png" alt="Добавление подарка" width="920">
</p>

## Стек

- Next.js, React, TypeScript
- Prisma, PostgreSQL
- NextAuth
- Tailwind CSS, Radix UI
- Valkey/Redis для rate limit и кеша
- Docker Compose для self-host запуска

## Быстрый запуск через Docker

Нужны Docker и Docker Compose.

```bash
git clone https://github.com/Superior-Kqller/wishlist-app.git
cd wishlist-app
cp .env.example .env
```

В `.env` минимум нужно заменить:

```env
DB_PASSWORD=strong-postgres-password
NEXTAUTH_SECRET=long-random-secret
NEXTAUTH_URL=http://localhost:4030
APP_PORT=4030

SEED_USER1_USERNAME=user1
SEED_USER1_PASSWORD=strong-password-1
SEED_USER1_NAME=User One

SEED_USER2_USERNAME=user2
SEED_USER2_PASSWORD=strong-password-2
SEED_USER2_NAME=User Two
```

Секрет можно сгенерировать так:

```bash
openssl rand -base64 32
```

Создайте сеть для compose:

```bash
docker network create proxy
```

Запустите приложение:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Откройте:

```text
http://127.0.0.1:4030
```

Проверить контейнеры и логи:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f wishlist-app
```

## Локальная разработка

Нужны Node.js 22, npm и PostgreSQL.

```bash
npm ci
cp .env.example .env
```

Для локальной разработки обычно достаточно таких значений:

```env
DATABASE_URL=postgresql://wishlist:password@localhost:5432/wishlist
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=local-secret-placeholder-minimum-32-chars
DISABLE_PWA=1
```

Подготовить базу:

```bash
npx prisma migrate deploy
npm run db:seed
```

Запустить dev-сервер:

```bash
npm run dev
```

Открыть:

```text
http://localhost:3000
```

## Основные переменные

| Переменная | Зачем нужна |
| --- | --- |
| `DATABASE_URL` | Подключение Prisma к PostgreSQL. |
| `DB_PASSWORD` | Пароль PostgreSQL в Docker Compose. |
| `NEXTAUTH_SECRET` | Секрет для сессий NextAuth. |
| `NEXTAUTH_URL` | Публичный URL приложения. |
| `APP_PORT` | Порт приложения на хосте, по умолчанию `4030`. |
| `REDIS_URL` | Valkey/Redis; если не задан, есть in-memory fallback. |
| `TELEGRAM_BOT_TOKEN` | Токен Telegram-бота, если бот нужен. |
| `TELEGRAM_WEBHOOK_SECRET` | Секрет webhook для Telegram. |
| `SEED_USER*_...` | Начальные пользователи при первом запуске. |

Полный список смотрите в [.env.example](.env.example).

## Telegram-бот

Telegram необязателен. Без него веб-приложение работает полностью.

Краткая настройка:

1. Создайте бота через BotFather.
2. Заполните в `.env`:

```env
TELEGRAM_BOT_TOKEN=123456789:AA...
TELEGRAM_WEBHOOK_SECRET=long-random-secret
```

3. Перезапустите приложение.
4. Укажите свой Telegram ID в настройках профиля.
5. Установите webhook:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" `
  -ContentType "application/x-www-form-urlencoded" `
  -Body @{
    url = "https://your-domain.com/api/integrations/telegram/webhook"
    secret_token = "<TELEGRAM_WEBHOOK_SECRET>"
  }
```

Для Telegram нужен публичный HTTPS-домен. `localhost` не подойдет.

## Reverse proxy

В production compose приложение слушает только локальный адрес:

```text
127.0.0.1:${APP_PORT:-4030}:4030
```

Обычно перед ним ставится Nginx, Caddy или другой reverse proxy.

Пример для Caddy:

```caddyfile
wishlist.example.com {
  reverse_proxy 127.0.0.1:4030
}
```

После настройки домена обновите:

```env
NEXTAUTH_URL=https://wishlist.example.com
AUTH_TRUST_HOST=true
```

## Команды

| Команда | Что делает |
| --- | --- |
| `npm run dev` | Запускает dev-сервер. |
| `npm run build` | Собирает production-версию. |
| `npm start` | Запускает собранное приложение. |
| `npm run lint` | Запускает ESLint. |
| `npm test` | Запускает unit-тесты. |
| `npm run test:e2e` | Запускает Playwright e2e-тесты. |
| `npm run db:seed` | Создает seed-пользователей. |
| `npm run db:studio` | Открывает Prisma Studio. |

## Обновление

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Если в релизе есть миграции, контейнер применит их при старте.

## Где лежат данные

- PostgreSQL: volume `postgres-data`
- Загруженные изображения: volume `uploads-data`
- Healthcheck: `/api/health`
- Версия приложения: `/api/version`

## Лицензия

[LICENSE](LICENSE)
