import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdStudentApplications } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";

const router = express.Router();

/**
 * @description Fetches all necessary student data for a specific exam event 
 * to generate the "Intimation to AGSRD" form.
 * @route GET /phd/drcMember/exam-events/:examEventId/intimation-data
 */
router.get("/:examEventId", checkAccess(), asyncHandler(async (req, res, next) => {
    const examEventId = parseInt(req.params.examEventId);
    if (isNaN(examEventId)) {
        return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid Exam Event ID"));
    }

    const applications = await db.query.phdStudentApplications.findMany({
        where: eq(phdStudentApplications.examEventId, examEventId),
        with: {
            student: {
                columns: {
                    name: true,
                    idNumber: true,
                }
            },
            examEvent: {
                columns: {
                    examStartDate: true,
                    examEndDate: true,
                }
            }
        }
    });

    if (applications.length === 0) {
        res.status(200).json({
            success: true,
            formData: {
                examStartDate: null,
                examEndDate: null,
                students: []
            }
        });
    }

    const formData = {
        examStartDate: applications[0].examEvent.examStartDate,
        examEndDate: applications[0].examEvent.examEndDate,
        students: applications.map(app => ({
            idNumber: app.student?.idNumber,
            name: app.student?.name,
            attempt: app.attemptNumber === 1 ? "First Attempt" : "Second Attempt",
            qualifyingArea1: app.qualifyingArea1,
            qualifyingArea2: app.qualifyingArea2,
        }))
    };

    res.status(200).json({ success: true, formData });
}));

export default router;
