import db from "@/config/db/index.ts";
import { semester } from "@/config/db/schema/allocation.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { and, eq } from "drizzle-orm";
import express from "express";

const router = express.Router();

router.post(
    "/:semesterId",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const { semesterId } = req.params;

        const semesterUpdated = await db
            .update(semester)
            .set({ formId: null })
            .where(
                and(
                    eq(semester.id, semesterId),
                    eq(semester.allocationStatus, "notStarted")
                )
            )
            .returning();

        if (!semesterUpdated.length){
            return next(new HttpError(HttpCode.BAD_REQUEST, "Semester details invalid"))
        }

        res.send("Successfully unlinked form");
    })
);

export default router;
