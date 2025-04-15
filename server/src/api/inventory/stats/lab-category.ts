import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { Router } from "express";

const router = Router();

router.get('/',checkAccess(), asyncHandler(async (_req, res) => {
    try {

        const data = await db.execute(`
            SELECT 
                "subquery"."lab_id" AS "labId",
                "subquery"."item_category_id" AS "categoryId",
                SUM("subquery"."quantity") AS "totalQuantity",
                SUM("subquery"."po_amount") AS "totalPrice"
            FROM 
                (
                    SELECT DISTINCT ON (inventory_items.lab_id, inventory_items.serial_number)
                        inventory_items.serial_number,
                        inventory_items.lab_id,
                        inventory_items.item_category_id,
                        inventory_items.quantity,
                        inventory_items.po_amount
                    FROM inventory_items
                    WHERE inventory_items.transfer_id IS NULL
                ) "subquery"
            GROUP BY "subquery"."lab_id", "subquery"."item_category_id";
        `)
        res.status(200).json(data.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching laboratory stats per category', error });
        console.error(error);
    }
}))

export default router