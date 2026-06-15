[Русская версия](README.ru.md)

<p align="center">
  <img src="public/assets/logo/logo-mark-1.8.0-512.png" alt="Wishlist logo" width="96">
</p>

<h1 align="center">Wishlist App</h1>

A simple app for personal and shared wishlists. Add gift ideas, share lists, reserve items, mark purchases, and optionally connect a Telegram bot.

Release history: [CHANGELOG.md](CHANGELOG.md).

## Features

- personal and shared wishlists;
- gift reservations without duplicate purchases;
- `available`, `claimed`, and `purchased` statuses;
- manual item creation or product-link parsing;
- tags, priorities, prices, notes, images, and comments;
- search, filters, sorting, card view, and table view;
- user roles and admin panel;
- export to `CSV` and `JSON`;
- PWA installation on mobile;
- optional Telegram bot.

## Screenshots

<p align="center">
  <img src="assets/readme-home-desktop.png" alt="Wishlist desktop home screen" width="920">
</p>

<p align="center">
  <img src="assets/readme-home-mobile.png" alt="Wishlist mobile home screen" width="320">
</p>

## Stack

- Next.js, React, TypeScript
- Prisma, PostgreSQL
- NextAuth
- Tailwind CSS, Radix UI
- Valkey/Redis for rate limiting and cache
- Docker Compose for self-hosting

## Quick Start With Docker

You need Docker and Docker Compose.

```bash
git clone https://github.com/Superior-Kqller/wishlist-app.git
cd wishlist-app
cp .env.example .env
```

Change at least these values in `.env`:

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

Generate a secret:

```bash
openssl rand -base64 32
```

Create the compose network:

```bash
docker network create proxy
```

Start the app:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Open:

```text
http://127.0.0.1:4030
```

Check containers and logs:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f wishlist-app
```

## Local Development

You need Node.js 22, npm, and PostgreSQL.

```bash
npm ci
cp .env.example .env
```

For local development, these values are usually enough:

```env
DATABASE_URL=postgresql://wishlist:password@localhost:5432/wishlist
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=local-secret-placeholder-minimum-32-chars
DISABLE_PWA=1
```

Prepare the database:

```bash
npx prisma migrate deploy
npm run db:seed
```

Start the dev server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Main Environment Variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Prisma connection string for PostgreSQL. |
| `DB_PASSWORD` | PostgreSQL password used by Docker Compose. |
| `NEXTAUTH_SECRET` | Secret for NextAuth sessions. |
| `NEXTAUTH_URL` | Public app URL. |
| `APP_PORT` | Host port, defaults to `4030`. |
| `REDIS_URL` | Valkey/Redis connection; in-memory fallback is used when unset. |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token, only if the bot is enabled. |
| `TELEGRAM_CHAT_IDS` | Private, group, or supergroup chat IDs for basic Telegram notifications. |
| `TELEGRAM_WEBHOOK_SECRET` | Optional webhook secret for the interactive Telegram bot. |
| `SEED_USER*_...` | Initial users for the first setup. |

See the full list in [.env.example](.env.example).

## Telegram Bot

Telegram is optional. The web app works without it.

Fast notification setup:

1. Create a bot with BotFather.
2. Fill `.env`:

```env
TELEGRAM_BOT_TOKEN=123456789:AA...
TELEGRAM_CHAT_IDS=123456789,-1001234567890
```

3. Restart the app. Booking and purchase events will be sent to the configured chats.

To get a chat id, add the bot to the target chat and send `/chatid`. Group and supergroup ids are usually negative.

The interactive mode with `/start`, `/myitems`, `/available`, and inline buttons requires a public HTTPS domain and a webhook. For that mode you can also set:

```env
TELEGRAM_WEBHOOK_SECRET=long-random-secret
```

Then set the webhook:

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

You can omit `secret_token` when `TELEGRAM_WEBHOOK_SECRET` is not set. Webhooks need a public HTTPS domain; `localhost` will not work.

## Reverse Proxy

In production compose, the app listens only on the local host address:

```text
127.0.0.1:${APP_PORT:-4030}:4030
```

Usually you put Nginx, Caddy, or another reverse proxy in front of it.

Caddy example:

```caddyfile
wishlist.example.com {
  reverse_proxy 127.0.0.1:4030
}
```

After configuring the domain, update:

```env
NEXTAUTH_URL=https://wishlist.example.com
AUTH_TRUST_HOST=true
```

## Commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server. |
| `npm run build` | Build the production app. |
| `npm start` | Start the built app. |
| `npm run lint` | Run ESLint. |
| `npm test` | Run unit tests. |
| `npm run test:e2e` | Run Playwright e2e tests. |
| `npm run db:seed` | Create seed users. |
| `npm run db:studio` | Open Prisma Studio. |

## Update

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

If a release includes migrations, the container applies them on startup.

## Data

- PostgreSQL: `postgres-data` volume
- Uploaded images: `uploads-data` volume
- Healthcheck: `/api/health`
- App version: `/api/version`

## License

[LICENSE](LICENSE)
