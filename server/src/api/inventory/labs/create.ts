import db from "@/config/db/index.ts";
import { laboratories } from "@/config/db/schema/inventory.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { Router } from "express";
import { laboratorySchema } from "node_modules/lib/src/schemas/Inventory.ts";

const router = Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const parsed = laboratorySchema.omit({ id: true }).parse(req.body);
        const newLab = await db
            .insert(laboratories)
            .values(parsed)
            .onConflictDoNothing()
            .returning();

        if (newLab.length === 0) {
            return next(new HttpError(HttpCode.CONFLICT, "Lab already exists"));
        }
        res.json({ success: true });
    })
);

export default router;
