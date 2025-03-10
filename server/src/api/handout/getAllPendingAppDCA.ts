import express from "express";
import assert from "assert";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { courseHandoutRequests } from "@/config/db/schema/handout.ts";
import { applications, applicationStatus } from "@/config/db/schema/form.ts";
import { eq, isNull, or } from "drizzle-orm";

const router = express.Router();

interface ResultType {
    applicationId: number;
    status: string;
    courseName: string;
    professorName: string;
}

router.get(
    "/",
    checkAccess("dca-get-applications"),
    asyncHandler(async (req, res, _next) => {
        assert(req.user);

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
                or(
                    isNull(applicationStatus.id),
                    eq(applicationStatus.status, false)
                )
            );

        const results: ResultType[] = [];
        for (const application of applicationResults) {
            const courseNameId =
                application.course_handout_requests?.courseName;

            const professorName = (
                await db.query.faculty.findFirst({
                    where: (user) =>
                        eq(user.email, application.applications.userEmail),
                })
            )?.name;

            if (courseNameId && professorName) {
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
                    professorName,
                });
            }
        }

        res.status(200).json({ success: true, results });
    })
);

export default router;
