import express from "express";
import assert from "assert";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { handoutSchemas } from "lib";
import { eq } from "drizzle-orm";
import { HttpError, HttpCode } from "@/config/errors.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess("faculty-get-handout"),
    asyncHandler(async (req, res, next) => {
        assert(req.user);

        const parsed = handoutSchemas.getFacultyApplicationQuerySchema.parse(
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
            return next( new HttpError(HttpCode.NOT_FOUND, "Application Not Found") );
        }

        const handoutRequest = application.courseHandoutRequests[0];

        if (!handoutRequest) {
            return next( new HttpError(HttpCode.NOT_FOUND, "Course Handout Request Not Found") );;
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
