import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSubAreas } from "@/config/db/schema/phd.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

router.delete(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const subAreaId = parseInt(req.params.id, 10);

        if (isNaN(subAreaId) || subAreaId <= 0) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid sub-area ID"));
        }

        const deleted = await db.delete(phdSubAreas).where(eq(phdSubAreas.id, subAreaId));

        if (!deleted.rowCount) {
            return next(new HttpError(HttpCode.NOT_FOUND, "Sub-area not found"));
        }

        res.status(200).json({ success: true, message: "Sub-area deleted successfully" });
    })
);

export default router;
