import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";
import { phdSchemas } from "lib";

const router = express.Router();

router.get(
    "/:email",
    checkAccess("drc-view-qualifying-form"),
    asyncHandler(async (req, res, next) => {
        const parsed = phdSchemas.getQualifyingExamFormParamsSchema.parse(req.params);
        
        const phdRecord = await db
            .select({
                email: phd.email,
                name: phd.name,
                qualifyingExam1: phd.qualifyingExam1,
                qualifyingExam1Date: phd.qualifyingExam1Date,
                qualifyingExam2: phd.qualifyingExam2,
                qualifyingExam2Date: phd.qualifyingExam2Date,
                qualifyingArea1: phd.qualifyingArea1,
                qualifyingArea2: phd.qualifyingArea2,
                supervisorEmail: phd.supervisorEmail,
                notionalSupervisorEmail: phd.notionalSupervisorEmail
            })
            .from(phd)
            .where(eq(phd.email, parsed.email))
            .limit(1);

        if (phdRecord.length === 0) {
            return next(new HttpError(HttpCode.NOT_FOUND, "PhD record not found"));
        }

        res.status(200).json({ 
            success: true, 
            formData: {
                ...phdRecord[0],
                // Convert dates to ISO strings for JSON serialization
                qualifyingExam1Date: phdRecord[0].qualifyingExam1Date?.toISOString(),
                qualifyingExam2Date: phdRecord[0].qualifyingExam2Date?.toISOString()
            },
            qualifyingExamFormLink: "https://www.bits-pilani.ac.in/wp-content/uploads/1.-Format-for-application-to-DRC-for-Ph.D-Qualifying-Examination.pdf"
        });
    })
);

export default router;
