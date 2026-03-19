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

echo ""
echo "⏳ Waiting for database..."
sleep 3
echo "   ✓ Database connection established"

echo ""
echo "🔄 Applying database migrations..."
npx prisma migrate deploy --schema=./prisma/schema.prisma
echo "   ✓ Migrations applied"

echo ""
echo "🌱 Seeding users (if needed)..."
node ./prisma/seed.js 2>/dev/null && echo "   ✓ Seed complete" || echo "   ⊘ Seed skipped (already exists)"

echo ""
printf '%s\n' \
  "────────────────────────────────────────────" \
  "  🚀 Wishlist v${DISPLAY_VERSION} starting..." \
  "────────────────────────────────────────────" \
  ""

exec su-exec nextjs "$@"
