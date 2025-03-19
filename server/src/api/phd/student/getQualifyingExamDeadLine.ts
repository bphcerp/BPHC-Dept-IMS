import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdConfig } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

export default router.get(
    "/",
    checkAccess("phd-check-exam-deadline"),
    asyncHandler(async (_req, res, next) => {
        const deadlineRecord = await db
            .select({ deadline: phdConfig.value })
            .from(phdConfig)
            .where(eq(phdConfig.key, "qualifying_exam_deadline"))
            .limit(1);

        if (deadlineRecord.length === 0) {
            return next(new HttpError(HttpCode.NOT_FOUND, "Qualifying exam deadline not found"));
        }

        res.json({ success: true, deadline: deadlineRecord[0].deadline });
    })
);


