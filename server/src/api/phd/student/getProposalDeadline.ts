import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdExamEvents } from "@/config/db/schema/phd.ts";
import { eq, and, gt, desc } from "drizzle-orm";

const router = express.Router();

export default router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res, next) => {
        const examName = "Thesis Proposal";

        const deadlineEntry = await db
        .select({ deadline: phdExamEvents.registrationDeadline })
        .from(phdExamEvents)
        .where(and(
            eq(phdExamEvents.type, 'ThesisProposal'),
            eq(phdExamEvents.isActive, true),
            gt(phdExamEvents.registrationDeadline, new Date())
        ))
        .orderBy(desc(phdExamEvents.registrationDeadline))
        .limit(1);
        if (deadlineEntry.length === 0) {
            return next(
                new HttpError(
                    HttpCode.NOT_FOUND,
                    "Proposal request deadline not set"
                )
            );
        }

        res.status(200).json({
            success: true,
            deadline: deadlineEntry[0].deadline,
        });
    })
);
