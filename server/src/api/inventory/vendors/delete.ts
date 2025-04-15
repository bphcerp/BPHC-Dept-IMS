import db from "@/config/db/index.ts";
import { vendorCategories, vendors } from "@/config/db/schema/inventory.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import { Router } from "express";

const router = Router();

router.delete('/:id', checkAccess(), asyncHandler(async (req, res) => {
    try {
        await db.delete(vendors).where(eq(vendors.id, req.params.id));
        await db
            .delete(vendorCategories)
            .where(eq(vendorCategories.vendorId, req.params.id))
        res.status(200).json({ message: 'Vendor deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting vendor', error });
        console.error(error);
    }
}));

export default router;
