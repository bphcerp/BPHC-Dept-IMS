import { drizzle } from "drizzle-orm/node-postgres";
import * as adminRelations from "./schema/adminRelations.ts";
import * as admin from "./schema/admin.ts";
import * as phdRelations from "./schema/phdRelations.ts";
import * as phd from "./schema/phd.ts";
import * as conference from "./schema/conference.ts";
import * as conferenceRelations from "./schema/conferenceRelations.ts";
import * as form from "./schema/form.ts";
import * as formRelations from "./schema/formRelations.ts";
import * as handout from "./schema/handout.ts";
import * as hadnoutRelations from "./schema/handoutRelations.ts";
import * as patents from "./schema/patents.ts";
import * as qp from "./schema/qp.ts";
import * as qpRelations from "./schema/qpRelations.ts";
import * as publications from "./schema/publications.ts";
import * as publicationsRelations from "./schema/publicationsRelations.ts";
import * as todos from "./schema/todos.ts";
import * as inventory from "./schema/inventory.ts";
import * as inventoryRelations from "./schema/inventoryRelations.ts";
import * as projectRelations from "./schema/projectRelations.ts";
import * as project from "./schema/project.ts";
import * as wilpProject from "./schema/wilpProject.ts";
import * as meeting from "./schema/meeting.ts"; 
import * as meetingRelations from "./schema/meetingRelations.ts";

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
        ...conference,
        ...conferenceRelations,
        ...form,
        ...formRelations,
        ...handout,
        ...hadnoutRelations,
        ...patents,
        ...phd,
        ...phdRelations,
        ...qp,
        ...qpRelations,
        ...publications,
        ...publicationsRelations,
        ...todos,
        ...inventory,
        ...inventoryRelations,
        ...project,
        ...projectRelations,
        ...wilpProject,
        ...meeting,
        ...meetingRelations
    },
});

export function isTx(client: typeof db | Tx = db) {
    return Symbol.for("drizzle:transaction") in client;
}

export type Tx = Parameters<Parameters<(typeof db)["transaction"]>[0]>[0];
export default db;
