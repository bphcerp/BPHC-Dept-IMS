import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import {  eq } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    checkAccess("drc-check-exam-status"),
    asyncHandler(async (req, res, next) => {
        const { email } = req.params;

        const phdRecord = await db
            .select({
                qualifyingExam1: phd.qualifyingExam1,
                qualifyingExam2: phd.qualifyingExam2,
            })
            .from(phd)
            .where(eq(phd.email, email))
            .limit(1);

        if (phdRecord.length === 0) {
            return next(new HttpError(HttpCode.NOT_FOUND, "PhD record not found"));
        }

        const { qualifyingExam1, qualifyingExam2 } = phdRecord[0];

        let status;
        if (qualifyingExam1 === true || qualifyingExam2 === true) {
            status = "Verified";
        } else if (qualifyingExam1 === false && qualifyingExam2 === false) {
            status = "Not Verified";
        } else {
            status = "Pending";
        }

        res.json({ success: true, status });
    })
);

export default router;
