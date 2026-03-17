#!/bin/sh
set -e

# Create upload directories as root before switching to nextjs user
# This is needed because volume mount may overwrite directories from image
echo "Creating upload directories..."
mkdir -p /app/public/uploads/avatars
chmod -R 755 /app/public/uploads
chmod -R 775 /app/public/uploads/avatars
chown -R nextjs:nodejs /app/public/uploads || echo "Note: chown may fail if running as non-root, this is OK"

echo "Waiting for database to be ready..."
sleep 2

echo "Preparing database schema updates..."
# Add updatedAt and avatarUrl columns with default values if they don't exist
node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  try {
    // Check and add updatedAt column
    const updatedAtResult = await prisma.\$queryRaw\`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'updatedAt'
    \`;
    
    if (updatedAtResult.length === 0) {
      console.log('Adding updatedAt column to User table...');
      await prisma.\$executeRaw\`
        ALTER TABLE \"User\" 
        ADD COLUMN \"updatedAt\" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      \`;
      console.log('updatedAt column added successfully');
    } else {
      console.log('updatedAt column already exists');
    }

    // Check and add avatarUrl column
    const avatarUrlResult = await prisma.\$queryRaw\`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'avatarUrl'
    \`;
    
    if (avatarUrlResult.length === 0) {
      console.log('Adding avatarUrl column to User table...');
      await prisma.\$executeRaw\`
        ALTER TABLE \"User\" 
        ADD COLUMN \"avatarUrl\" TEXT
      \`;
      console.log('avatarUrl column added successfully');
    } else {
      console.log('avatarUrl column already exists');
    }
  } catch (error) {
    console.error('Error preparing schema:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
" || echo "Schema preparation skipped (non-critical)"

echo "Running database migrations..."
npx prisma db push --skip-generate --schema=./prisma/schema.prisma

echo "Seeding users (if needed)..."
node ./prisma/seed.js || echo "Seed skipped or failed (non-critical)"

echo "Ensuring upload directories exist..."
# Проверяем существование директорий для загрузок
# Они должны быть созданы в Dockerfile в builder stage и скопированы вместе с public
if [ ! -d "/app/public/uploads/avatars" ]; then
  echo "Warning: upload directories not found, attempting to create..."
  # Пытаемся создать директорию (может не сработать из-за прав доступа пользователя nextjs)
  mkdir -p /app/public/uploads/avatars 2>/dev/null || echo "Failed to create directories (this is expected if running as nextjs user)"
else
  echo "Upload directories exist"
fi

echo "Switching to nextjs user..."
# Switch to nextjs user for running the application
exec su-exec nextjs "$@"
