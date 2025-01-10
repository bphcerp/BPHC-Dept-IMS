import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { CONFIG_PG } from "@/config/environment";
import * as relations from "./schema/relations";
import * as admin from "./schema/admin";

const pool = new Pool({
    ...CONFIG_PG,
});

const db = drizzle(pool, {
    schema: {
        ...admin,
        ...relations,
    },
});

export default db;
