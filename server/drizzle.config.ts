import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/config/db/schema/*",
    dbCredentials: {
        database: "postgres",
        user: "postgres",
        password: "postgres",
        host: "localhost",
        port: 5432,
        ssl: false,
    },
});
