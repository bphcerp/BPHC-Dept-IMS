import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { ExtractTablesWithRelations } from "drizzle-orm";

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Transaction = PgTransaction<
    NodePgQueryResultHKT,
    any,
    ExtractTablesWithRelations<any>
>;
