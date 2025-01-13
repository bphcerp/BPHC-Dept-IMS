import { z } from "zod";

const serverSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
    DB_HOST: z.string().min(1),
    POSTGRES_USER: z.string().min(1),
    POSTGRES_PASSWORD: z.string().min(1),
    POSTGRES_DB: z.string().min(1),
    PGPORT: z.coerce.number().default(5432),
    SERVER_URL: z.string().url().min(1),
    FRONTEND_URL: z.string().url().min(1),
    SERVER_PORT: z.coerce.number().default(9000),
    GOOGLE_CLIENT_ID: z
        .string()
        .regex(/^\d+-[a-z0-9]+\.apps\.googleusercontent\.com$/),
    ACCESS_TOKEN_SECRET: z.string().min(1),
    REFRESH_TOKEN_SECRET: z.string().min(1),
    LOG_LEVEL: z
        .enum(["silent", "fatal", "error", "warn", "info", "debug", "trace"])
        .default("debug"),
});

const parsed = serverSchema.parse(process.env);

export const PROD = parsed.NODE_ENV === "production";
export const REFRESH_TOKEN_COOKIE = "amogus";
export const ACCESS_TOKEN_EXPIRY = "5m";
export const REFRESH_TOKEN_EXPIRY = "7d";

export default {
    PROD,
    REFRESH_TOKEN_COOKIE,
    ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY,
    ...parsed,
};
