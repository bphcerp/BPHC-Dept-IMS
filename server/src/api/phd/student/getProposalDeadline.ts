import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdQualifyingExams } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res, next) => {
        const examName = "Thesis Proposal";

        const deadlineEntry = await db
            .select({
                deadline: phdQualifyingExams.deadline,
            })
            .from(phdQualifyingExams)
            .where(eq(phdQualifyingExams.examName, examName))
            .orderBy(phdQualifyingExams.deadline)
            .limit(1);

        if (deadlineEntry.length === 0) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Proposal request deadline not set")
            );
        }

        res.status(200).json({ success: true, deadline: deadlineEntry[0].deadline });
    })
);