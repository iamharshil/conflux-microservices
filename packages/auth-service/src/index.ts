import { Elysia } from "elysia";

const app = new Elysia()
	.get("/health", () => ({
		status: "healthy",
		service: "auth-service",
		timestamp: new Date().toISOString(),
	}))
	.get("/ready", () => ({
		status: "ready",
		service: "auth-service",
		timestamp: new Date().toISOString(),
	}))
	.get("/api/v1/auth/test", () => ({
		message: "Auth service is working!",
		service: "auth-service",
	}))
	.listen(3001);

console.log(`🚀 Auth service is running on port ${app.server?.port}`);