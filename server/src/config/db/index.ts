import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { CONFIG_PG } from "@/config/environment";
import * as relations from "./schema/relations";
import * as applications from "./schema/applications";
import * as users from "./schema/users";

const pool = new Pool({
    ...CONFIG_PG,
});

const db = drizzle(pool, {
    schema: {
        ...users,
        ...applications,
        ...relations,
    },
});

export default db;
