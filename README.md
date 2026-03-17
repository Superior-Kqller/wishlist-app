# Wishlist App

Современное приложение для создания и управления списками желаний.

## Скриншоты

<p align="center">
  <img src="assets/dark-theme.png" alt="Тёмная тема" width="800">
</p>

## Технологии

- **Frontend & Backend:** Next.js 16 (App Router)
- **База данных:** PostgreSQL 17
- **ORM:** Prisma
- **UI:** Tailwind CSS + shadcn/ui + Framer Motion
- **Аутентификация:** NextAuth.js с ролями (USER/ADMIN)
- **Деплой:** Docker + Docker Compose

## Возможности

- 🔐 Безопасная аутентификация с ролями (USER/ADMIN)
- 👥 Управление пользователями (создание, редактирование, удаление)
- 🔑 Смена пароля и профиля
- 🎯 Приоритеты (1-5 звезд)
- 🏷️ Теги с фильтрацией
- 🔍 Поиск и сортировка
- 🛒 Отметка "куплено"
- 🎨 7 цветовых тем + светлая/тёмная/системная
- 📱 Адаптивный дизайн
- 🚀 Пагинация для больших списков
- 🛡️ Rate limiting, CSP headers, валидация данных

## Быстрый старт (Деплой на Ubuntu VM)

### 1. Подготовить директорию

```bash
mkdir -p /opt/wishlist && cd /opt/wishlist
```

### 2. Скачать docker-compose и .env.example

```bash
curl -fsSL https://raw.githubusercontent.com/Superior-Kqller/wishlist-app/main/docker-compose.prod.yml -o docker-compose.yml
curl -fsSL https://raw.githubusercontent.com/Superior-Kqller/wishlist-app/main/.env.example -o .env
```

### 3. Создать proxy network (если ещё не создана)

```bash
docker network create proxy
```

### 4. Настроить окружение

Сгенерировать пароль БД и секрет NextAuth:

```bash
# сгенерировать надёжный пароль для PostgreSQL
echo "DB_PASSWORD=$(openssl rand -hex 32)"

# сгенерировать секрет для NextAuth
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)"
```

Вставить сгенерированные значения в `.env`:

```bash
nano .env
```

**Обязательно измените:**

- `DB_PASSWORD` — вставить сгенерированный пароль
- `NEXTAUTH_SECRET` — вставить сгенерированный секрет
- `NEXTAUTH_URL` — URL вашего приложения (`https://wishlist.yourdomain.com`)
- `SEED_USER*` — логины, пароли и имена пользователей

### 5. Запустить приложение

```bash
docker compose pull
docker compose up -d
```

Проверить статус:

```bash
docker compose ps
docker compose logs -f wishlist-app
```

### 6. Создать пользователей (автоматически)

Пользователи создаются автоматически при первом запуске контейнера.
Логины и пароли берутся из `.env` файла (переменные `SEED_USER*`).

**Важно:** Первый пользователь автоматически получает роль ADMIN. Если админов нет, seed скрипт автоматически повысит первого пользователя до админа.

При необходимости можно пересоздать вручную:

```bash
docker compose exec wishlist-app node prisma/seed.js
```

Или повысить существующего пользователя до админа:

```bash
docker compose exec wishlist-app node prisma/promote-admin.js
```

### 7. Настроить Nginx Proxy Manager

1. Откройте Nginx Proxy Manager
2. Добавьте Proxy Host:
   - **Domain Names:** `wishlist.yourdomain.com`
   - **Forward Hostname/IP:** `wishlist-app` (или IP вашей VM)
   - **Forward Port:** `4030`
   - **WebSocket Support:** ✅
3. SSL: Request Let's Encrypt Certificate

**Примечание:** Если используете proxy network, NPM автоматически найдет контейнер `wishlist-app` по имени.

Готово! Приложение доступно по адресу `https://wishlist.yourdomain.com`

## Локальная разработка

### Требования

- Node.js 22+
- PostgreSQL 17+
- npm или pnpm

### Установка

```bash
# Установить зависимости
npm install

# Настроить .env
cp .env.example .env
# Отредактировать DATABASE_URL

# Применить схему БД
npx prisma db push

# Создать пользователей
npm run db:seed

# Запустить dev сервер
npm run dev
```

Приложение доступно на `http://localhost:4030`

## Полезные команды

```bash
# Остановить
docker compose down

# Остановить с удалением volumes (БД будет очищена!)
docker compose down -v

# Посмотреть логи
docker compose logs -f

# Бэкап БД
docker compose exec wishlist-db pg_dump -U wishlist wishlist > backup.sql

# Восстановить БД из бэкапа
cat backup.sql | docker compose exec -T wishlist-db psql -U wishlist wishlist

# Повысить первого пользователя до админа (если нужно)
docker compose exec wishlist-app node prisma/promote-admin.js
```

## Обновление приложения

```bash
cd /opt/wishlist
docker compose pull
docker compose up -d
```

## Архитектура

```text
wishlist/
├── prisma/
│   ├── schema.prisma      # Схема БД
│   ├── seed.ts            # Seed пользователей (TS)
│   ├── seed.js            # Seed пользователей (JS для Docker)
│   └── promote-admin.js   # Скрипт повышения до админа
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/           # API routes
│   │   │   ├── auth/      # NextAuth
│   │   │   ├── items/     # CRUD для wishlist (с пагинацией)
│   │   │   ├── tags/      # Теги
│   │   │   ├── users/     # Управление пользователями
│   │   │   │   ├── route.ts        # Список/создание
│   │   │   │   ├── [id]/route.ts   # Редактирование/удаление
│   │   │   │   ├── [id]/password/  # Смена пароля
│   │   │   │   └── me/route.ts     # Свой профиль
│   │   │   └── health/    # Health check
│   │   ├── admin/         # Страница администрирования
│   │   ├── settings/      # Страница настроек пользователя
│   │   ├── login/         # Страница логина
│   │   └── page.tsx       # Главная страница
│   ├── components/        # React компоненты
│   │   ├── ui/            # UI примитивы (shadcn)
│   │   ├── admin/         # Компоненты админки
│   │   ├── settings/      # Компоненты настроек
│   │   ├── Header.tsx
│   │   ├── ThemeSelector.tsx
│   │   ├── WishlistCard.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── prisma.ts      # Prisma клиент
│   │   ├── auth.ts        # NextAuth конфиг
│   │   ├── auth-utils.ts  # Утилиты авторизации
│   │   ├── rate-limit.ts  # Rate limiting
│   │   ├── logger.ts      # Санитизированное логирование
│   │   ├── password-validation.ts
│   │   └── utils.ts       # Утилиты
│   ├── proxy.ts           # Next.js proxy (защита роутов)
│   └── types/             # TypeScript типы
├── docker-compose.prod.yml # Compose конфигурация (GHCR-образ)
├── Dockerfile             # Multi-stage build (для CI)
├── docker-entrypoint.sh   # Скрипт запуска с миграциями
└── .env                   # Переменные окружения
```

## Безопасность

- ✅ JWT сессии с NextAuth
- ✅ Bcrypt для паролей (12 rounds)
- ✅ HTTPS через Nginx Proxy Manager
- ✅ CORS и CSP headers настроены
- ✅ Rate limiting на всех API endpoints
- ✅ Валидация данных (Zod)
- ✅ SQL injection защита (Prisma)
- ✅ Санитизация логов (скрытие паролей, токенов)
- ✅ Защита от удаления последнего админа
- ✅ Транзакции для критичных операций (race condition защита)
- ✅ Сложность паролей (минимум 8 символов, буквы, цифры, спецсимволы)
- ✅ Индексы БД для производительности

## Лицензия

MIT

## Автор

Superior-Kqller

Проект создан с помощью AI (Claude / Cursor IDE).
