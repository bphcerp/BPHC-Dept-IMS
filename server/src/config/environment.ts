import { z } from "zod";
import dotenv from "dotenv";
import path from "path";
import { type StringValue } from "ms";
// Trying to load .env if running outside docker and cwd is server
dotenv.config({
    path: path.resolve(process.cwd(), "../.env"),
});

const serverSchema = z.object({
    NODE_ENV: z
        .enum(["development", "test", "production"])
        .default("development"),
    DB_HOST: z.string().min(1),
    REDIS_HOST: z.string().min(1),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().min(1),
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
    BPHCERP_EMAIL: z.string(),
    BPHCERP_PASSWORD: z.string(),
    SERP_API_KEY: z.string(),
    DEPARTMENT_NAME: z.string(),
    DEPARTMENT_EMAIL: z.string().email().optional(),
});

const parsed = serverSchema.parse(process.env);

export const PROD = parsed.NODE_ENV === "production";
export const REFRESH_TOKEN_COOKIE = "amogus";
export const ACCESS_TOKEN_EXPIRY: StringValue = "1h";
export const REFRESH_TOKEN_EXPIRY: StringValue = "7d";
export const FILES_DIR = path.join(import.meta.dirname ?? "", "../../files");
export const STATIC_DIR = path.join(import.meta.dirname ?? "", "../../static");

export default {
    PROD,
    REFRESH_TOKEN_COOKIE,
    ACCESS_TOKEN_EXPIRY,
    REFRESH_TOKEN_EXPIRY,
    ...parsed,
};
