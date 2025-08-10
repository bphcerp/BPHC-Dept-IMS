import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdExamApplications } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";
import { phdSchemas } from "lib";

const router = express.Router();

export default router.patch(
    "/:applicationId",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const applicationId = parseInt(req.params.applicationId);

        if (isNaN(applicationId)) {
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "Invalid application ID")
            );
        }

        const parsed = phdSchemas.updateApplicationStatusDRCSchema.parse(
            req.body
        );

        const { status, comments } = parsed;

        const existingApplication =
            await db.query.phdExamApplications.findFirst({
                where: eq(phdExamApplications.id, applicationId),
                columns: {
                    id: true,
                    status: true,
                },
            });

        if (!existingApplication) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Application not found")
            );
        }

        if (existingApplication.status === "resubmit") {
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Cannot update status of applications marked for resubmission"
                )
            );
        }

        await db
            .update(phdExamApplications)
            .set({
                status,
                comments: comments,
            })
            .where(eq(phdExamApplications.id, applicationId));

        res.status(200).send();
    })
);
