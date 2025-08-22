import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdSchemas } from "lib";
import { phdExamApplications, phdExaminerAssignments } from "@/config/db/schema/phd.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { eq } from "drizzle-orm";

const router = express.Router();

export default router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const { applicationId, examinerCount } =
            phdSchemas.updateExaminerCountSchema.parse(req.body);

        const application = await db.query.phdExamApplications.findFirst({
            where: eq(phdExamApplications.id, applicationId),
        });

        if (!application) {
            return next(new HttpError(HttpCode.NOT_FOUND, "Application not found"));
        }

        const existingAssignments = await db.query.phdExaminerAssignments.findMany({
            where: eq(phdExaminerAssignments.applicationId, applicationId),
        });

        if (existingAssignments.length > 0) {
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Cannot update examiner count after examiners have been assigned"
                )
            );
        }

        await db
            .update(phdExamApplications)
            .set({ examinerCount })
            .where(eq(phdExamApplications.id, applicationId));

        res.status(200).json({
            success: true,
            message: `Examiner count updated to ${examinerCount}`,
        });
    })
);
