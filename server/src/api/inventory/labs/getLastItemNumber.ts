import db from "@/config/db/index.ts";
import { inventoryItems } from "@/config/db/schema/inventory.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq, max } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { Router } from "express";

export const getLastItemNumber = async (labId: string, tx? : PgTransaction<any,any,any>) => {
    const result = await ( tx ?? db )
        .select({
            maxSerialNumber: max(inventoryItems.serialNumber),
        })
        .from(inventoryItems)
        .where(eq(inventoryItems.labId, labId))

    const lastItemNumber = (result[0]?.maxSerialNumber ?? 0) + 1;
    return lastItemNumber
};

const router = Router();

router.get('/:labId', asyncHandler(async (req, res) => {
    try {
        res.status(200).json({ lastItemNumber : await getLastItemNumber(req.params.labId) });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching laboratories', error });
        console.error(error);
    }
}))

export default router;
