# Complete Microservices Setup Documentation

## 🎯 Table of Contents
1. [Concept Overview](#concept-overview)
2. [Docker Fundamentals](#docker-fundamentals)
3. [Nginx Fundamentals](#nginx-fundamentals)
4. [File-by-File Explanation](#file-by-file-explanation)
5. [Service Architecture](#service-architecture)
6. [Step-by-Step Manual Setup](#step-by-step-manual-setup)

---

## 📚 Concept Overview

### What is a Microservices Architecture?
Instead of one big application, we split our system into small, independent services:
- **Auth Service**: Only handles user login/registration
- **Booking Service**: Only handles appointment booking
- **Availability Service**: Only manages when staff are available
- **Notification Service**: Only handles sending emails/SMS

**Why?**
- If booking service crashes, auth still works
- Each can be scaled independently
- Different teams can work on different services
- Each can use different database if needed

### Why Docker?
Imagine you have a recipe (your code) and ingredients (dependencies). Docker packages your recipe + ingredients into a "container" that can run anywhere.

**Benefits:**
- "It works on my machine" problem solved
- Same environment for development, testing, production
- Easy to start/stop services
- Consistent team environment

### Why Nginx as API Gateway?
Nginx acts like a receptionist at a large office building:
- You go to one main entrance (port 80)
- Receptionist directs you to the right office (service)
- Receptionist can say "too many requests, wait" (rate limiting)
- Receptionist can check your ID (authentication)

---

## 🐳 Docker Fundamentals

### Core Concepts

#### 1. Image vs Container
- **Image**: Like a recipe (instructions to build something)
- **Container**: The actual cooked dish (running instance of image)

#### 2. Dockerfile
Text file with instructions to build an image:
```dockerfile
FROM oven/bun:latest    # Start with this base
WORKDIR /app          # Set working directory
COPY . .              # Copy your code
RUN bun install       # Install dependencies
CMD ["bun", "start"]  # Command to run
```

#### 3. Docker Compose
Tool to run multiple containers together. Instead of:
```bash
docker run postgres
docker run redis
docker run auth-service
docker run booking-service
```
You run: `docker-compose up`

---

## 🌐 Nginx Fundamentals

### Core Concepts

#### 1. Reverse Proxy
Normally, you go to `auth-service:3001`, `booking:3002`. With reverse proxy:
- You go to `localhost/auth` → Nginx forwards to auth-service:3001
- You go to `localhost/bookings` → Nginx forwards to booking:3002

#### 2. Upstream Configuration
Group of servers that handle the same type of requests:
```nginx
upstream auth_service {
    server auth-service:3001;  # First server
    server auth-service:3001;  # Second server (if scaled)
}
```

#### 3. Location Blocks
Rules that match URL patterns:
```nginx
location /api/v1/auth/ {
    proxy_pass http://auth_service/;  # Forward to auth servers
}
```

---

## 📁 File-by-File Explanation

### Root Level Files

#### `package.json` (Root)
```json
{
  "name": "conflux-microservices",
  "private": true,
  "workspaces": ["packages/*"],  // IMPORTANT: Tells Bun to look in packages/
  "scripts": {
    "install:all": "bun install && bun run install:services",
    "install:services": "bunx concurrently \"bun run install:auth\" ...",
    "build": "bun run build:services",
    "build:services": "bunx concurrently \"bun run build:auth\" ..."
  }
}
```

**Why needed:**
- `workspaces`: Allows shared dependencies and easier management
- `private: true`: Prevents accidental publishing
- Scripts: Run commands across all services

---

#### `docker-compose.yml` (Main Development)
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15  # Use official PostgreSQL 15
    environment:
      POSTGRES_DB: appointment_booking
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"  # Host port:Container port
    volumes:
      - postgres_data:/var/lib/postgresql/data  # Persist data
    healthcheck:  # Health check for dependency management
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  auth-service:
    build:
      context: .  # Build from root directory
      dockerfile: packages/auth-service/Dockerfile
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/appointment_booking
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-jwt-secret-change-in-production
      - NODE_ENV=development
    depends_on:
      postgres:
        condition: service_healthy  # Wait for postgres to be healthy
      redis:
        condition: service_healthy
    volumes:  # Code mounting for hot reload
      - ./packages/auth-service/src:/app/src
      - ./packages/shared:/app/shared
    command: bun --watch src/index.ts  # Hot reload in development
```

**Line-by-line explanation:**
- `version: '3.8'`: Docker Compose format version
- `services:`: Define containers
- `postgres:`: Service name
- `image: postgres:15`: Use existing PostgreSQL 15 image
- `environment:`: Environment variables inside container
- `ports: ["5432:5432"]`: Map host port 5432 to container port 5432
- `volumes: ["postgres_data:/var/lib/postgresql/data"]`: Persist database data
- `healthcheck`: Docker checks if container is healthy
- `depends_on: condition: service_healthy`: Only start auth-service when postgres is ready
- `volumes: ["./src:/app/src"]`: Map local files into container for live updates
- `command: bun --watch`: Restart automatically on file changes

---

### Infrastructure Files

#### `infrastructure/docker/docker-compose.dev.yml`
```yaml
version: '3.8'

services:
  auth-service:
    build:
      context: .
      dockerfile: packages/auth-service/Dockerfile.dev  # Development Dockerfile
    volumes:
      - ./packages/auth-service/src:/app/src
      - ./packages/shared:/app/shared
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
      - DEBUG=true
    command: bun --watch src/index.ts
    ports:
      - "9229:9229"  # Debug port for Node.js debugging

  adminer:
    image: adminer  # Database management UI
    ports:
      - "8080:8080"
    environment:
      - ADMINER_DEFAULT_SERVER=postgres
    depends_on:
      - postgres

  redis-commander:
    image: rediscommander/redis-commander:latest  # Redis GUI
    ports:
      - "8081:8081"
    environment:
      - REDIS_HOSTS=local:redis:6379
    depends_on:
      - redis
```

**Purpose:**
- Extends main docker-compose.yml with development-specific features
- Adds debugging ports
- Includes development tools (Adminer, Redis Commander)
- Override development settings

---

#### `infrastructure/docker/docker-compose.prod.yml`
```yaml
services:
  auth-service:
    build:
      context: .
      dockerfile: packages/auth-service/Dockerfile  # Production Dockerfile
    environment:
      - NODE_ENV=production
      - LOG_LEVEL=info
    deploy:
      replicas: 3  # Run 3 instances for load balancing
      resources:
        limits:
          memory: 256M  # Maximum memory
          cpus: '0.2'   # Maximum CPU
        reservations:
          memory: 128M  # Minimum guaranteed memory
          cpus: '0.1'   # Minimum guaranteed CPU
    restart: unless-stopped  # Auto-restart if crashes
```

**Purpose:**
- Production optimizations
- Multiple replicas for scaling
- Resource limits to prevent one service from consuming everything
- Auto-restart policies

---

### Nginx Configuration

#### `infrastructure/nginx/nginx.conf` (Development)
```nginx
events {
    worker_connections 1024;  # How many connections per worker
}

http {
    upstream auth_service {
        server auth-service:3001;  # Auth service container
    }

    upstream booking_service {
        server booking-service:3002;  # Booking service container
    }

    # Rate limiting: 10 requests per second per IP
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/s;

    server {
        listen 80;  # Listen on port 80
        server_name localhost;

        # Security headers
        add_header X-Frame-Options DENY;  # Prevent clickjacking
        add_header X-Content-Type-Options nosniff;  # Prevent MIME type sniffing

        # CORS headers
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type";

        # Auth service routes
        location /api/v1/auth/ {
            limit_req zone=auth burst=20 nodelay;  # Rate limit auth endpoints
            proxy_pass http://auth_service/;  # Forward to auth service
            proxy_set_header Host $host;  # Pass original host header
            proxy_set_header X-Real-IP $remote_addr;  # Pass real IP
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  # Pass forwarded IPs
            proxy_set_header X-Forwarded-Proto $scheme;  # Pass HTTP/HTTPS
        }

        # Health check endpoint
        location /health {
            access_log off;  # Don't log health checks
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
```

**Explanation of each section:**

1. **`events { worker_connections 1024; }`**
   - How many simultaneous connections Nginx can handle
   - More connections = more memory used

2. **`upstream auth_service`**
   - Group of servers that handle auth requests
   - Can have multiple servers for load balancing

3. **`limit_req_zone`**
   - Rate limiting configuration
   - `$binary_remote_addr`: IP address of client
   - `zone=api:10m`: Memory zone for tracking requests (10MB)
   - `rate=10r/s`: 10 requests per second

4. **`location /api/v1/auth/`**
   - Matches URLs starting with /api/v1/auth/
   - `proxy_pass`: Forwards request to upstream service
   - `proxy_set_header`: Passes important information to backend

---

### Service-Specific Files

#### `packages/auth-service/package.json`
```json
{
  "name": "@appointment-booking/auth-service",
  "version": "1.0.0",
  "main": "dist/index.js",  # Entry point for production
  "scripts": {
    "dev": "bun --watch src/index.ts",  # Development with hot reload
    "build": "bun build src/index.ts --target bun --minify --outdir ./dist",  # Build for production
    "start": "bun dist/index.js",  # Run production build
    "test": "bun test",
    "type-check": "tsc --noEmit",  # TypeScript check without output
    "lint": "eslint src --ext .ts",
    "lint:fix": "eslint src --ext .ts --fix"
  },
  "dependencies": {
    "elysia": "^1.4.21",  # Web framework
    "jsonwebtoken": "^9.0.2",  # JWT token handling
    "bcryptjs": "^2.4.3",  # Password hashing
    "zod": "^3.22.4"  # Runtime type validation
  }
}
```

**Why each dependency:**
- `elysia`: Fast web framework (like Express but faster)
- `jsonwebtoken`: Create and verify JWT tokens
- `bcryptjs`: Hash passwords securely
- `zod`: Validate data shapes at runtime

---

#### `packages/auth-service/Dockerfile`
```dockerfile
FROM oven/bun:latest AS base

# Install dependencies stage
FROM base AS install
WORKDIR /app
COPY package.json bun.lockb tsconfig.json ./
RUN bun install --frozen-lockfile  # Install dependencies

# Build stage
FROM base AS build
WORKDIR /app
COPY --from=install /app/node_modules ./node_modules  # Copy installed dependencies
COPY tsconfig.json ./
COPY src/ ./src/
RUN bun build ./src/index.ts --target bun --minify --outdir ./dist  # Build TypeScript

# Production runtime stage
FROM base AS runtime
WORKDIR /app
COPY --from=build /app/dist ./dist  # Copy built files
COPY package.json ./
COPY --from=install /app/node_modules ./node_modules  # Copy dependencies

# Security: Create non-root user
RUN addgroup --system --gid 1001 bun && \
    adduser --system --uid 1001 bun
USER bun

EXPOSE 3001
ENV NODE_ENV=production
CMD ["bun", "dist/index.js"]
```

**Multi-stage build explanation:**
1. **`FROM oven/bun:latest AS base`**: Base image with Bun installed
2. **`FROM base AS install`**: Stage for installing dependencies
3. **`FROM base AS build`**: Stage for building TypeScript to JavaScript
4. **`FROM base AS runtime`**: Final stage with only what's needed to run

**Benefits of multi-stage:**
- Smaller final image (doesn't include build tools)
- Better security (fewer tools in production)
- Faster deployment (smaller image to push/pull)

---

#### `packages/auth-service/Dockerfile.dev`
```dockerfile
FROM oven/bun:latest

WORKDIR /app

# Install dependencies
COPY package.json bun.lockb tsconfig.json ./
RUN bun install

# Copy source code
COPY src/ ./src/
COPY ../../shared ./shared

# Install curl for health checks
RUN apk add --no-cache curl

EXPOSE 3001
EXPOSE 9229  # Debug port
ENV NODE_ENV=development
CMD ["bun", "--watch", "--inspect=0.0.0.0:9229", "src/index.ts"]
```

**Differences from production Dockerfile:**
- Single stage (no build optimization needed)
- Exposes debug port 9229
- Runs TypeScript directly with `--watch`
- Includes curl for debugging
- Mounts source code for live changes

---

#### `packages/auth-service/src/index.ts`
```typescript
import { Elysia } from 'elysia';

const app = new Elysia()
  .get('/health', () => ({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString()
  }))
  .get('/ready', () => ({
    status: 'ready',
    service: 'auth-service',
    timestamp: new Date().toISOString()
  }))
  .get('/api/v1/auth/test', () => ({
    message: 'Auth service is working',
    service: 'auth-service'
  }))
  .listen(3001);

console.log(`🚀 Auth service is running on port ${app.server?.port}`);
```

**Simple service structure:**
- `import { Elysia } from 'elysia'`: Import web framework
- `new Elysia()`: Create app instance
- `.get('/health', ...)`: Define GET endpoint
- `listen(3001)`: Start server on port 3001

---

### Shared Code

#### `packages/shared/types/index.ts`
```typescript
export interface User {
  id: string;
  email: string;
  businessId: string;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Appointment {
  id: string;
  businessId: string;
  serviceId: string;
  staffId: string;
  customerId: string;
  startTime: Date;
  endTime: Date;
  status: AppointmentStatus;
}

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
  NO_SHOW = 'no_show'
}
```

**Why shared types:**
- Consistent data structures across services
- TypeScript intellisense across the entire system
- Single source of truth for data contracts
- Prevents type mismatches between services

---

### Development Tools

#### `Makefile`
```makefile
.PHONY: up dev prod local down build clean install help

up:
	@echo "🚀 Starting development environment..."
	docker-compose up -d

dev:
	@echo "🔧 Starting enhanced development environment with hot reload..."
	docker-compose -f docker-compose.yml -f infrastructure/docker/docker-compose.dev.yml up

down:
	@echo "🛑 Stopping all services..."
	docker-compose down

build:
	@echo "🔨 Building all services..."
	docker-compose build

health:
	@echo "🏥 Checking service health..."
	@curl -s http://localhost/health || echo "❌ API Gateway not responding"
	@curl -s http://localhost:3001/health || echo "❌ Auth service not responding"
```

**Why Makefile:**
- Short, memorable commands instead of long docker-compose commands
- Consistent across team members
- Easy to remember common operations
- Prevents command mistakes

---

## 🏗️ Service Architecture

### Data Flow Example
```
Client Request → Nginx (port 80) → Auth Service (port 3001) → Database
                    ↓
                 Response ← Nginx ← Auth Service ← Database
```

### Service Communication
```typescript
// In booking-service, call auth-service
const response = await fetch('http://auth-service:3001/api/v1/auth/validate', {
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

**Why service names work:**
- Docker Compose creates a network
- Each service gets a DNS name equal to its service name
- `auth-service` resolves to the auth-service container's IP

---

## 📋 Step-by-Step Manual Setup

### Step 1: Root Setup

1. **Create root package.json**
```bash
# In project root
cat > package.json << 'EOF'
{
  "name": "conflux-microservices",
  "private": true,
  "workspaces": ["packages/*"],
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
EOF
```

2. **Install Bun dependencies**
```bash
bun install
```

### Step 2: Create Shared Types

1. **Create shared directory and types**
```bash
mkdir -p packages/shared/types
```

2. **Create type definitions**
```bash
cat > packages/shared/types/index.ts << 'EOF'
export interface User {
  id: string;
  email: string;
  businessId: string;
  roles: Role[];
  createdAt: Date;
  updatedAt: Date;
}

export enum Role {
  ADMIN = 'admin',
  STAFF = 'staff',
  CUSTOMER = 'customer'
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
EOF
```

### Step 3: Create Auth Service

1. **Create directory structure**
```bash
mkdir -p packages/auth-service/src
```

2. **Create package.json**
```bash
cat > packages/auth-service/package.json << 'EOF'
{
  "name": "@appointment-booking/auth-service",
  "version": "1.0.0",
  "main": "dist/index.js",
  "scripts": {
    "dev": "bun --watch src/index.ts",
    "build": "bun build src/index.ts --target bun --minify --outdir ./dist",
    "start": "bun dist/index.js"
  },
  "dependencies": {
    "elysia": "^1.4.21",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3"
  }
}
EOF
```

3. **Create tsconfig.json**
```bash
cat > packages/auth-service/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF
```

4. **Create Dockerfile**
```bash
cat > packages/auth-service/Dockerfile << 'EOF'
FROM oven/bun:latest AS base

FROM base AS install
WORKDIR /app
COPY package.json bun.lockb tsconfig.json ./
RUN bun install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=install /app/node_modules ./node_modules
COPY tsconfig.json ./
COPY src/ ./src/
RUN bun build ./src/index.ts --target bun --minify --outdir ./dist

FROM base AS runtime
WORKDIR /app
COPY --from=build /app/dist ./
COPY package.json ./
COPY --from=install /app/node_modules ./node_modules

RUN addgroup --system --gid 1001 bun && \
    adduser --system --uid 1001 bun
USER bun

EXPOSE 3001
CMD ["bun", "dist/index.js"]
EOF
```

5. **Create source code**
```bash
cat > packages/auth-service/src/index.ts << 'EOF'
import { Elysia } from 'elysia';

const app = new Elysia()
  .get('/health', () => ({
    status: 'healthy',
    service: 'auth-service',
    timestamp: new Date().toISOString()
  }))
  .get('/api/v1/auth/test', () => ({
    message: 'Auth service is working',
    service: 'auth-service'
  }))
  .listen(3001);

console.log(`🚀 Auth service is running on port ${app.server?.port}`);
EOF
```

### Step 4: Create Docker Compose

1. **Create main docker-compose.yml**
```bash
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: appointment_booking
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  auth-service:
    build:
      context: .
      dockerfile: packages/auth-service/Dockerfile
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/appointment_booking
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=development
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./packages/auth-service/src:/app/src
      - ./packages/shared:/app/shared
    command: bun --watch src/index.ts

volumes:
  postgres_data:
  redis_data:
EOF
```

### Step 5: Create Nginx Configuration

1. **Create nginx directory and config**
```bash
mkdir -p infrastructure/nginx
```

2. **Create nginx.conf**
```bash
cat > infrastructure/nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream auth_service {
        server auth-service:3001;
    }

    server {
        listen 80;
        server_name localhost;

        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type";

        location /api/v1/auth/ {
            proxy_pass http://auth_service/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF
```

3. **Add nginx to docker-compose.yml**
```bash
# Add to docker-compose.yml services section:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - auth-service
```

### Step 6: Create Makefile

```bash
cat > Makefile << 'EOF'
.PHONY: up down build health

up:
	@echo "🚀 Starting development environment..."
	docker-compose up -d

down:
	@echo "🛑 Stopping all services..."
	docker-compose down

build:
	@echo "🔨 Building all services..."
	docker-compose build

health:
	@echo "🏥 Checking service health..."
	@curl -s http://localhost/health || echo "❌ API Gateway not responding"
	@curl -s http://localhost:3001/health || echo "❌ Auth service not responding"

help:
	@echo "Available commands:"
	@echo "  up     - Start development environment"
	@echo "  down   - Stop all services"
	@echo "  build  - Build Docker images"
	@echo "  health - Check service health"
EOF
```

### Step 7: Test the Setup

1. **Install dependencies**
```bash
bun install
cd packages/auth-service && bun install && cd ../..
```

2. **Build and start**
```bash
make build
make up
```

3. **Check health**
```bash
make health
```

4. **Test endpoints**
```bash
curl http://localhost/health
curl http://localhost/api/v1/auth/test
curl http://localhost:3001/health
```

---

## 🔍 Common Issues & Solutions

### Docker Issues

**Problem: "Cannot connect to Docker daemon"**
- Solution: Start Docker Desktop or Docker service
- Mac: Open Docker Desktop application
- Linux: `sudo systemctl start docker`

**Problem: Port conflicts**
- Solution: Change port mappings in docker-compose.yml
- Example: Change `"3001:3001"` to `"3011:3001"`

**Problem: Build fails with "permission denied"**
- Solution: Fix file permissions
- `sudo chown -R $USER:$USER .`

### Nginx Issues

**Problem: 502 Bad Gateway**
- Solution: Check if backend service is running
- Check service logs: `docker-compose logs auth-service`

**Problem: CORS errors**
- Solution: Add CORS headers to nginx.conf
- Ensure `Access-Control-Allow-Origin` is set correctly

### Development Issues

**Problem: Changes not reflected**
- Solution: Check volume mounts in docker-compose.yml
- Verify `volumes:` section has correct paths

**Problem: TypeScript errors**
- Solution: Check tsconfig.json paths
- Run `bun run type-check` to debug

---

## 🎯 Next Steps

1. **Add more services** following the same pattern
2. **Add database schemas** using Prisma or Drizzle
3. **Add authentication logic** with JWT tokens
4. **Add API endpoints** for booking, availability, etc.
5. **Add testing** with Bun test
6. **Add CI/CD** with GitHub Actions
7. **Add monitoring** with logs and metrics

---

## 📚 Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Elysia Documentation](https://elysiajs.com/)
- [Bun Documentation](https://bun.sh/docs)

This documentation should give you everything you need to understand and recreate the microservices setup step by step! 🚀