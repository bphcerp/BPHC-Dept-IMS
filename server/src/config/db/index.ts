import { drizzle } from "drizzle-orm/node-postgres";
import * as adminRelations from "./schema/adminRelations.ts";
import * as admin from "./schema/admin.ts";
import env from "../environment.ts";
import pg from "pg";

const { Pool } = pg;

const pool = new Pool({
    host: env.DB_HOST,
    user: env.POSTGRES_USER,
    password: env.POSTGRES_PASSWORD,
    port: env.PGPORT,
    database: env.POSTGRES_DB,
    ssl: false,
});

const db = drizzle(pool, {
    schema: {
        ...admin,
        ...adminRelations,
    },
});

export default db;
