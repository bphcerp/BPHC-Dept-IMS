import db from "@/config/db/index.ts";
import { laboratories } from "@/config/db/schema/inventory.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { laboratorySchema } from "node_modules/lib/src/schemas/Inventory.ts";

const router = Router();

router.put('/:id', asyncHandler(async (req, res) => {
    try {
        const parsed = laboratorySchema.partial().parse(req.body);
        const updatedLab = await db.update(laboratories).set(parsed).where(eq(laboratories.id,req.params.id)).returning();
        res.status(200).json(updatedLab);
    } catch (error) {
        res.status(500).json({ message: 'Error updating laboratory', error });
        console.error(error);
    }
}));

export default router;
