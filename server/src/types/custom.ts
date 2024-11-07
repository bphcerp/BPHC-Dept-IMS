import type { NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { ExtractTablesWithRelations } from "drizzle-orm";
import type { HttpCode } from "@/config/errors";

export type ReturnData<T> =
    | { success: true; data: T }
    | { success: false; error: string; code?: HttpCode; feedback?: string };

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Transaction = PgTransaction<
    NodePgQueryResultHKT,
    any,
    ExtractTablesWithRelations<any>
>;
