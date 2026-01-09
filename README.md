# Appointment Booking Microservices

A scalable, business-agnostic appointment booking platform built with Bun, Elysia, TypeScript, and Docker microservices architecture.

## 🏗️ Architecture

### Services
- **auth-service** (port 3001) - Authentication & authorization
- **booking-service** (port 3002) - Core appointment booking logic  
- **availability-service** (port 3003) - Staff availability management
- **notification-service** (port 3004) - Email/SMS notifications

### Infrastructure
- **nginx** (port 80/443) - API Gateway & load balancing
- **postgres** (port 5432) - Primary database
- **redis** (port 6379) - Caching & sessions
- **rabbitmq** (ports 5672/15672) - Message queue

## 🚀 Quick Start

### Prerequisites
- Bun runtime
- Docker & Docker Compose
- Make (optional, for convenience commands)

### Development Setup

1. **Install dependencies**
```bash
make install
# or
bun run install:all
```

2. **Start development environment**
```bash
make dev
# or
docker-compose up
```

3. **Access services**
- API Gateway: http://localhost
- Auth Service: http://localhost:3001
- Booking Service: http://localhost:3002
- Availability Service: http://localhost:3003
- Notification Service: http://localhost:3004

### Make Commands

```bash
# Development
make up          # Start basic dev environment
make dev         # Start with hot reload
make local       # Start with personal overrides
make prod        # Production-like environment

# Individual Services
make auth        # Start only auth service
make booking     # Start only booking service
make availability # Start only availability service
make notifications # Start only notification service

# Utilities
make logs        # View all logs
make health      # Check service health
make build       # Build Docker images
make clean       # Clean up containers
make db-reset    # Reset database
make help        # Show all commands
```

## 📁 Project Structure

```
appointment-booking-system/
├── packages/                    # Microservices
│   ├── auth-service/           # Authentication service
│   ├── booking-service/        # Booking management
│   ├── availability-service/  # Availability management
│   ├── notification-service/  # Notifications
│   └── shared/                # Shared types & utilities
├── infrastructure/             # Infrastructure config
│   ├── docker/                # Docker compose files
│   ├── nginx/                 # Nginx configuration
│   └── k8s/                   # Kubernetes manifests
├── docker-compose.yml          # Main development setup
├── Makefile                   # Convenience commands
└── package.json              # Workspace configuration
```

## 🔧 Development Workflow

### 1. Service Development
Each service is independently developable:
```bash
cd packages/auth-service
bun install
bun run dev          # Hot reload development
bun run build        # Build for production
bun run test         # Run tests
```

### 2. Hot Reload
Services automatically reload on file changes when using:
```bash
make dev
# or
docker-compose -f docker-compose.yml -f infrastructure/docker/docker-compose.dev.yml up
```

### 3. Service Communication
Services communicate via HTTP through Nginx gateway:
```typescript
// Example: Auth service calling Booking service
const response = await fetch('http://booking-service/appointments', {
  headers: { Authorization: `Bearer ${token}` }
});
```

## 🌐 API Routes

### Auth Service (3001)
- `GET /health` - Health check
- `GET /api/v1/auth/test` - Test endpoint

### Booking Service (3002)
- `GET /health` - Health check
- `GET /api/v1/appointments/test` - Test endpoint

### Availability Service (3003)
- `GET /health` - Health check
- `GET /api/v1/availability/test` - Test endpoint

### Notification Service (3004)
- `GET /health` - Health check
- `GET /api/v1/notifications/test` - Test endpoint

### API Gateway (80)
- Routes all `/api/v1/*` requests to appropriate services
- Handles CORS, rate limiting, and load balancing
- `GET /health` - Overall system health

## 🏃‍♂️ Running in Production

### Production Configuration
```bash
# Build production images
make build

# Start production environment
make prod
# or
docker-compose -f infrastructure/docker/docker-compose.prod.yml up
```

### Kubernetes Deployment
```bash
# Deploy to Kubernetes
kubectl apply -f infrastructure/k8s/
```

## 🔍 Monitoring & Debugging

### Health Checks
```bash
make health
# Check all service health endpoints
```

### Logs
```bash
make logs              # All services
make logs-auth         # Auth service only
make logs-booking      # Booking service only
```

### Development Tools
```bash
make dev-tools         # Adminer (8080), Redis Commander (8081)
```

## 📊 Technology Stack

- **Runtime**: Bun (JavaScript/TypeScript)
- **Framework**: Elysia (web framework)
- **Language**: TypeScript
- **Containerization**: Docker
- **Orchestration**: Docker Compose / Kubernetes
- **API Gateway**: Nginx
- **Database**: PostgreSQL
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **Package Manager**: Bun workspaces

## 🔒 Security Features

- JWT-based authentication
- Rate limiting (API Gateway)
- CORS configuration
- Non-root Docker containers
- Environment-based secrets

## 🚀 Performance Features

- Multi-stage Docker builds
- Nginx load balancing
- Redis caching
- Connection pooling
- Gzip compression
- HTTP/2 support

## 🧪 Testing

```bash
# Run all tests
make test

# Test individual service
cd packages/auth-service && bun test
```

## 📝 Development Notes

- Each service has its own `package.json` and dependencies
- Shared types and utilities are in `packages/shared/`
- Services communicate via HTTP through Nginx
- Database connections are managed per service
- Hot reload works in development with volume mounts

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Run tests: `make test`
4. Run linting: `make lint`
5. Submit a pull request

## 📄 Documentation

- [Microservices Architecture](./microservices_architecture.md)
- [Deployment Guide](./microservices_deployment_guide.md)

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Make sure ports 80, 3001-3004, 5432, 6379, 5672 are available
2. **Permission issues**: Run with `sudo` if needed for Docker
3. **Build failures**: Ensure Bun is installed and up to date
4. **Service not starting**: Check logs with `make logs`

### Health Check Issues
If services aren't healthy:
1. Check individual service logs
2. Verify database is running: `docker ps`
3. Check network connectivity
4. Restart services: `make down && make up`

---

Built with ❤️ using Bun, Elysia, and TypeScript
 No newline at end of file
