# Wishlist App

Современное приложение для создания списков желаний (wishlist) с автоматическим парсингом данных о товарах из ссылок.

## Технологии

- **Frontend & Backend:** Next.js 16 (App Router)
- **База данных:** PostgreSQL 17
- **ORM:** Prisma
- **UI:** Tailwind CSS + shadcn/ui + Framer Motion
- **Аутентификация:** NextAuth.js с ролями (USER/ADMIN)
- **Парсинг:** Cheerio (поддержка Wildberries, Ozon, AliExpress и других)
- **Деплой:** Docker + Docker Compose

## Возможности

- ✨ Автоматический парсинг товаров по ссылке (название, цена, изображения)
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

### 1. Скопировать проект

```bash
git clone https://github.com/Superior-Kqller/wishlist-sh-app.git /opt/wishlist
cd /opt/wishlist
```

### 2. Создать proxy network (если ещё не создана)

```bash
docker network create proxy
```

### 3. Настроить окружение

```bash
cp .env.example .env
nano .env
```

**Обязательно измените:**

```env
# Пароль для PostgreSQL
DB_PASSWORD=your-strong-password

# Секрет для NextAuth (сгенерируйте: openssl rand -base64 32)
NEXTAUTH_SECRET=your-generated-secret

# URL вашего приложения
NEXTAUTH_URL=https://wishlist.yourdomain.com

# Логины и пароли пользователей
SEED_USER1_USERNAME=user1
SEED_USER1_PASSWORD=strong-password-1
SEED_USER1_NAME=Имя Первого

SEED_USER2_USERNAME=user2
SEED_USER2_PASSWORD=strong-password-2
SEED_USER2_NAME=Имя Второго
```

### 4. Запустить приложение

```bash
# если образ приватный — залогиниться в GHCR
echo "$GH_TOKEN" | docker login ghcr.io -u <github-username> --password-stdin

# запуск
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

Проверить статус:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f wishlist-app
```

### 5. Создать пользователей (автоматически)

Пользователи создаются автоматически при первом запуске контейнера.
Логины и пароли берутся из `.env` файла (переменные `SEED_USER*`).

**Важно:** Первый пользователь автоматически получает роль ADMIN. Если админов нет, seed скрипт автоматически повысит первого пользователя до админа.

При необходимости можно пересоздать вручную:

```bash
docker compose -f docker-compose.prod.yml exec wishlist-app node prisma/seed.js
```

Или повысить существующего пользователя до админа:

```bash
docker compose -f docker-compose.prod.yml exec wishlist-app node prisma/promote-admin.js
```

### 6. Настроить Nginx Proxy Manager

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
docker compose -f docker-compose.prod.yml down

# Остановить с удалением volumes (БД будет очищена!)
docker compose -f docker-compose.prod.yml down -v

# Посмотреть логи
docker compose -f docker-compose.prod.yml logs -f

# Бэкап БД
docker compose -f docker-compose.prod.yml exec wishlist-db pg_dump -U wishlist wishlist > backup.sql

# Восстановить БД из бэкапа
cat backup.sql | docker compose -f docker-compose.prod.yml exec -T wishlist-db psql -U wishlist wishlist

# Повысить первого пользователя до админа (если нужно)
docker compose -f docker-compose.prod.yml exec wishlist-app node prisma/promote-admin.js
```

## Обновление приложения

```bash
cd /opt/wishlist
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## GitHub Actions (Docker)

В проект добавлен workflow `/.github/workflows/docker-image.yml`:

- `pull_request` в `main`: только сборка образа (без push)
- `push` в `main`: сборка и публикация в `ghcr.io/<owner>/<repo>`
- `push` тега `v*.*.*`: сборка и публикация с тегом релиза
- ручной запуск через `workflow_dispatch`

Для публикации в GHCR отдельные секреты не нужны: используется встроенный `GITHUB_TOKEN`.

По умолчанию используется образ `ghcr.io/superior-kqller/wishlist-sh-app:latest`.
При необходимости смените его на тег релиза (`vX.Y.Z`) в `docker-compose.prod.yml`.

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
│   │   │   ├── parse/     # Парсинг URL
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
│   │   ├── parser.ts      # Парсер товаров
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

## Страницы приложения

- **/** - Главная страница со списком желаний
- **/login** - Страница входа
- **/settings** - Настройки профиля (смена имени, пароля, выбор темы)
- **/admin** - Управление пользователями (только для админов)
  - Создание пользователей
  - Редактирование (имя, логин, роль)
  - Смена пароля
  - Удаление пользователей
  - Поиск и фильтрация

## Цветовые темы

Приложение поддерживает 7 цветовых схем:

- Фиолетовый (по умолчанию)
- Синий
- Зелёный
- Изумрудный
- Бирюзовый
- Оранжевый
- Розовый

Каждая тема доступна в светлом и тёмном режимах. Также поддерживается автоматическое определение системной темы.

## Поддерживаемые маркетплейсы

- Wildberries
- Ozon
- AliExpress
- Любой сайт с JSON-LD или OpenGraph разметкой

## Лицензия

MIT

## Автор

Superior-Kqller
