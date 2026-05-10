# Wishlist App

<p align="center">
  <img src="public/assets/github/readme-banner.png" alt="Wishlist banner" width="960">
</p>

A simple, polished app for personal, family, and shared wishlists. Add wishes, share lists, reserve gifts without awkward duplicates, and optionally use the Telegram bot for quick actions.

Latest release notes and full history: [CHANGELOG.md](CHANGELOG.md).

## Contents

- [Features](#-features)
- [Screenshots](#-screenshots)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [First Login](#-first-login)
- [Telegram Bot](#-telegram-bot)
- [Reverse Proxy](#-reverse-proxy)
- [Install On Phone](#-install-on-phone)
- [Architecture](#-architecture)
- [FAQ](#-faq)
- [Self-Host Notes](#-self-host-notes)

## Features

- Create personal and shared wishlists
- Share access with family and friends
- Reserve gifts and mark them as purchased
- Add items manually or from a product link
- Use tags, priorities, prices, notes, and images
- Search, filter, sort, and switch between card/table views
- Optional Telegram bot for quick actions and notifications
- PWA support for phone installation
- Export data as `CSV` and `JSON`
- Russian and English web UI with an in-app language switcher

## Screenshots

<p align="center">
  <img src="assets/app-demo.png" alt="Wishlist main screen" width="920">
</p>

<p align="center"><em>Main screen with cards, search, filters, and quick actions</em></p>

<p align="center">
  <img src="assets/add-smth.png" alt="Wishlist item creation" width="920">
</p>

<p align="center"><em>Add a gift manually or from a product link</em></p>

## Quick Start

The recommended self-hosted setup uses Docker Compose.

### 1. Requirements

- Docker
- Docker Compose
- Terminal access on your server or local machine

### 2. Clone The Project

```bash
git clone https://github.com/Superior-Kqller/wishlist-app.git
cd wishlist-app
```

### 3. Prepare `.env`

```bash
cp .env.example .env
```

Minimum values to fill:

- `DB_PASSWORD` — PostgreSQL password
- `NEXTAUTH_SECRET` — application secret
- `NEXTAUTH_URL` — public URL where the app will be opened
- `SEED_USER1_*` and `SEED_USER2_*` — initial users

Example:

```env
DB_PASSWORD=super-strong-password
NEXTAUTH_SECRET=generate-with-openssl-rand-base64-32
NEXTAUTH_URL=https://wishlist.example.com
APP_PORT=4030

SEED_USER1_USERNAME=user1
SEED_USER1_PASSWORD=strong-password-1
SEED_USER1_NAME=User One

SEED_USER2_USERNAME=user2
SEED_USER2_PASSWORD=strong-password-2
SEED_USER2_NAME=User Two
```

### 4. Create The Reverse Proxy Network

```bash
docker network create proxy
```

If the network already exists, Docker will report that and you can continue.

### 5. Start The App

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

By default the app is published on `127.0.0.1:${APP_PORT}`. With `APP_PORT=4030`, open:

```text
http://127.0.0.1:4030
```

### 6. Check The Containers

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f wishlist-app
```

## Environment Variables

The main template is [.env.example](.env.example). For Docker Compose, copy it to `.env` and replace values for your domain, database, and seed users.

| Variable | Required | Description |
| --- | --- | --- |
| `DB_PASSWORD` | Yes | Password for PostgreSQL user `wishlist` inside Docker Compose. |
| `DATABASE_URL` | Yes | Prisma PostgreSQL connection string. Production compose overrides it to the internal `wishlist-db` address. |
| `NEXTAUTH_SECRET` | Yes | NextAuth secret for signing sessions. Use a long random string. |
| `NEXTAUTH_URL` | Yes | Public app URL, for example `https://wishlist.example.com`. For local checks use `http://localhost:4030`. |
| `AUTH_TRUST_HOST` | No | Enable behind a reverse proxy if the host comes through proxy headers. |
| `TELEGRAM_BOT_TOKEN` | No | Telegram bot token from BotFather. Required only for Telegram integration. |
| `TELEGRAM_WEBHOOK_SECRET` | No | Secret passed by Telegram in `x-telegram-bot-api-secret-token`. |
| `REDIS_URL` | No | Valkey/Redis connection for rate limiting. Compose uses `/run/valkey/valkey.sock`; without Valkey the app falls back to memory. |
| `APP_PORT` | No | Local published app port. Defaults to `4030`. |
| `SEED_USER1_*`, `SEED_USER2_*` | First run | Initial users created by the seed script during setup. |

## First Login

1. Sign in with one of the seed users from `.env`.
2. Create your first wishlist.
3. Add a few items manually or by product link.
4. Share access with close people.
5. Optionally connect the Telegram bot.
6. Install the site on your phone if you want quick access.

## Telegram Bot

Telegram is optional. It provides quick actions and notifications.

Available capabilities:

- view your gifts
- view available gifts
- change item status through bot buttons
- receive reservation and purchase notifications

Setup:

1. Create a bot with BotFather.
2. Get your Telegram account ID.
3. Add these values to `.env`:

```env
TELEGRAM_BOT_TOKEN=123456789:AA...
TELEGRAM_WEBHOOK_SECRET=your-secret
```

`TELEGRAM_WEBHOOK_SECRET` can be any long random string. In PowerShell:

```powershell
[guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
```

4. Restart the app after editing `.env`.
5. Enter your `Telegram ID` in account settings.
6. Set the webhook to your public domain:

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

Webhook URL:

```text
https://your-domain.com/api/integrations/telegram/webhook
```

7. Verify the webhook:

```powershell
Invoke-RestMethod `
  -Uri "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

If configured correctly, the response `url` field will not be empty.

8. Open the bot and send `/start` to confirm linking.

Telegram must pass a `secret_token` equal to `TELEGRAM_WEBHOOK_SECRET`. If `url` is empty, the bot cannot deliver `/start` or button actions to the app.

### Reinstalling The Webhook

Delete the old webhook first:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/deleteWebhook"
```

Then run `setWebhook` again.

Important:

- The site must be reachable from the internet; `localhost` will not work for Telegram.
- If the bot token leaks, rotate it in BotFather.
- Without a webhook, `/start`, inline buttons, and incoming bot actions will not reach the app.

## Reverse Proxy

Production compose publishes the app only on loopback:

```text
127.0.0.1:${APP_PORT:-4030}:4030
```

Usually a reverse proxy on the same server terminates HTTPS and forwards traffic to `http://127.0.0.1:4030`.

Minimal Nginx example:

```nginx
server {
  listen 443 ssl;
  server_name wishlist.example.com;

  location / {
    proxy_pass http://127.0.0.1:4030;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

Caddy example:

```caddyfile
wishlist.example.com {
  reverse_proxy 127.0.0.1:4030
}
```

After configuring the proxy, set the external address in `NEXTAUTH_URL`. If auth behaves unexpectedly behind a proxy, check proxy headers and enable `AUTH_TRUST_HOST=true` if needed.

## Install On Phone

Wishlist supports PWA installation:

- iPhone/iPad: open the site in Safari and choose `Add to Home Screen`
- Android: open the site in Chrome and choose `Install app`

## Architecture

The app uses Next.js App Router. Pages and API routes live in `src/app`, reusable UI components in `src/components`, and shared business logic in `src/lib`.

Main system parts:

- **Next.js + React** — UI, API routes, PWA manifest, production build.
- **NextAuth** — authentication, `USER` and `ADMIN` roles, app sessions.
- **Prisma + PostgreSQL** — users, lists, wishes, tags, comments, and Telegram links.
- **Valkey/Redis** — rate limiting and cache with in-memory fallback.
- **Telegram webhook** — `/start`, inline actions, reservations, and notifications.
- **Uploads** — uploaded images are stored in `public/uploads`; Docker Compose maps this to `uploads-data`.

Request path:

```text
Browser or Telegram -> Next.js route/API -> auth/access policy -> Prisma -> PostgreSQL
```

User pages load data through API routes and SWR; filters sync with the URL.

## FAQ

### Where is data stored?

Main data is stored in the Docker volume `postgres-data`. Uploaded images are stored in `uploads-data`.

### How do I check app health?

Open:

- `/api/health` — app and database health
- `/api/version` — current app version

### How do I update the app?

Usually:

```bash
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

If a release includes migrations, the container applies them at startup.

### Telegram does not respond. What should I check?

- `TELEGRAM_BOT_TOKEN` is set
- `TELEGRAM_WEBHOOK_SECRET` is set
- webhook is installed to the correct URL
- `secret_token` matches
- user confirmed linking with `/start`

### Can I use the app without Telegram?

Yes. Telegram integration is fully optional.

## Self-Host Notes

- Main deployment path: `docker-compose.prod.yml`
- Database: `PostgreSQL 17`
- Cache / rate limit: `Valkey` with in-memory fallback
- App version endpoint: `/api/version`
- Changelog: [CHANGELOG.md](CHANGELOG.md)
- Docker image: `ghcr.io/superior-kqller/wishlist-app:latest`

## License

[LICENSE](LICENSE)
