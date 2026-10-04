<p align="right">
  <a href="./README.ru.md">Русская версия</a>
</p>

<p align="center">
  <img src="./assets/readme/hero.png" width="100%" alt="Wishlist — self-hosted gift planning: shared lists with chosen viewers, prices, priorities, and reminders">
</p>

Wishlist is a self-hosted web app for families, friends, and small teams. It keeps wish ideas, preferences, important dates, and gift coordination in one place—without turning the group chat into a planning database.

<p align="center">
  <img src="./assets/readme-home-desktop.png" width="100%" alt="Wishlist home page in the dark theme: people and list filters, the next occasion, search, and wish cards with photos, priority labels, owners, categories, and prices">
</p>

## One place for the whole gift loop

- **Collect ideas** — add wishes with product links, photos, prices, notes, categories, and five-step priorities.
- **Share list by list** — group wishes into lists with their own cover; every list stays yours until you name who else may see it, so each person opens only the lists meant for them.
- **Plan around people** — gift profiles keep favorite colors, sizes, and hints; birthdays, personal dates, shared holidays, and automatic reminders show what matters and when.
- **Stay in sync** — mark wishes as purchased, comment on them, follow totals and recent activity in Statistics, export to CSV or JSON, and optionally receive Telegram notifications.

The interface supports card and list views, search, filters, sorting, roles, an admin area, English and Russian, system, light, and dark themes, and installation as a mobile PWA.

## Run it your way

| Mode | Best for | Database |
| --- | --- | --- |
| **Docker Compose** | A regular long-running installation | PostgreSQL in its own container |
| **Single container** | A compact personal or home deployment | Embedded PGlite volume |
| **Development** | Local feature work and testing | Local PostgreSQL |

Valkey/Redis is optional. Without it, rate limiting falls back to the application process memory.

## Quick start

Requirements: Docker and Docker Compose.

```bash
git clone https://github.com/Superior-Kqller/wishlist-app.git
cd wishlist-app
cp .env.example .env
openssl rand -base64 32
```

Set strong values for `DB_PASSWORD`, `NEXTAUTH_SECRET`, and `NEXTAUTH_URL` in `.env`, then start the PostgreSQL deployment:

```bash
docker network create proxy
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Open `http://127.0.0.1:4030`.

For a single-container PGlite installation:

```bash
docker compose -f docker-compose.pglite.yml pull
docker compose -f docker-compose.pglite.yml up -d
```

PGlite does not need `DB_PASSWORD`; its files live in the `pglite-data` Docker volume.

All required and optional settings—including Telegram, reverse proxy, seed users, and Valkey—are documented in [`.env.example`](./.env.example).

<details>
<summary><strong>Add shared Valkey/Redis rate limiting</strong></summary>

```bash
docker compose \
  -f docker-compose.prod.yml \
  -f docker-compose.valkey.yml \
  up -d
```

</details>

## Calendar reminders

The production container processes reminders automatically; no cron job or external calendar service is required. Delivered checkpoints are persisted, so repeated processing does not duplicate notifications.

An administrator can choose the installation IANA time zone under **Administration → Calendar reminders**. The default is `Europe/Moscow`.

## Operations

The app exposes `/api/health` and `/api/version`. PostgreSQL data and uploaded images are stored in Docker volumes.

<details>
<summary><strong>Common Docker commands</strong></summary>

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f wishlist-app
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

For PGlite, replace `docker-compose.prod.yml` with `docker-compose.pglite.yml`.

</details>

## Local development

Requirements: Node.js 22, npm, and PostgreSQL (or the bundled PGlite, see below).

```bash
npm ci
cp .env.example .env
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Use a local `DATABASE_URL`, set `NEXTAUTH_URL=http://localhost:3000`, and add `DISABLE_PWA=1` to `.env`.

To start only the local database:

```bash
docker compose -f docker-compose.dev.yml up -d
```

Add `--profile cache` and set `REDIS_URL=redis://localhost:6379` when local Valkey is useful.

Without Docker, `npm run db:local` serves an embedded PGlite on `127.0.0.1:5432`. Point `DATABASE_URL` at `postgresql://postgres:postgres@127.0.0.1:5432/postgres`, then run `npm run db:push` and `npm run db:seed`.

<details>
<summary><strong>Development commands</strong></summary>

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build the production app |
| `npm start` | Start the built app |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Check TypeScript types |
| `npm run format` | Format code with Prettier |
| `npm test` | Run unit tests |
| `npm run test:e2e` | Run Playwright end-to-end tests |
| `npm run db:local` | Start the local PGlite database without Docker |
| `npm run db:seed` | Create initial users |
| `npm run db:studio` | Open Prisma Studio |

</details>

## Stack

Next.js · React · TypeScript · Prisma · PostgreSQL / PGlite · NextAuth · Tailwind CSS · Radix UI · Base UI · Framer Motion · Docker Compose · optional Valkey/Redis

See [CHANGELOG.md](./CHANGELOG.md) for release history.

## License

[MIT](./LICENSE)
