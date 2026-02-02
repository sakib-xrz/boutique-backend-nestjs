# Use an explicit Node version that satisfies Prisma 7
FROM node:22.13-slim AS base

# Install OpenSSL (Required by Prisma Client)
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Stage 1: Build
FROM base AS build
COPY package*.json ./
# Install ALL dependencies (including devDependencies like @nestjs/cli and prisma)
RUN npm install
COPY . .
# Generate Prisma Client and build the NestJS app
RUN npx prisma generate
RUN npm run build

# Stage 2: Runtime
FROM base AS runtime
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma

# Set production environment
ENV NODE_ENV=production

# Expose your configured port
EXPOSE 8000

# Run migrations and start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]