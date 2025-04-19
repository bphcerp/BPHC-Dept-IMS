import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { sql } from "drizzle-orm";
import { Router } from "express";
import { getYearRange } from "./lab-year.ts";

const router = Router();


router.get('/', checkAccess(), asyncHandler(async (_req, res) => {
    const { start, end } = getYearRange();

    const data = await db.execute(sql`
            SELECT 
                "subquery"."vendorId" AS "vendorId",
                "subquery".year AS year,
                SUM("subquery".quantity) AS "totalQuantity",
                SUM("subquery".po_amount) AS "totalPrice"
            FROM 
                (
                    SELECT DISTINCT ON (inventory_items.lab_id, inventory_items.serial_number)
                        inventory_items.serial_number,
                        inventory_items.vendor_id AS "vendorId",
                        DATE_PART('year', inventory_items.po_date) AS year,
                        inventory_items.quantity,
                        inventory_items.po_amount
                    FROM inventory_items
                    WHERE inventory_items.po_date BETWEEN ${start} AND ${end}
                    AND inventory_items.vendor_id IS NOT NULL
                    AND inventory_items.transfer_id IS NULL
                ) "subquery"
            GROUP BY "subquery"."vendorId", "subquery".year
            ORDER BY "subquery".year DESC;
        `)
    res.status(200).json(data.rows);
}))

export default router