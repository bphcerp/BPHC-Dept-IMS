import db from "@/config/db/index.ts";
import { inventoryCategories } from "@/config/db/schema/inventory.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { inventoryCategoryTypeEnum } from "node_modules/lib/src/schemas/Inventory.ts";

const router = Router();

router.get('/', checkAccess(), asyncHandler(async (req, res) => {
    const { type } = req.query;
    if (!type) {
        res.status(400).json({ message: "Query parameter 'type' is required" });
        return
    }

    const parsedType = inventoryCategoryTypeEnum.parse(type)

    const result = await db.query.inventoryCategories.findMany({
        where: eq(inventoryCategories.type, parsedType),
    });
    res.status(200).json(result)
}));

export default router;
