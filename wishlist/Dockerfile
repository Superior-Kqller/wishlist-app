# --- Dependencies ---
FROM node:22-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

# --- Builder ---
FROM node:22-alpine AS builder
RUN apk add --no-cache openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create upload directories in builder stage so they are copied with public folder
# Create a .gitkeep file to ensure the directory is copied
RUN mkdir -p /app/public/uploads/avatars && \
    touch /app/public/uploads/avatars/.gitkeep

# Build Next.js
RUN npm run build

# Bundle prisma CLI with ALL its transitive deps (for runtime migrations)
RUN mkdir /prisma-cli && cd /prisma-cli && \
    echo '{"dependencies":{"prisma":"'$(node -e "console.log(require('/app/node_modules/prisma/package.json').version)")'"}}'> package.json && \
    npm install --production 2>/dev/null

# --- Runner ---
FROM node:22-alpine AS runner
RUN apk add --no-cache openssl su-exec
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy standalone build
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma client for runtime queries
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy prisma CLI + ALL deps for migrations (overlay into node_modules)
COPY --from=builder /prisma-cli/node_modules ./node_modules

# Copy bcryptjs for seed script
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs

# Startup script - fix Windows CRLF line endings
COPY docker-entrypoint.sh ./
RUN sed -i 's/\r$//' docker-entrypoint.sh && chmod +x docker-entrypoint.sh

# Set ownership for the entire app directory BEFORE switching to nextjs user
# Upload directories will be created in docker-entrypoint.sh as root
RUN chown -R nextjs:nodejs /app

# Note: We don't switch to nextjs user here because docker-entrypoint.sh needs to run as root
# to create directories when volume is mounted. We'll switch to nextjs in docker-entrypoint.sh
# USER nextjs

EXPOSE 4030
ENV PORT=4030
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
