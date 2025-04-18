import db from "@/config/db/index.ts";
import { vendors, vendorCategories } from "@/config/db/schema/inventory.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { vendorCategorySchema, vendorSchema } from "node_modules/lib/src/schemas/Inventory.ts";
import { z } from "zod";

const router = Router();

router.patch('/:id', checkAccess(), asyncHandler(async (req, res) => {
    const parsed = vendorSchema.partial().parse(req.body);
    const updatedVendor = await db.update(vendors).set(parsed).where(eq(vendors.id, req.params.id)).returning();

    if (req.body.categories) {

        await db
            .delete(vendorCategories)
            .where(eq(vendorCategories.vendorId, req.params.id));

        const vendorCategoriesList = req.body.categories.map((categoryId: string) => ({
            vendorId: updatedVendor[0].id,
            categoryId,
        }))

        const vendorCategoriesParsed = z.array(vendorCategorySchema).parse(vendorCategoriesList)

        await db.insert(vendorCategories).values(vendorCategoriesParsed)
    }

    res.status(200).json(updatedVendor);
}));

export default router;
