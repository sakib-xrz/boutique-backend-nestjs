# Build stage
FROM node:22.14-slim AS builder

# Install openssl (required for Prisma to run on slim images)
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 1. Copy dependencies first for better caching
COPY package*.json ./
COPY prisma ./prisma/

# 2. Install ALL dependencies
RUN npm ci

# 3. Copy the rest of your source code
COPY . .

# 4. Generate Prisma Client (outputs to your src/generated folder)
RUN npx prisma generate

# 5. Build the NestJS application
RUN npm run build

# --- Production stage ---
FROM node:22.14-slim AS runner

# Required for Prisma runtime execution
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# --- THE FIX FOR YOUR STRUCTURE ---
# Copy the custom generated client folder shown in your screenshot
COPY --from=builder /app/src/generated ./src/generated

# Copy the hidden Prisma engine binaries (Required for 'db push' and runtime)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy built NestJS code and Prisma schema
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production
EXPOSE 3000

# Run 'db push' to sync your VPS database before starting the app
CMD ["sh", "-c", "npx prisma db push && node dist/main"]