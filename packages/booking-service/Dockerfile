# Booking Service Dockerfile
FROM oven/bun:latest AS base

# Install dependencies
FROM base AS install
WORKDIR /app
COPY package.json bun.lockb tsconfig.json ./
RUN bun install --frozen-lockfile

# Build TypeScript
FROM base AS build
WORKDIR /app
COPY --from=install /app/node_modules ./node_modules
COPY tsconfig.json ./
COPY src/ ./src/
RUN bun build ./src/index.ts --target bun --minify --outdir ./dist

# Production runtime
FROM base AS runtime
WORKDIR /app
COPY --from=build /app/dist ./
COPY package.json ./
COPY --from=install /app/node_modules ./node_modules

# Create non-root user
RUN addgroup --system --gid 1001 bun && \
    adduser --system --uid 1001 bun
USER bun

EXPOSE 3002
ENV NODE_ENV=production
CMD ["bun", "dist/index.js"]