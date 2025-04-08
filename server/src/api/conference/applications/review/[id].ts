import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { authUtils, conferenceSchemas } from "lib";
import { getApplicationById } from "@/lib/conference/index.ts";
import db from "@/config/db/index.ts";
import { applications } from "@/config/db/schema/form.ts";
import { eq } from "drizzle-orm";
import { conferenceApprovalApplications } from "@/config/db/schema/conference.ts";

const router = express.Router();

router.get(
    "/:id",
    asyncHandler(async (req, res, next) => {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0)
            return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid id"));

        const { status } = conferenceSchemas.reviewApplicationBodySchema.parse(
            req.body
        );

        const isHoD = authUtils.checkAccess(
            "conference:application:review-application-hod",
            req.user!.permissions
        );

        const isConvener = authUtils.checkAccess(
            "conference:application:review-application-convener",
            req.user!.permissions
        );

        if (!isHoD && !isConvener)
            return next(
                new HttpError(
                    HttpCode.FORBIDDEN,
                    "You are not allowed to review this application"
                )
            );

        const application = await getApplicationById(id);

        if (!application)
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Application not found")
            );

        if (application.status !== "pending")
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Application is already reviewed"
                )
            );

        await db.transaction(async (tx) => {
            await tx
                .update(conferenceApprovalApplications)
                .set({
                    state:
                        isHoD && status
                            ? conferenceSchemas.states[3]
                            : isHoD
                              ? conferenceSchemas.states[2]
                              : conferenceSchemas.states[1],
                })
                .where(
                    eq(
                        conferenceApprovalApplications.applicationId,
                        application.id
                    )
                );
            if (isHoD || !status)
                await tx
                    .update(applications)
                    .set({ status: status ? "approved" : "rejected" })
                    .where(eq(applications.id, application.id));
        });

        res.status(200).send();
    })
);

export default router;
