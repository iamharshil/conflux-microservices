# Auth Serivce Dockerfile
FROM base AS install
WORKDIR /app
COPY package.json bun.lockb tsconfig.json ./
RUN bun install --frozen-lockfile

# Build Typescript
FROM base AS build
WORKDIR /app
COPY --from=install /app/node_modules ./node_modules
COPY src/ ./src/
RUN bun build ./src/index.ts --target bun --minifiy --outdir ./dist

# Production runtime
FROM base AS runtime
WORKDIR /app
COPY --from=build /app/dist ./
COPY package.json ./
COPY --from=install /app/node_modules ./node_modules

# EXPOSE PORT
EXPOSE 3001
ENV NODE_ENV=production
CMD ["bun", "dist/index.js"]