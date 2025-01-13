import { drizzle } from "drizzle-orm/node-postgres";
import * as relations from "./schema/relations";
import * as admin from "./schema/admin";
import env from "../environment";
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
        ...relations,
    },
});

export default db;
