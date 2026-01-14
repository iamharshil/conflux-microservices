import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import env from "@/config/env";

export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        // Minimum password length (default is 8)
        minPasswordLength: 8,
    },
    // Base URL for the auth endpoints
    baseURL: env.BETTER_AUTH_URL || "http://localhost:3000",
    // Trusted origins for CORS
    trustedOrigins: [
        "http://localhost:3000",
        "http://localhost:3001",
        // Add production origins here
    ],
    // Session configuration
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day (update session every day)
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // 5 minutes
        },
    },
    // Enable experimental joins for better performance
    experimental: {
        joins: true,
    },
});

export type Session = typeof auth.$Infer.Session.session;
export type User = typeof auth.$Infer.Session.user;
