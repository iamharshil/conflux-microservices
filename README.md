# Conflux Microservices

A modern, type-safe authentication backend built with **Bun**, **Elysia**, **Prisma 7**, **NeonDB**, and **Better-Auth**.

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [Bun](https://bun.sh) | JavaScript runtime & package manager |
| [Elysia](https://elysiajs.com) | Fast, type-safe web framework |
| [Prisma 7](https://prisma.io) | Next-gen ORM with TypeScript engine |
| [NeonDB](https://neon.tech) | Serverless PostgreSQL |
| [Better-Auth](https://better-auth.com) | Authentication library |

## Features

- ✅ Email/Password authentication
- ✅ Session-based auth with secure cookies
- ✅ Protected route middleware (macro pattern)
- ✅ Neon serverless driver for optimal performance
- ✅ Hot reload in development
- ✅ TypeScript throughout

---

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) installed
- [NeonDB](https://neon.tech) account with a database

### 1. Clone & Install

```bash
git clone <repository-url>
cd conflux-microservices
bun install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# NeonDB Connection (use pooled connection string)
DATABASE_URL=postgresql://user:password@ep-xxx-pooler.region.aws.neon.tech/dbname?sslmode=require

# Better Auth (generate secret with: openssl rand -base64 32)
BETTER_AUTH_SECRET=your-32-character-secret-here
BETTER_AUTH_URL=http://localhost:3000

# Server
PORT=3000
NODE_ENV=development
```

### 3. Push Database Schema

```bash
bun run db:push
```

### 4. Start Development Server

```bash
bun run dev
```

Server runs at `http://localhost:3000`

---

## API Reference

### Authentication Endpoints

All auth endpoints are mounted at `/api/auth/*` by Better-Auth.

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/sign-up/email` | `{name, email, password}` | Register new user |
| POST | `/api/auth/sign-in/email` | `{email, password}` | Login user |
| POST | `/api/auth/sign-out` | - | Logout (clear session) |
| GET | `/api/auth/get-session` | - | Get current session |

### Application Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| GET | `/health` | No | Health check |
| GET | `/api/me` | Yes | Get current user |

---

## Usage Examples

### Sign Up

```bash
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

### Sign In

```bash
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }' \
  -c cookies.txt
```

### Access Protected Route

```bash
curl http://localhost:3000/api/me -b cookies.txt
```

### Sign Out

```bash
curl -X POST http://localhost:3000/api/auth/sign-out -b cookies.txt
```

---

## Project Structure

```
conflux-microservices/
├── src/
│   ├── index.ts              # Elysia server & routes
│   ├── lib/
│   │   ├── auth.ts           # Better-Auth configuration
│   │   └── db.ts             # Prisma client + Neon adapter
│   └── generated/prisma/     # Generated Prisma client
├── prisma/
│   └── schema.prisma         # Database schema
├── .env.example              # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server with hot reload |
| `bun run start` | Start production server |
| `bun run db:generate` | Generate Prisma client |
| `bun run db:push` | Push schema to database |
| `bun run db:migrate` | Run database migrations |
| `bun run db:studio` | Open Prisma Studio |

---

## Database Schema

The Prisma schema includes four core models required by Better-Auth:

- **User** - User accounts with email, name, profile
- **Session** - Active user sessions with tokens
- **Account** - OAuth provider accounts (for future use)
- **Verification** - Email verification tokens

---

## Adding Protected Routes

Use the `auth` macro to protect routes:

```typescript
import { Elysia } from "elysia";
import { betterAuthPlugin } from "./index"; // or your setup

const app = new Elysia()
  .use(betterAuthPlugin)
  // Public route
  .get("/public", () => "Anyone can access")
  // Protected route
  .get(
    "/protected",
    ({ user, session }) => ({
      message: "Authenticated!",
      user,
    }),
    { auth: true }
  );
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | NeonDB connection string (use `-pooler` suffix) |
| `BETTER_AUTH_SECRET` | Yes | Secret for encryption (min 32 chars) |
| `BETTER_AUTH_URL` | Yes | Base URL of your app |
| `PORT` | No | Server port (default: 3000) |
| `NODE_ENV` | No | Environment (development/production) |

---

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a secure `BETTER_AUTH_SECRET`
3. Update `BETTER_AUTH_URL` to your production domain
4. Update `trustedOrigins` in `src/lib/auth.ts`
5. Run: `bun run start`

---

## License

MIT
