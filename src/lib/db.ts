import { PrismaClient } from "../generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import env from "@/config/env";

// Configure WebSocket for Neon serverless driver
neonConfig.webSocketConstructor = ws;

// Create Prisma client with Neon adapter
const connectionString = env.DATABASE_URL;

const adapter = new PrismaNeon({ connectionString });

// Global declaration for development hot-reloading
declare global {
    var prisma: PrismaClient | undefined;
}

export const prisma = global.prisma || new PrismaClient({ adapter });

if (env.NODE_ENV !== "production") {
    global.prisma = prisma;
}

export default prisma;
