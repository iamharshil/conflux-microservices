.PHONY: up dev prod local down build clean install help

# Development commands
up:
	@echo "🚀 Starting development environment..."
	docker-compose up -d

dev:
	@echo "🔧 Starting enhanced development environment with hot reload..."
	docker-compose -f docker-compose.yml -f infrastructure/docker/docker-compose.dev.yml up

local:
	@echo "🏠 Starting local development with personal overrides..."
	docker-compose -f docker-compose.yml -f infrastructure/docker/docker-compose.local.yml up

prod:
	@echo "🚀 Starting production-like environment..."
	docker-compose -f infrastructure/docker/docker-compose.prod.yml up

down:
	@echo "🛑 Stopping all services..."
	docker-compose down

build:
	@echo "🔨 Building all services..."
	docker-compose build

clean:
	@echo "🧹 Cleaning up containers and volumes..."
	docker-compose down -v
	docker system prune -f

# Individual service commands
auth:
	@echo "🔐 Starting auth service..."
	docker-compose up auth-service

booking:
	@echo "📅 Starting booking service..."
	docker-compose up booking-service

availability:
	@echo "🕐 Starting availability service..."
	docker-compose up availability-service

notifications:
	@echo "📧 Starting notification service..."
	docker-compose up notification-service

logs:
	@echo "📋 Showing logs for all services..."
	docker-compose logs -f

logs-auth:
	@echo "🔐 Showing auth service logs..."
	docker-compose logs -f auth-service

logs-booking:
	@echo "📅 Showing booking service logs..."
	docker-compose logs -f booking-service

logs-availability:
	@echo "🕐 Showing availability service logs..."
	docker-compose logs -f availability-service

logs-notifications:
	@echo "📧 Showing notification service logs..."
	docker-compose logs -f notification-service

# Database commands
db-reset:
	@echo "🗄️ Resetting database..."
	docker-compose down postgres
	docker volume rm conflux-microservices_postgres_data
	docker-compose up -d postgres

db-backup:
	@echo "💾 Creating database backup..."
	docker-compose exec postgres pg_dump -U postgres appointment_booking > backup.sql

# Development tools
dev-tools:
	@echo "🛠️ Starting development tools..."
	docker-compose -f infrastructure/docker/docker-compose.dev.yml up adminer redis-commander

# Health check
health:
	@echo "🏥 Checking service health..."
	@curl -s http://localhost/health || echo "❌ API Gateway not responding"
	@curl -s http://localhost:3001/health || echo "❌ Auth service not responding"
	@curl -s http://localhost:3002/health || echo "❌ Booking service not responding"
	@curl -s http://localhost:3003/health || echo "❌ Availability service not responding"
	@curl -s http://localhost:3004/health || echo "❌ Notification service not responding"

# Install dependencies for all services
install:
	@echo "📦 Installing dependencies for all services..."
	@cd packages/auth-service && bun install
	@cd ../booking-service && bun install
	@cd ../availability-service && bun install
	@cd ../notification-service && bun install
	@cd .. && bun install

# Build TypeScript for all services
build-ts:
	@echo "🔨 Building TypeScript for all services..."
	@cd packages/auth-service && bun run build
	@cd ../booking-service && bun run build
	@cd ../availability-service && bun run build
	@cd ../notification-service && bun run build

# Run tests for all services
test:
	@echo "🧪 Running tests for all services..."
	@cd packages/auth-service && bun test || true
	@cd ../booking-service && bun test || true
	@cd ../availability-service && bun test || true
	@cd ../notification-service && bun test || true

# Lint all services
lint:
	@echo "🔍 Linting all services..."
	@cd packages/auth-service && bun run lint || true
	@cd ../booking-service && bun run lint || true
	@cd ../availability-service && bun run lint || true
	@cd ../notification-service && bun run lint || true

# Help
help:
	@echo "📚 Available commands:"
	@echo ""
	@echo "Development:"
	@echo "  up          - Start basic development environment"
	@echo "  dev         - Start enhanced development with hot reload"
	@echo "  local       - Start with personal overrides"
	@echo "  prod        - Start production-like environment"
	@echo "  down        - Stop all services"
	@echo ""
	@echo "Individual Services:"
	@echo "  auth        - Start only auth service"
	@echo "  booking     - Start only booking service"
	@echo "  availability - Start only availability service"
	@echo "  notifications - Start only notification service"
	@echo ""
	@echo "Utilities:"
	@echo "  logs        - Show logs for all services"
	@echo "  health      - Check health of all services"
	@echo "  install     - Install dependencies for all services"
	@echo "  build       - Build Docker images"
	@echo "  build-ts    - Build TypeScript for all services"
	@echo "  test        - Run tests for all services"
	@echo "  lint        - Lint all services"
	@echo "  db-reset    - Reset database"
	@echo "  db-backup   - Create database backup"
	@echo "  dev-tools   - Start development tools (adminer, redis-commander)"
	@echo "  clean       - Clean up containers and volumes"
	@echo "  help        - Show this help message"