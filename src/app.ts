import cors from "@elysiajs/cors";
import { Elysia } from "elysia";

const app = new Elysia().use(cors());

export default app;