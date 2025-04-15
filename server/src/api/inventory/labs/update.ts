import db from "@/config/db/index.ts";
import { inventoryItems, laboratories } from "@/config/db/schema/inventory.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { laboratorySchema } from "node_modules/lib/src/schemas/Inventory.ts";

const router = Router();

router.patch('/:id',checkAccess(), asyncHandler(async (req, res, next) => {
    try {
        const labItems = await db.select().from(inventoryItems).where(eq(inventoryItems.labId,req.params.id))
        if (req.body.code && labItems.length ){
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "Cannot update lab code, this lab has inventory")
            )
        }
        const parsed = laboratorySchema.partial().parse(req.body);
        const updatedLab = await db.update(laboratories).set(parsed).where(eq(laboratories.id,req.params.id)).returning();
        res.status(200).json(updatedLab);
    } catch (error) {
        res.status(500).json({ message: 'Error updating laboratory', error });
        console.error(error);
    }
}));

export default router;
