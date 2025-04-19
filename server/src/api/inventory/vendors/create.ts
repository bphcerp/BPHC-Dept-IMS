import db from "@/config/db/index.ts";
import { vendors } from "@/config/db/schema/inventory.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { Router } from "express";
import {
    vendorCategorySchema,
    vendorSchema,
} from "node_modules/lib/src/schemas/Inventory.ts";
import { z } from "zod";

const router = Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const parsed = vendorSchema.omit({ id: true }).parse(req.body);
        const newVendor = await db.insert(vendors).values(parsed).returning();

        if (newVendor.length === 0) {
            return next(
                new HttpError(HttpCode.CONFLICT, "Vendor already exists")
            );
        }

        if (req.body.categories) {
            const vendorCategories = req.body.categories.map(
                (categoryId: string) => ({
                    vendorId: newVendor[0].id,
                    categoryId,
                })
            );

            const vendorCategoriesParsed = z
                .array(vendorCategorySchema)
                .parse(vendorCategories);

            await db.insert(vendorCategories).values(vendorCategoriesParsed);
        }

        res.json({ success: true });
    })
);

export default router;
