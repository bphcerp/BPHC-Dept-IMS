import { defineConfig } from "drizzle-kit";
import { CONFIG_PG } from "@/config/environment";

export default defineConfig({
    dialect: "postgresql",
    schema: "./src/lib/db/schema/*",
    dbCredentials: CONFIG_PG,
});
