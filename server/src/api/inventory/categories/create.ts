import db from "@/config/db/index.ts";
import { inventoryCategories } from "@/config/db/schema/inventory.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { Router } from "express";
import { categorySchema } from "node_modules/lib/src/schemas/Inventory.ts";

const router = Router();

router.post('/', checkAccess(), asyncHandler(async (req, res, next) => {
    try {
        const { type } = req.query;
        if (!type) {
            res.status(400).json({ message: "Query parameter 'type' is required" });
            return
        }
        const parsed = categorySchema.omit({ id: true }).parse({ ...req.body, type });
        const newCategory = await db
            .insert(inventoryCategories)
            .values(parsed)
            .onConflictDoNothing()
            .returning();

        if (newCategory.length === 0) {
            return next(
                new HttpError(HttpCode.CONFLICT, "Category already exists")
            );
        }
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Error creating category', error });
        console.error(error);
    }
}));

export default router;
