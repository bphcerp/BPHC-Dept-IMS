import db from "@/config/db/index.ts";
import { inventoryItems } from "@/config/db/schema/inventory.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { isNull } from "drizzle-orm";
import { Router } from "express";

const router = Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const items = await db.query.inventoryItems.findMany({
            with: {
                vendor: true,
                lab: true,
                itemCategory: true,
            },
            where: isNull(inventoryItems.transferId),
        });
        res.status(200).json(items);
    })
);

export default router;
