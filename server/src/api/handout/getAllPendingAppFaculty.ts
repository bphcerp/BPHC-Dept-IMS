import express from "express";
import assert from "assert";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { courseHandoutRequests } from "@/config/db/schema/handout.ts";
import { applications, applicationStatus } from "@/config/db/schema/form.ts";
import { eq, isNull, or, and } from "drizzle-orm";
import z from "zod";

const router = express.Router();

interface Application {
    applicationId: number;
    status: string;
    courseName: string;
}

const GetFacultyApplicationsSchema = z.object({
    email: z.string().email(),
});

router.get(
    "/",
    checkAccess("ic"),
    asyncHandler(async (req, res, _next) => {
        assert(req.user);
        
        const parsed = GetFacultyApplicationsSchema.parse(req.query);
        const { email } = parsed;
        
        const applicationResults = await db
            .select()
            .from(applications)
            .leftJoin(
                applicationStatus,
                eq(applicationStatus.applicationId, applications.id)
            )
            .leftJoin(
                courseHandoutRequests,
                eq(courseHandoutRequests.applicationId, applications.id)
            )
            .where(
                and(
                    eq(applications.userEmail, email),
                    or(
                        isNull(applicationStatus.id),
                        eq(applicationStatus.status, false)
                    )
                )
            );
        
        const results: Application[] = [];
        for (const application of applicationResults) {
            const courseNameId = application.course_handout_requests?.courseName;
            
            if (courseNameId) {
                const result = await db.query.textFields.findFirst({
                    where: (text) => eq(text.id, courseNameId),
                });
                
                results.push({
                    applicationId: application.applications.id,
                    status:
                        application.application_status == null
                            ? "Not Verified"
                            : "Marked for Resubmission",
                    courseName: result?.value ?? "",
                });
            }
        }
        
        res.status(200).json({ success: true, results });
    })
);

export default router;
