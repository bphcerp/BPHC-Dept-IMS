import db from "@/config/db/index.ts";
import { inventoryCategories } from "@/config/db/schema/inventory.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { inventoryCategoryTypeEnum } from "node_modules/lib/src/schemas/Inventory.ts";

const router = Router();

router.delete(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { type } = req.query;
        if (!type) {
            res.status(400).json({
                message: "Query parameter 'type' is required",
            });
            return;
        }

        const parsedType = inventoryCategoryTypeEnum.parse(type);

        await db
            .delete(inventoryCategories)
            .where(
                and(
                    eq(inventoryCategories.id, req.params.id),
                    eq(inventoryCategories.type, parsedType)
                )
            );
        res.status(200).json({ message: "Category deleted successfully" });
    })
);

export default router;
