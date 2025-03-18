import { defineConfig } from "drizzle-kit";
import env from "@/config/environment.ts";

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/config/db/schema/*",
    dbCredentials: {
        database: env.POSTGRES_DB,
        user: env.POSTGRES_USER,
        password: env.POSTGRES_PASSWORD,
        host: env.DB_HOST,
        port: env.PGPORT,
        ssl: false,
    },
});
