import db from "@/config/db/index.ts";
import { allocation } from "@/config/db/schema/allocation.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import {deleteAllocationSchema} from "node_modules/lib/src/schemas/Allocation.ts";
const router = express.Router();



router.delete(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const parsed = deleteAllocationSchema.parse(req.body);

        const allocationExists = await db.query.allocation.findFirst({
            where: (alloc, { eq }) => eq(alloc.id, parsed.id),
        });

        if (!allocationExists) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Allocation not found for given ID")
            );
        }

        await db
            .delete(allocation)
            .where(eq(allocation.id, parsed.id))
            .returning();

        res.status(200).json({ success: true });
    })
);

export default router;
