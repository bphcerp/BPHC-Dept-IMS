import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdConfig } from "@/config/db/schema/phd.ts";
import { phdSchemas } from "lib";

const router = express.Router();

export default router.post(
    "/",
    checkAccess("drc-update-exam-deadline"),
    asyncHandler(async (req, res, next) => {
        const parsed = phdSchemas.updateExamDeadlineBodySchema.parse(req.body);
        const deadlineDate = new Date(parsed.deadline);

        const updated = await db
            .insert(phdConfig)
            .values({ key: "qualifying_exam_deadline", value: deadlineDate })
            .onConflictDoUpdate({ target: [phdConfig.key], set: { value: deadlineDate } })
            .returning();

        if (updated.length === 0) {
            return next(new HttpError(HttpCode.INTERNAL_SERVER_ERROR, "Failed to set qualifying exam deadline"));
        }

        res.json({ success: true, deadline: updated[0].value });
    })
);

