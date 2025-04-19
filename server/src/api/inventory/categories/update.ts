import db from "@/config/db/index.ts";
import { inventoryCategories, inventoryItems } from "@/config/db/schema/inventory.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { categorySchema, inventoryCategoryTypeEnum } from "node_modules/lib/src/schemas/Inventory.ts";

const router = Router();

router.patch('/:id', checkAccess(), asyncHandler(async (req, res, next) => {
    const { type } = req.query;
    if (!type) {
        res.status(400).json({ message: "Query parameter 'type' is required" });
        return
    }

    const parsedType = inventoryCategoryTypeEnum.parse(type)

    if (parsedType === 'Inventory') {
        const categoryItems = await db.select().from(inventoryItems).where(eq(inventoryItems.itemCategoryId, req.params.id))
        if (req.body.code && categoryItems.length) {
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "Cannot update category code, this category has inventory")
            )
        }
    }

    const parsed = categorySchema.partial().parse(req.body);
    const updatedCategory = await db
        .update(inventoryCategories)
        .set(parsed)
        .where(and(
            eq(inventoryCategories.id, req.params.id),
            eq(inventoryCategories.type, parsedType)
        ))
        .returning();
    res.status(200).json(updatedCategory);
}));

export default router;
