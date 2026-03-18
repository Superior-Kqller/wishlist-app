#!/bin/sh
set -e

# Get version from environment or default, truncate if too long
APP_VERSION="${APP_VERSION:-dev}"
if [ ${#APP_VERSION} -gt 12 ]; then
  DISPLAY_VERSION="$(echo "$APP_VERSION" | cut -c1-12)..."
else
  DISPLAY_VERSION="$APP_VERSION"
fi

# Startup banner
echo ""
echo "┌─────────────────────────────────────────┐"
echo "│                                         │"
echo "│   🎁 ВИШЛИСТ                            │"
echo "│   Wishlist App v${DISPLAY_VERSION}"
echo "│                                         │"
echo "├─────────────────────────────────────────┤"
echo "│   📦 Environment: production            │"
echo "│   🌐 Port: ${PORT:-4030}                         │"
echo "│   🔗 Network: all interfaces (0.0.0.0)  │"
echo "└─────────────────────────────────────────┘"
echo ""

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
echo "────────────────────────────────────────────"
echo "  🚀 Wishlist v${DISPLAY_VERSION} starting..."
echo "────────────────────────────────────────────"
echo ""

exec su-exec nextjs "$@"
