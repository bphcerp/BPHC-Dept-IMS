import { drizzle } from "drizzle-orm/node-postgres";
import * as adminRelations from "./schema/adminRelations.ts";
import * as admin from "./schema/admin.ts";
import * as phdRelations from "./schema/phdRelations.ts";
import * as phd from "./schema/phd.ts";
import * as form from "./schema/form.ts";
import * as formRelations from "./schema/formRelations.ts";
import * as handout from "./schema/handout.ts";
import * as hadnoutRelations from "./schema/handoutRelations.ts";
import * as qp from "./schema/qp.ts";
import * as qpRelations from "./schema/qpRelations.ts";
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
        ...phd,
        ...phdRelations,
        ...form,
        ...formRelations,
        ...handout,
        ...hadnoutRelations,
        ...qp,
        ...qpRelations,
    },
});

export default db;
