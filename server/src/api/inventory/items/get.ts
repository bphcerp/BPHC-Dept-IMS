import db from "@/config/db/index.ts";
import { inventoryItems } from "@/config/db/schema/inventory.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { isNull } from "drizzle-orm";
import { Router } from "express";

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
    try {
        const items = await db.query.inventoryItems.findMany({
            with: {
                vendor: true,
                lab: true,
                itemCategory: true
            },
            where: isNull(inventoryItems.transferId)
        });
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching items', error });
        console.error(error);
    }
}));

export default router;
