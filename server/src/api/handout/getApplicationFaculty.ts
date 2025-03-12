import express from "express";
import assert from "assert";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { handoutSchemas } from "lib";
import { eq } from "drizzle-orm";

const router = express.Router();

router.get(
    "/",
    checkAccess("get-handout-faculty"),
    asyncHandler(async (req, res, _next) => {
        assert(req.user);

        const parsed = handoutSchemas.getApplicationFacultyBodySchema.parse(
            req.query
        );
        const { applicationId } = parsed;

        const application = await db.query.applications.findFirst({
            where: (app) => eq(app.id, applicationId),
            with: {
                courseHandoutRequests: {
                    with: {
                        courseCode: true,
                        courseName: true,
                        openBook: true,
                        closedBook: true,
                        midSem: true,
                        compre: true,
                        frequency: true,
                        numComponents: true,
                    },
                },
            },
        });

        if (!application) {
            res.status(404).json({
                success: false,
                message: "Application not found",
            });
            return;
        }

        const handoutRequest = application.courseHandoutRequests[0];

        if (!handoutRequest) {
            res.status(404).json({
                success: false,
                message: "Course handout request not found",
            });
            return;
        }

        const result = {
            applicationId: application.id,
            courseCode: handoutRequest.courseCode?.value ?? "",
            courseName: handoutRequest.courseName?.value ?? "",
            openBook: handoutRequest.openBook?.value ?? "",
            closedBook: handoutRequest.closedBook?.value ?? "",
            midSem: handoutRequest.midSem?.value ?? "",
            compre: handoutRequest.compre?.value ?? "",
            frequency: handoutRequest.frequency?.value ?? "",
            numComponents: handoutRequest.numComponents?.value ?? "",
            status: application.status,
        };

        res.status(200).json({ success: true, result });
    })
);

export default router;
