import { config } from "dotenv-safe";

config({
    example: ".env.example",
});

const env = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV || "development",
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
}

export default env;