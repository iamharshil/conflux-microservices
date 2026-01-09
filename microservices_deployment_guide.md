# Microservices Deployment Guide

## Overview
Complete guide for deploying microservices architecture with Docker, Kubernetes, and Nginx. Supports independent deployment while maintaining monorepo structure.

## Repository Structure
```
appointment-booking-system/
├── packages/
│   ├── auth-service/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── bun.lockb
│   │   └── src/
│   ├── booking-service/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── bun.lockb
│   │   └── src/
│   ├── availability-service/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── bun.lockb
│   │   └── src/
│   ├── notification-service/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── bun.lockb
│   │   └── src/
│   ├── shared/
│   │   ├── types/
│   │   ├── utils/
│   │   └── database/
│   └── infrastructure/
│       ├── docker-compose.yml
│       ├── k8s/
│       └── nginx/
├── .github/
│   └── workflows/
├── docker-compose.yml
├── package.json
└── pnpm-workspace.yaml
```

## Docker Configuration

### Service Dockerfile Template
Each microservice has its own optimized Dockerfile:

```dockerfile
# packages/{service-name}/Dockerfile
FROM oven/bun:latest AS base

# Install dependencies
FROM base AS install
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Build application
FROM base AS build
WORKDIR /app
COPY --from=install /app/node_modules ./node_modules
COPY . .
RUN bun build --target bun --minify

# Production image
FROM base AS runtime
WORKDIR /app
COPY --from=build /app/out ./
COPY package.json ./

# Create non-root user
RUN addgroup --system --gid 1001 bun
RUN adduser --system --uid 1001 bun
USER bun

EXPOSE 3001
ENV NODE_ENV=production
CMD ["bun", "index.js"]
```

### Service-Specific Dockerfiles

#### Auth Service Dockerfile
```dockerfile
# packages/auth-service/Dockerfile
FROM oven/bun:latest AS base

FROM base AS install
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=install /app/node_modules ./node_modules
COPY . .
RUN bun build --target bun --minify

FROM base AS runtime
WORKDIR /app
COPY --from=build /app/out ./
COPY package.json ./

RUN addgroup --system --gid 1001 bun
RUN adduser --system --uid 1001 bun
USER bun

EXPOSE 3001
ENV NODE_ENV=production
CMD ["bun", "index.js"]
```

#### Booking Service Dockerfile
```dockerfile
# packages/booking-service/Dockerfile
FROM oven/bun:latest AS base

FROM base AS install
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=install /app/node_modules ./node_modules
COPY . .
RUN bun build --target bun --minify

FROM base AS runtime
WORKDIR /app
COPY --from=build /app/out ./
COPY package.json ./

RUN addgroup --system --gid 1001 bun
RUN adduser --system --uid 1001 bun
USER bun

EXPOSE 3002
ENV NODE_ENV=production
CMD ["bun", "index.js"]
```

#### Availability Service Dockerfile
```dockerfile
# packages/availability-service/Dockerfile
FROM oven/bun:latest AS base

FROM base AS install
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=install /app/node_modules ./node_modules
COPY . .
RUN bun build --target bun --minify

FROM base AS runtime
WORKDIR /app
COPY --from=build /app/out ./
COPY package.json ./

RUN addgroup --system --gid 1001 bun
USER bun

EXPOSE 3003
ENV NODE_ENV=production
CMD ["bun", "index.js"]
```

#### Notification Service Dockerfile
```dockerfile
# packages/notification-service/Dockerfile
FROM oven/bun:latest AS base

FROM base AS install
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

FROM base AS build
WORKDIR /app
COPY --from=install /app/node_modules ./node_modules
COPY . .
RUN bun build --target bun --minify

FROM base AS runtime
WORKDIR /app
COPY --from=build /app/out ./
COPY package.json ./

RUN addgroup --system --gid 1001 bun
USER bun

EXPOSE 3004
ENV NODE_ENV=production
CMD ["bun", "index.js"]
```

## Docker Compose (Development)

### Main Docker Compose File
```yaml
# docker-compose.yml
version: '3.8'

services:
  # Database
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

  # Redis Cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # Message Queue
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: password
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  # Auth Service
  auth-service:
    build:
      context: .
      dockerfile: packages/auth-service/Dockerfile
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/appointment_booking
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=your-jwt-secret
      - NODE_ENV=development
    depends_on:
      - postgres
      - redis
    volumes:
      - ./packages/auth-service:/app
      - /app/node_modules
    command: bun --watch src/index.ts

  # Booking Service
  booking-service:
    build:
      context: .
      dockerfile: packages/booking-service/Dockerfile
    ports:
      - "3002:3002"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/appointment_booking
      - REDIS_URL=redis://redis:6379
      - AUTH_SERVICE_URL=http://auth-service:3001
      - NODE_ENV=development
    depends_on:
      - postgres
      - redis
      - auth-service
    volumes:
      - ./packages/booking-service:/app
      - /app/node_modules
    command: bun --watch src/index.ts

  # Availability Service
  availability-service:
    build:
      context: .
      dockerfile: packages/availability-service/Dockerfile
    ports:
      - "3003:3003"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/appointment_booking
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=development
    depends_on:
      - postgres
      - redis
    volumes:
      - ./packages/availability-service:/app
      - /app/node_modules
    command: bun --watch src/index.ts

  # Notification Service
  notification-service:
    build:
      context: .
      dockerfile: packages/notification-service/Dockerfile
    ports:
      - "3004:3004"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/appointment_booking
      - RABBITMQ_URL=amqp://admin:password@rabbitmq:5672
      - SENDGRID_API_KEY=your-sendgrid-key
      - TWILIO_ACCOUNT_SID=your-twilio-sid
      - NODE_ENV=development
    depends_on:
      - postgres
      - rabbitmq
    volumes:
      - ./packages/notification-service:/app
      - /app/node_modules
    command: bun --watch src/index.ts

  # Nginx API Gateway
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./packages/infrastructure/nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./packages/infrastructure/nginx/ssl:/etc/nginx/ssl
    depends_on:
      - auth-service
      - booking-service
      - availability-service
      - notification-service

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
```

### Development Docker Compose
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  auth-service:
    build:
      context: .
      dockerfile: packages/auth-service/Dockerfile
    environment:
      - NODE_ENV=development
    volumes:
      - ./packages/auth-service:/app
      - /app/node_modules
    command: bun --watch src/index.ts

  booking-service:
    build:
      context: .
      dockerfile: packages/booking-service/Dockerfile
    environment:
      - NODE_ENV=development
    volumes:
      - ./packages/booking-service:/app
      - /app/node_modules
    command: bun --watch src/index.ts

  # ... other services
```

## Nginx Configuration

### Main Nginx Configuration
```nginx
# packages/infrastructure/nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream auth_service {
        server auth-service:3001;
    }

    upstream booking_service {
        server booking-service:3002;
    }

    upstream availability_service {
        server availability-service:3003;
    }

    upstream notification_service {
        server notification-service:3004;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    server {
        listen 80;
        server_name localhost;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";

        # CORS
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type";

        # Auth service routes
        location /api/v1/auth/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://auth_service/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeouts
            proxy_connect_timeout 5s;
            proxy_send_timeout 10s;
            proxy_read_timeout 10s;
        }

        # Booking service routes
        location /api/v1/appointments/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://booking_service/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            proxy_connect_timeout 5s;
            proxy_send_timeout 10s;
            proxy_read_timeout 10s;
        }

        # Availability service routes
        location /api/v1/availability/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://availability_service/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            proxy_connect_timeout 5s;
            proxy_send_timeout 10s;
            proxy_read_timeout 10s;
        }

        # Notification service routes
        location /api/v1/notifications/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://notification_service/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            proxy_connect_timeout 5s;
            proxy_send_timeout 10s;
            proxy_read_timeout 10s;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # OPTIONS handling for CORS
        location ~* "(.)" {
            if ($request_method = OPTIONS) {
                add_header Access-Control-Allow-Origin "*";
                add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
                add_header Access-Control-Allow-Headers "Authorization, Content-Type";
                add_header Content-Length 0;
                add_header Content-Type text/plain;
                return 204;
            }
        }
    }
}
```

### Production Nginx Configuration
```nginx
# packages/infrastructure/nginx/nginx.prod.conf
events {
    worker_connections 2048;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Upstream servers with load balancing
    upstream auth_service {
        least_conn;
        server auth-service-1:3001 max_fails=3 fail_timeout=30s;
        server auth-service-2:3001 max_fails=3 fail_timeout=30s;
    }

    upstream booking_service {
        least_conn;
        server booking-service-1:3002 max_fails=3 fail_timeout=30s;
        server booking-service-2:3002 max_fails=3 fail_timeout=30s;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        # Rate limiting
        limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;
        limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/s;

        # Auth service with stricter rate limiting
        location /api/v1/auth/ {
            limit_req zone=auth burst=20 nodelay;
            proxy_pass http://auth_service/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Other services
        location /api/v1/appointments/ {
            limit_req zone=api burst=100 nodelay;
            proxy_pass http://booking_service/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

## Kubernetes Deployment

### Namespace Configuration
```yaml
# packages/infrastructure/k8s/namespace.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: appointment-booking
```

### Auth Service Kubernetes
```yaml
# packages/infrastructure/k8s/auth-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: appointment-booking
  labels:
    app: auth-service
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
        version: v1
    spec:
      containers:
      - name: auth-service
        image: your-registry/auth-service:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: auth-secret
              key: jwt-secret
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: appointment-booking
  labels:
    app: auth-service
spec:
  selector:
    app: auth-service
  ports:
  - name: http
    port: 3001
    targetPort: 3001
    protocol: TCP
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: auth-service-hpa
  namespace: appointment-booking
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: auth-service
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Booking Service Kubernetes
```yaml
# packages/infrastructure/k8s/booking-service.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: booking-service
  namespace: appointment-booking
  labels:
    app: booking-service
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: booking-service
  template:
    metadata:
      labels:
        app: booking-service
        version: v1
    spec:
      containers:
      - name: booking-service
        image: your-registry/booking-service:latest
        ports:
        - containerPort: 3002
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        - name: AUTH_SERVICE_URL
          value: "http://auth-service:3001"
        - name: NODE_ENV
          value: "production"
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "400m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3002
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3002
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: booking-service
  namespace: appointment-booking
  labels:
    app: booking-service
spec:
  selector:
    app: booking-service
  ports:
  - name: http
    port: 3002
    targetPort: 3002
    protocol: TCP
  type: ClusterIP
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: booking-service-hpa
  namespace: appointment-booking
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: booking-service
  minReplicas: 3
  maxReplicas: 15
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Ingress Configuration
```yaml
# packages/infrastructure/k8s/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: appointment-booking-ingress
  namespace: appointment-booking
  annotations:
    kubernetes.io/ingress.class: nginx
    nginx.ingress.kubernetes.io/rewrite-target: /
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  tls:
  - hosts:
    - api.your-domain.com
    secretName: api-tls
  rules:
  - host: api.your-domain.com
    http:
      paths:
      - path: /api/v1/auth
        pathType: Prefix
        backend:
          service:
            name: auth-service
            port:
              number: 3001
      - path: /api/v1/appointments
        pathType: Prefix
        backend:
          service:
            name: booking-service
            port:
              number: 3002
      - path: /api/v1/availability
        pathType: Prefix
        backend:
          service:
            name: availability-service
            port:
              number: 3003
      - path: /api/v1/notifications
        pathType: Prefix
        backend:
          service:
            name: notification-service
            port:
              number: 3004
```

## CI/CD Pipeline

### Auth Service Deployment
```yaml
# .github/workflows/deploy-auth.yml
name: Deploy Auth Service

on:
  push:
    paths: ['packages/auth-service/**']
    branches: [main]

env:
  REGISTRY: your-registry.com
  IMAGE_NAME: auth-service

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - name: Install dependencies
        run: bun install
        working-directory: packages/auth-service
      - name: Run tests
        run: bun test
        working-directory: packages/auth-service

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          file: packages/auth-service/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Configure kubectl
        uses: azure/k8s-set-context@v1
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG }}
      - name: Deploy to Kubernetes
        run: |
          kubectl apply -f packages/infrastructure/k8s/auth-service.yaml
          kubectl rollout status deployment/auth-service -n appointment-booking
```

### Booking Service Deployment
```yaml
# .github/workflows/deploy-booking.yml
name: Deploy Booking Service

on:
  push:
    paths: ['packages/booking-service/**']
    branches: [main]

env:
  REGISTRY: your-registry.com
  IMAGE_NAME: booking-service

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: oven-sh/setup-bun@v1
      - name: Install dependencies
        run: bun install
        working-directory: packages/booking-service
      - name: Run tests
        run: bun test
        working-directory: packages/booking-service

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          file: packages/booking-service/Dockerfile
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Configure kubectl
        uses: azure/k8s-set-context@v1
        with:
          method: kubeconfig
          kubeconfig: ${{ secrets.KUBE_CONFIG }}
      - name: Deploy to Kubernetes
        run: |
          kubectl apply -f packages/infrastructure/k8s/booking-service.yaml
          kubectl rollout status deployment/booking-service -n appointment-booking
```

## Service Discovery

### Docker Compose Service Names
Services can communicate using Docker Compose service names:
```typescript
// In booking-service, call auth-service:
const response = await fetch('http://auth-service:3001/auth/validate', {
  headers: { Authorization: token }
});
```

### Kubernetes Service Names
Services communicate using Kubernetes DNS:
```typescript
// In booking-service, call auth-service:
const response = await fetch('http://auth-service.appointment-booking.svc.cluster.local:3001/auth/validate', {
  headers: { Authorization: token }
});
```

### Environment Configuration
```typescript
// Service configuration
const config = {
  authUrl: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  databaseUrl: process.env.DATABASE_URL,
  redisUrl: process.env.REDIS_URL
};
```

## Deployment Commands

### Development
```bash
# Start all services
docker-compose up -d

# Start specific service
docker-compose up -d auth-service

# View logs
docker-compose logs -f auth-service

# Stop services
docker-compose down
```

### Production
```bash
# Deploy all services
kubectl apply -f packages/infrastructure/k8s/

# Deploy specific service
kubectl apply -f packages/infrastructure/k8s/auth-service.yaml

# Check deployment status
kubectl get deployments -n appointment-booking
kubectl get pods -n appointment-booking
kubectl get services -n appointment-booking

# View logs
kubectl logs -f deployment/auth-service -n appointment-booking
```

## Monitoring and Health Checks

### Health Check Endpoints
Each service should implement health check endpoints:
```typescript
// packages/shared/health.ts
export const healthRoutes = new Elysia()
  .get('/health', () => ({ status: 'healthy', timestamp: new Date().toISOString() }))
  .get('/ready', async () => {
    // Check database connection
    const dbConnected = await checkDatabase();
    // Check Redis connection
    const redisConnected = await checkRedis();
    
    return {
      status: dbConnected && redisConnected ? 'ready' : 'not ready',
      database: dbConnected,
      redis: redisConnected
    };
  });
```

### Monitoring Configuration
```yaml
# Prometheus monitoring
apiVersion: v1
kind: ServiceMonitor
metadata:
  name: auth-service-monitor
  namespace: appointment-booking
spec:
  selector:
    matchLabels:
      app: auth-service
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
```

## Best Practices

### 1. Security
- Use non-root users in containers
- Implement proper secrets management
- Use HTTPS in production
- Implement rate limiting

### 2. Performance
- Optimize Docker image sizes
- Use multi-stage builds
- Implement proper caching
- Configure resource limits

### 3. Reliability
- Implement health checks
- Use proper logging
- Configure graceful shutdown
- Implement retry logic

### 4. Scalability
- Use horizontal pod autoscaling
- Implement proper load balancing
- Configure resource requests/limits
- Use cluster autoscaling

This deployment guide provides a complete foundation for deploying microservices independently while maintaining the benefits of a monorepo structure.