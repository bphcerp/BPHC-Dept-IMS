import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { authUtils, conferenceSchemas } from "lib";
import { getApplicationById } from "@/lib/conference/index.ts";
import db from "@/config/db/index.ts";
import {
    conferenceApprovalApplications,
    conferenceGlobal,
    conferenceMemberReviews,
} from "@/config/db/schema/conference.ts";
import { eq } from "drizzle-orm";
import { checkAccess } from "@/middleware/auth.ts";

const router = express.Router();

router.post(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0)
            return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid id"));

        const { status, comments } =
            conferenceSchemas.reviewApplicationBodySchema.parse(req.body);

        const isHoD = authUtils.checkAccess(
            "conference:application:review-application-hod",
            req.user!.permissions
        );

        if (isHoD)
            return next(
                new HttpError(
                    HttpCode.FORBIDDEN,
                    "You are not allowed to review this application yet"
                )
            );

        // Check if we are in the direct flow
        const current = await db.query.conferenceGlobal.findFirst({
            where: (conferenceGlobal, { eq }) =>
                eq(conferenceGlobal.key, "directFlow"),
        });
        if (!current) {
            await db.insert(conferenceGlobal).values({
                key: "directFlow",
                value: "false",
            });
        }
        const isDirect = current && current.value === "true";

        const application = await getApplicationById(id);

        if (!application)
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Application not found")
            );

        const applicationStateIndex = conferenceSchemas.states.indexOf(
            application.state
        );
        if (applicationStateIndex !== 2)
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    applicationStateIndex < 2
                        ? "Application is not ready to be reviewed yet"
                        : "Application is already reviewed by DRC Convener"
                )
            );

        await db.transaction(async (tx) => {
            await tx
                .update(conferenceApprovalApplications)
                .set({
                    state: conferenceSchemas.states[
                        applicationStateIndex +
                            (status ? (isDirect ? 2 : 1) : -2)
                    ],
                })
                .where(eq(conferenceApprovalApplications.id, id));

            await tx
                .delete(conferenceMemberReviews)
                .where(eq(conferenceMemberReviews.applicationId, id));

            await tx.insert(conferenceMemberReviews).values([
                {
                    applicationId: application.id,
                    reviewerEmail: req.user!.email,
                    status: status,
                    comments: comments,
                },
            ]);
        });
        res.status(200).send();
    })
);

export default router;
