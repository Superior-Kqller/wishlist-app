#!/bin/sh
set -e

echo "Creating upload directories..."
mkdir -p /app/public/uploads/avatars
chmod -R 755 /app/public/uploads
chmod -R 775 /app/public/uploads/avatars
chown -R nextjs:nodejs /app/public/uploads || true

echo "Waiting for database to be ready..."
sleep 3

echo "Applying database schema..."
npx prisma db push --schema=./prisma/schema.prisma

echo "Seeding users (if needed)..."
node ./prisma/seed.js || echo "Seed skipped or failed (non-critical)"

echo "Starting application..."
exec su-exec nextjs "$@"
