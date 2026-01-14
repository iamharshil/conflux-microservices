import { config } from "dotenv-safe";

config({
    example: ".env.example",
});

const env = {
    PORT: process.env.PORT || "5000",
    NODE_ENV: process.env.NODE_ENV || "development",
}

export default env;