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

# Production stage
FROM node:22.14-slim AS runner
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Copy generated client and built code
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
EXPOSE 3000

# Explicitly ensure DATABASE_URL is used by Prisma
CMD ["sh", "-c", "npx prisma db push && node dist/main"]