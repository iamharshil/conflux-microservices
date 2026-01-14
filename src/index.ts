import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "./lib/auth";
import logger from "./utils/logger";
import env from "./config/env";

// Create the better-auth middleware with session macro
const betterAuthPlugin = new Elysia({ name: "better-auth" })
    .mount(auth.handler)
    .macro({
        auth: {
            async resolve({ status, request: { headers } }) {
                const session = await auth.api.getSession({ headers });

                if (!session) {
                    return status(401);
                }

                return {
                    user: session.user,
                    session: session.session,
                };
            },
        },
    });

// Create the main Elysia app
const app = new Elysia()
    // Enable CORS
    .use(
        cors({
            origin: ["http://localhost:3000", "http://localhost:3001"],
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
            credentials: true,
            allowedHeaders: ["Content-Type", "Authorization"],
        })
    )
    // Mount better-auth plugin
    .use(betterAuthPlugin)
    // Health check endpoint
    .get("/health", () => ({
        status: "ok",
        timestamp: new Date().toISOString(),
    }))
    // Protected route example - get current user
    .get(
        "/api/me",
        ({ user, session }) => ({
            user,
            session,
        }),
        { auth: true }
    )
    // Start the server
    .listen(env.PORT || 3000);

logger.info(
    `🦊 Elysia server is running at ${app.server?.hostname}:${app.server?.port}`
);
logger.info(`📦 Auth endpoints available at /api/auth/*`);
logger.info(`🔐 Protected endpoint example: GET /api/me`);

export type App = typeof app;
