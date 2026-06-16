<p align="center">
  <img src="public/assets/logo/logo-mark-1.8.0-512.png" alt="Логотип Вишлиста" width="96">
</p>

<h1 align="center">Вишлист</h1>

Self-hosted приложение для личных и общих списков желаний. Добавляйте идеи подарков с фото и ценами, делитесь списками, бронируйте позиции, отмечайте покупки и держите планирование подарков в одном месте.

<p align="center">
  <img src="assets/readme-home-desktop.png" alt="Каталог Вишлиста на desktop с демо-данными" width="920">
</p>

<p align="center">
  <img src="assets/readme-home-mobile.png" alt="Каталог Вишлиста на телефоне с демо-данными" width="320">
</p>

## Возможности

- личные и общие вишлисты;
- бронирование подарков без дублей;
- статусы: доступно, забронировано, куплено;
- фото товаров, ссылки, заметки, теги, приоритеты и цены;
- поиск, фильтры, сортировка, карточки и таблица;
- роли пользователей, админ-панель, экспорт в CSV/JSON и PWA для телефона;
- опциональные Telegram-уведомления и команды бота.

## Стек

Next.js, React, TypeScript, Prisma, PostgreSQL, NextAuth, Tailwind CSS, Radix UI, Valkey/Redis, Docker Compose.

## Быстрый запуск

Нужны Docker и Docker Compose.

```bash
git clone https://github.com/Superior-Kqller/wishlist-app.git
cd wishlist-app
cp .env.example .env
```

Заполните `.env`: задайте сильные пароли, `NEXTAUTH_SECRET` и `NEXTAUTH_URL`. Все обязательные и опциональные переменные описаны в [.env.example](.env.example); необязательные настройки там закомментированы.

```bash
openssl rand -base64 32
docker network create proxy
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Откройте `http://127.0.0.1:4030`.

## Локальная разработка

Нужны Node.js 22, npm и PostgreSQL.

```bash
npm ci
cp .env.example .env
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Для локального запуска укажите в `.env` локальный `DATABASE_URL`, `NEXTAUTH_URL=http://localhost:3000` и `DISABLE_PWA=1`.

## Настройка

Источник правды по переменным окружения — [.env.example](.env.example). Там же описаны:

- обязательные значения для Docker-запуска;
- локальная разработка;
- Telegram-бот и webhook;
- reverse proxy;
- Redis/Valkey;
- seed-пользователи.

Минимум для production:

- `DB_PASSWORD`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `APP_PORT`
- `SEED_USER1_*` и `SEED_USER2_*`

## Эксплуатация

Полезные команды:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f wishlist-app
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Healthcheck доступен на `/api/health`, версия приложения — на `/api/version`. База, загруженные изображения и socket Valkey хранятся в Docker volumes.

## Команды разработки

| Команда | Что делает |
| --- | --- |
| `npm run dev` | Запускает dev-сервер. |
| `npm run build` | Собирает production-версию. |
| `npm start` | Запускает собранное приложение. |
| `npm run lint` | Запускает ESLint. |
| `npm test` | Запускает unit-тесты. |
| `npm run test:e2e` | Запускает Playwright e2e-тесты. |
| `npm run db:seed` | Создает начальных пользователей. |
| `npm run db:studio` | Открывает Prisma Studio. |

История изменений: [CHANGELOG.md](CHANGELOG.md).

## Лицензия

[LICENSE](LICENSE)
