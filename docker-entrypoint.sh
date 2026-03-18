#!/bin/sh
set -e

# Get version from environment or default
APP_VERSION="${APP_VERSION:-dev}"

# Startup banner
echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   🎁  В И Ш Л И С Т                                       ║"
echo "║       Wishlist App v${APP_VERSION}                                  ║"
echo "║                                                           ║"
echo "╠═══════════════════════════════════════════════════════════╣"
echo "║   📦 Environment: production                              ║"
echo "║   🌐 Port: ${PORT:-4030}                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
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
echo "═══════════════════════════════════════════════════════════════"
echo "   🚀 Wishlist v${APP_VERSION} is starting on port ${PORT:-4030}..."
echo "═══════════════════════════════════════════════════════════════"
echo ""

exec su-exec nextjs "$@"
