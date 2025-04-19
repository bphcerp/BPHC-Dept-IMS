import db from "@/config/db/index.ts";
import { inventoryItems } from "@/config/db/schema/inventory.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq, max } from "drizzle-orm";
import { PgTransaction } from "drizzle-orm/pg-core";
import { Router } from "express";

export const getLastItemNumber = async (
    labId: string,
    tx?: PgTransaction<any, any, any>
) => {
    const result = await (tx ?? db)
        .select({
            maxSerialNumber: max(inventoryItems.serialNumber),
        })
        .from(inventoryItems)
        .where(eq(inventoryItems.labId, labId));

    const lastItemNumber = (result[0]?.maxSerialNumber ?? 0) + 1;
    return lastItemNumber;
};

const router = Router();

router.get(
    "/:labId",
    checkAccess(),
    asyncHandler(async (req, res) => {
        res.status(200).json({
            lastItemNumber: await getLastItemNumber(req.params.labId),
        });
    })
);

export default router;
