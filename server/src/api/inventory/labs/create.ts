import db from "@/config/db/index.ts";
import { laboratories } from "@/config/db/schema/inventory.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { Router } from "express";
import { laboratorySchema } from "node_modules/lib/src/schemas/Inventory.ts";

const router = Router();

router.post('/',checkAccess(), asyncHandler(async (req, res, next) => {
    try {
        const parsed = laboratorySchema.parse(req.body);
        const newLab = await db
            .insert(laboratories)
            .values(parsed)
            .onConflictDoNothing()
            .returning();

        if (newLab.length === 0) {
            return next(
                new HttpError(HttpCode.CONFLICT, "Lab already exists")
            );
        };
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Error creating laboratory', error });
        console.error(error);
    }
}));

export default router;
