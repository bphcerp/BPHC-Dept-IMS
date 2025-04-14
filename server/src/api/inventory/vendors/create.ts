import db from "@/config/db/index.ts";
import { vendors } from "@/config/db/schema/inventory.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { Router } from "express";
import { vendorSchema } from "node_modules/lib/src/schemas/Inventory.ts";

const router = Router();

router.post('/', checkAccess(), asyncHandler(async (req, res, next) => {
    try {
        const parsed = vendorSchema.parse(req.body);
        const newVendor = await db
            .insert(vendors)
            .values(parsed)
            .onConflictDoNothing()
            .returning();

        if (newVendor.length === 0) {
            return next(
                new HttpError(HttpCode.CONFLICT, "Vendor already exists")
            );
        };
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Error creating vendor', error });
        console.error(error);
    }
}));

export default router;
