# Wishlist App

<p align="center">
  <img src="public/assets/github/readme-banner.png" alt="Вишлист — баннер" width="960">
</p>

Современное приложение для создания и управления списками желаний.

## Стек (кратко)

- **Приложение:** Next.js 16 (App Router)
- **База данных:** PostgreSQL 17 + Prisma
- **UI:** Tailwind CSS + shadcn/ui + Framer Motion
- **Аутентификация:** NextAuth.js с ролями (USER/ADMIN)
- **Инфраструктура:** Docker + Docker Compose

## Основные возможности

- 🔐 Безопасная аутентификация с ролями (USER/ADMIN)
- 👥 Управление пользователями (создание, редактирование, удаление)
- 🔑 Смена пароля и профиля
- 🎯 Приоритеты 1-5 через компактный выбор
- 🏷️ Теги с фильтрацией и сохранением состояния
- 👤 Фильтрация по пользователю и подборке (по умолчанию — «Все пользователи»)
- 🔍 Поиск и сортировка: новые/старые, приоритет, цена
- 🎁 Статусы подарков: доступно / забронировано / куплено
- 📤 Экспорт списка в CSV и JSON
- 🎨 7 цветовых тем + светлая/тёмная/системная
- 📱 Адаптивный дизайн и **PWA** (установка на телефон / «как приложение» после production-сборки)
- 🔗 **Bookmarklet** и ссылка вида `/?addUrl=…` — добавление товара с открытой страницы магазина
- 🚀 Бесконечная прокрутка и пагинация для больших списков
  (rate limiting, CSP, валидация и др. — под капотом, без лишних настроек)

## Bookmarklet и установка (PWA)

### Добавление с текущей вкладки (bookmarklet)

1. Подставьте в код **базовый URL приложения** (как в `NEXTAUTH_URL`, без завершающего `/`).
2. Создайте новую закладку в браузере и в поле URL вставьте **одну строку** (начинается с `javascript:`).

```text
javascript:(function(){var B='https://wishlist.yourdomain.com';var u=encodeURIComponent(location.href);window.open(B.replace(/\/$/,'')+'/?addUrl='+u+'&fill=1','_blank');})();
```

- Параметр **`fill=1`** сразу запускает парсинг страницы (как кнопка «Заполнить по ссылке»). Без него откроется форма только с вставленным URL.
- После входа в аккаунт откроется диалог добавления товара. Если вы были не авторизованы, войдите — при корректном `callbackUrl` вернётесь на главную с тем же сценарием при необходимости откройте закладку снова.

Ручной deep link (без закладки): откройте  
`https://ваш-домен/?addUrl=<urlencode(ссылка на товар)>&fill=1`.

### PWA

- При **`npm run build`** подключается `@ducanh2912/next-pwa` и в `public/` генерируются `sw.js` и `workbox-*.js` (в репозитории они в `.gitignore`, в образ Docker попадают из сборки).
- В браузере: меню «Установить приложение» / «Добавить на главный экран» (зависит от платформы).
- В `.env` **не задавайте произвольный `NODE_ENV`**: скрипт `npm run build` выставляет `production` через `cross-env`. Неверное значение ломает пререндер.
- Отключить PWA в сборке: `DISABLE_PWA=1 npm run build`.

## Быстрый старт

### 1. Подготовить директорию

```bash
mkdir -p /opt/wishlist && cd /opt/wishlist
```

### 2. Скачать docker-compose и .env.example

```bash
curl -fsSL https://raw.githubusercontent.com/Superior-Kqller/wishlist-app/main/docker-compose.prod.yml -o docker-compose.yml
curl -fsSL https://raw.githubusercontent.com/Superior-Kqller/wishlist-app/main/.env.example -o .env.example
```

### 3. Создать proxy network (если ещё не создана)

```bash
docker network create proxy
```

### 4. Настроить окружение

Создать `.env` из шаблона и сразу подставить случайные значения (Ubuntu/Linux, одной командой):

```bash
cp .env.example .env && DB_PASSWORD="$(openssl rand -hex 32)" && NEXTAUTH_SECRET="$(openssl rand -base64 32)" && sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=${DB_PASSWORD}/" .env && sed -i "s/^NEXTAUTH_SECRET=.*/NEXTAUTH_SECRET=${NEXTAUTH_SECRET}/" .env
```

После этого отредактируйте `.env` любым удобным редактором и убедитесь, что заданы:

- `DB_PASSWORD` — пароль для PostgreSQL
- `NEXTAUTH_SECRET` — секрет NextAuth
- `NEXTAUTH_URL` — URL вашего приложения (`https://wishlist.yourdomain.com`)
- `AVATAR_ALLOWED_HOSTS` — whitelist доменов для внешних аватаров (через запятую, только host без `https://`)
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
Для production seed теперь блокирует небезопасные значения паролей (`changeme`/пустые), а также некорректные логины seed-пользователей.

При необходимости можно пересоздать вручную:

```bash
docker compose exec wishlist-app node prisma/seed.js
```

Или повысить существующего пользователя до админа:

```bash
docker compose exec wishlist-app node prisma/promote-admin.js
```

Готово! Приложение доступно на порту `4030`. Настройте reverse proxy (Nginx, Caddy, NPM) по необходимости.

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

## Парсинг по ссылке

Серверный эндпоинт `POST /api/parse` подтягивает название, цену, изображения и краткое описание (Open Graph и др.), в т.ч. для ряда маркетплейсов. Сайты магазинов часто меняются — разбор «живых» страниц **best effort**. Всегда можно отредактировать карточку вручную.

## Changelog и релизы

- История изменений: `CHANGELOG.md`
- Стабильные релизы и теги: раздел Releases в GitHub‑репозитории

## Лицензия

MIT

## Автор

Superior-Kqller

Проект создан с помощью AI (Claude / Cursor IDE).
