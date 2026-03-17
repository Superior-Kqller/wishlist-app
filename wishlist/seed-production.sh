#!/bin/bash

# Скрипт для создания пользователей на production
# Запускать ТОЛЬКО при первом запуске!

echo "🌱 Seeding users to production database..."
echo ""
echo "⚠️  This will create users with credentials from .env file"
echo ""
read -p "Continue? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "Cancelled."
    exit 0
fi

docker-compose exec wishlist-app npx ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/seed.ts

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Users created successfully!"
    echo ""
    echo "You can now login with:"
    echo "  User 1: $SEED_USER1_USERNAME / $SEED_USER1_PASSWORD"
    echo "  User 2: $SEED_USER2_USERNAME / $SEED_USER2_PASSWORD"
else
    echo ""
    echo "❌ Error creating users. Check logs above."
fi
