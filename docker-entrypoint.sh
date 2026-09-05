#!/bin/sh
set -e

# Get version from environment or default, truncate if too long
APP_VERSION="${APP_VERSION:-dev}"
if [ ${#APP_VERSION} -gt 12 ]; then
  DISPLAY_VERSION="$(echo "$APP_VERSION" | cut -c1-12)..."
else
  DISPLAY_VERSION="$APP_VERSION"
fi

# Box interior width (must match top/bottom ┌─┐ row length)
BOX_INNER=41

# Pad to BOX_INNER bytes, or trim (ASCII-only) if длиннее — для UTF-8 строк не обрезаем посередине символа
pad_inner() {
  _s="$1"
  if [ "${#_s}" -gt "$BOX_INNER" ]; then
    _s=$(printf '%s' "$_s" | head -c "$BOX_INNER")
  fi
  while [ "${#_s}" -lt "$BOX_INNER" ]; do
    _s="${_s} "
  done
  printf '%s' "$_s"
}

# One printf → один сгусток записи в stdout, меньше «рваного» баннера в docker compose logs
print_startup_banner() {
  _port="${PORT:-4030}"
  printf '\n┌─────────────────────────────────────────┐\n│%s│\n│%s│\n│%s│\n│%s│\n├─────────────────────────────────────────┤\n│%s│\n│%s│\n│%s│\n└─────────────────────────────────────────┘\n\n' \
    "$(pad_inner '')" \
    "$(pad_inner '   🎁 ВИШЛИСТ')" \
    "$(pad_inner "   Wishlist App v${DISPLAY_VERSION}")" \
    "$(pad_inner '')" \
    "$(pad_inner '   📦 Environment: production')" \
    "$(pad_inner "   🌐 Port: ${_port}")" \
    "$(pad_inner "   🔗 Listen: 0.0.0.0:${_port}")"
}

# Короткая пауза: при параллельном старте compose иногда вклиниваются строки других сервисов
sleep 0.25 2>/dev/null || true
print_startup_banner

echo "📁 Creating upload directories..."
mkdir -p /app/public/uploads/avatars
chmod -R 755 /app/public/uploads
chmod -R 775 /app/public/uploads/avatars
chown -R nextjs:nodejs /app/public/uploads || true
echo "   ✓ Upload directories ready"

PGLITE_PID=""
APP_PID=""
if [ "${DATABASE_PROVIDER:-postgresql}" = "pglite" ]; then
  PGLITE_DATA_DIR="${PGLITE_DATA_DIR:-/app/data/pglite}"
  PGLITE_HOST="${PGLITE_HOST:-127.0.0.1}"
  PGLITE_PORT="${PGLITE_PORT:-5432}"
  PGLITE_MAX_CONNECTIONS="${PGLITE_MAX_CONNECTIONS:-8}"
  DATABASE_URL="postgresql://postgres:postgres@${PGLITE_HOST}:${PGLITE_PORT}/postgres"
  export DATABASE_URL

  echo ""
  echo "🧩 Starting embedded PGlite..."
  mkdir -p "$PGLITE_DATA_DIR"
  chown -R nextjs:nodejs "$(dirname "$PGLITE_DATA_DIR")"
  su-exec nextjs node ./node_modules/@electric-sql/pglite-socket/dist/scripts/server.js \
    --db="$PGLITE_DATA_DIR" \
    --host="$PGLITE_HOST" \
    --port="$PGLITE_PORT" \
    --max-connections="$PGLITE_MAX_CONNECTIONS" &
  PGLITE_PID="$!"

  cleanup_embedded_services() {
    if [ -n "$APP_PID" ] && kill -0 "$APP_PID" 2>/dev/null; then
      kill "$APP_PID" 2>/dev/null || true
      wait "$APP_PID" 2>/dev/null || true
    fi
    if [ -n "$PGLITE_PID" ] && kill -0 "$PGLITE_PID" 2>/dev/null; then
      kill "$PGLITE_PID" 2>/dev/null || true
      wait "$PGLITE_PID" 2>/dev/null || true
    fi
  }
  trap cleanup_embedded_services EXIT INT TERM

  echo "⏳ Waiting for embedded database..."
  PGLITE_READY=0
  for _i in $(seq 1 30); do
    if node -e "const { Client } = require('pg'); const client = new Client({ connectionString: process.env.DATABASE_URL }); client.connect().then(() => client.query('select 1')).then(() => client.end()).then(() => process.exit(0)).catch(() => process.exit(1));" >/dev/null 2>&1; then
      echo "   ✓ Embedded PGlite ready"
      PGLITE_READY=1
      break
    fi
    sleep 1
  done
  if [ "$PGLITE_READY" != "1" ]; then
    echo "   ✗ Embedded PGlite did not become ready"
    exit 1
  fi
fi

if [ "${RUN_MIGRATIONS_ON_START:-1}" = "1" ]; then
  echo ""
  echo "⏳ Waiting for database..."
  if [ "${DATABASE_PROVIDER:-postgresql}" != "pglite" ]; then
    sleep 3
  fi
  echo "   ✓ Database connection established"

  echo ""
  echo "🔄 Applying database migrations..."
  node ./node_modules/prisma/build/index.js migrate deploy --schema=./prisma/schema.prisma
  echo "   ✓ Migrations applied"

  echo ""
  echo "🌱 Seeding users (if needed)..."
  # Сид идемпотентен: на уже наполненной базе он не падает, а проверяет,
  # остался ли администратор, и выходит с нулём. Поэтому ненулевой код —
  # всегда настоящая ошибка: небезопасный SEED_*_PASSWORD, одинаковые
  # логины, недоступная база.
  #
  # Раньше здесь стояло `2>/dev/null && ... || echo "Seed skipped (already
  # exists)"`. Оно гасило сообщение об ошибке и выдавало любой сбой за
  # штатный пропуск: на чистой установке с паролем `changeme` человек видел
  # бодрый рапорт, а получал приложение без единого пользователя.
  #
  # Ведём себя как миграции выше: шаг запуска либо проходит, либо роняет
  # контейнер. Отключаются оба шага одинаково — RUN_MIGRATIONS_ON_START=0.
  node ./prisma/seed.js
  echo "   ✓ Seed complete"
else
  echo ""
  echo "⊘ Database migrations skipped for this container"
fi

echo ""
printf '%s\n' \
  "────────────────────────────────────────────" \
  "  🚀 Wishlist v${DISPLAY_VERSION} starting..." \
  "────────────────────────────────────────────" \
  ""

if [ "${DATABASE_PROVIDER:-postgresql}" = "pglite" ]; then
  su-exec nextjs "$@" &
  APP_PID="$!"
  wait "$APP_PID"
else
  exec su-exec nextjs "$@"
fi
