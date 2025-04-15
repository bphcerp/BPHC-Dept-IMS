import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { sql } from "drizzle-orm";
import { Router } from "express";

const router = Router();

export const getYearRange = () => {
    const currentYear = new Date().getFullYear();
    return { start: '2008-01-01', end: `${currentYear}-12-31` };
};

router.get('/',checkAccess(), asyncHandler(async (_req, res) => {
    try {

        const { start, end } = getYearRange();

        const data = await db.execute(sql`
            SELECT 
                "subquery"."lab_id" AS "labId",
                "subquery".year AS year,
                SUM("subquery"."quantity") AS "totalQuantity",
                SUM("subquery"."po_amount") AS "totalPrice"
            FROM 
                (SELECT DISTINCT ON (inventory_items."lab_id", inventory_items."serial_number") 
                    inventory_items."serial_number",  
                    inventory_items."lab_id",
                    DATE_PART('year', inventory_items."po_date") AS year,
                    inventory_items."quantity",
                    inventory_items."po_amount"
                FROM "inventory_items"
                WHERE "inventory_items"."po_date" BETWEEN ${start} AND ${end}
                AND "inventory_items"."transfer_id" IS NULL
                ) "subquery"
            GROUP BY "subquery"."lab_id", "subquery".year
            ORDER BY "subquery".year DESC;

        `)
        res.status(200).json(data.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching laboratory stats per year', error });
        console.error(error);
    }
}))

export default router