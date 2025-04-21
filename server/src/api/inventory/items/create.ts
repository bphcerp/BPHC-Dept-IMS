import db from "@/config/db/index.ts";
import {
    inventoryItems,
    laboratories,
    inventoryCategories,
} from "@/config/db/schema/inventory.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import { Router } from "express";
import {
    inventoryItemSchema,
    multipleEntrySchema,
} from "node_modules/lib/src/schemas/Inventory.ts";
import { getLastItemNumber } from "../labs/getLastItemNumber.ts";

const router = Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const parsed = inventoryItemSchema
            .omit({ id: true, transferId: true, serialNumber: true })
            .parse({
                ...req.body,
                poAmount: (req.body.poAmount as number).toString(),
            });

        // Compute equipment ID again (the one client sent might be wrong/ incase of >1 quantity )

        const { labId, itemCategoryId, quantity } = parsed;

        // Get lab code
        const labCodeResult = await db
            .select({ code: laboratories.code })
            .from(laboratories)
            .where(eq(laboratories.id, labId))
            .limit(1);
        const labCode = labCodeResult[0]?.code;

        // Get category code
        const categoryCodeResult = await db
            .select({ code: inventoryCategories.code })
            .from(inventoryCategories)
            .where(eq(inventoryCategories.id, itemCategoryId))
            .limit(1);
        const categoryCode = categoryCodeResult[0]?.code;

        const lastItemNumber = await getLastItemNumber(labId);
        const baseEquipmentID = `BITS/EEE/${labCode}/${categoryCode}/${lastItemNumber.toString().padStart(4, "0")}`;

        const updatedItem = inventoryItemSchema
            .omit({ id: true, transferId: true })
            .parse({ ...parsed, serialNumber: lastItemNumber + 1 });

        if (quantity > 1) {
            const items = multipleEntrySchema.parse(
                Array.from({ length: quantity }, (_, i) => ({
                    ...parsed,
                    equipmentID: `${baseEquipmentID}-${(i + 1).toString().padStart(2, "0")}`,
                    serialNumber: lastItemNumber,
                }))
            );

            await db.insert(inventoryItems).values(items).returning();
        } else await db.insert(inventoryItems).values(updatedItem).returning();

        res.status(201).json({ success: true });
    })
);

export default router;
