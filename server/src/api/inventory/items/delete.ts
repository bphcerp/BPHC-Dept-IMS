import db from "@/config/db/index.ts";
import { inventoryItems } from "@/config/db/schema/inventory.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import { Router } from "express";

const router = Router();

router.delete(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const itemDeleted = await db
            .delete(inventoryItems)
            .where(eq(inventoryItems.id, req.params.id))
            .returning();

        // if quantity more than 1 delete the rest.

        if (itemDeleted[0].quantity > 1)
            await db
                .delete(inventoryItems)
                .where(
                    eq(inventoryItems.serialNumber, itemDeleted[0].serialNumber)
                );

        res.status(200).json({ message: "Item deleted successfully" });
    })
);

export default router;
