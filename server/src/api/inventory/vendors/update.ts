import db from "@/config/db/index.ts";
import { vendors } from "@/config/db/schema/inventory.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { vendorSchema } from "node_modules/lib/src/schemas/Inventory.ts";

const router = Router();

router.put('/:id', checkAccess(), asyncHandler(async (req, res) => {
    try {
        const parsed = vendorSchema.partial().parse(req.body);
        const updatedVendor = await db.update(vendors).set(parsed).where(eq(vendors.id, req.params.id)).returning();
        res.status(200).json(updatedVendor);
    } catch (error) {
        res.status(500).json({ message: 'Error updating vendor', error });
        console.error(error);
    }
}));

export default router;
