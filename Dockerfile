# Build stage
FROM node:22.14-slim AS builder

RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

# Generates to ./src/generated/prisma
RUN npx prisma generate

RUN npm run build

# --- Production stage ---
FROM node:22.14-slim AS runner

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# --- THE FIX ---
# 1. Copy the custom generated client (this includes the engine)
COPY --from=builder /app/src/generated ./src/generated

# 2. Copy built NestJS code and Prisma schema
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
EXPOSE 3000

# Run 'db push' and start
CMD ["sh", "-c", "npx prisma db push && node dist/main"]