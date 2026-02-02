# Build stage
FROM node:22.14-slim AS builder

# Install openssl for Prisma
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies
RUN npm ci

COPY . .

# Generate Prisma Client (This creates the files in node_modules/.prisma)
RUN npx prisma generate

# Build NestJS app
RUN npm run build

# --- Production stage ---
FROM node:22.14-slim AS runner

# Required for Prisma runtime
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./

# Install only production dependencies
RUN npm ci --omit=dev

# Copy the generated Prisma Client from the builder stage
# Your schema.prisma outputs to ./src/generated/prisma
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

ENV NODE_ENV=production

EXPOSE 3000

# Use a shell to run migrations before starting (optional but recommended)
CMD ["sh", "-c", "npx prisma db push && node dist/main"]