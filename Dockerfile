# Use an explicit Node version that satisfies Prisma 7
FROM node:22.13-slim AS base

# Install OpenSSL (Required by Prisma Client)
RUN apt-get update && apt-get install -y openssl libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Stage 1: Build
FROM base AS build
COPY package*.json ./

# COPY THE PRISMA FOLDER FIRST
# This allows the 'postinstall' script to find your schema
COPY prisma ./prisma/

# Install dependencies (this will now successfully run 'prisma generate')
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Runtime
FROM base AS runtime
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./ 

# Set production environment
ENV NODE_ENV=production
EXPOSE 8000

# Run migrations and start the server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]