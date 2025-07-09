import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { conferenceSchemas, modules } from "lib";
import { getApplicationById } from "@/lib/conference/index.ts";
import db from "@/config/db/index.ts";
import {
    conferenceApprovalApplications,
    conferenceMemberReviews,
    conferenceStatusLog,
} from "@/config/db/schema/conference.ts";
import { eq } from "drizzle-orm";
import { checkAccess } from "@/middleware/auth.ts";
import { completeTodo } from "@/lib/todos/index.ts";

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

        const application = await getApplicationById(id);

        if (!application)
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Application not found")
            );

        const applicationStateIndex = conferenceSchemas.states.indexOf(
            application.state
        );
        if (applicationStateIndex !== 3)
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    applicationStateIndex < 3
                        ? "Application is not ready to be reviewed yet"
                        : "Application is already reviewed by HOD"
                )
            );

        await db.transaction(async (tx) => {
            await tx
                .update(conferenceApprovalApplications)
                .set({
                    state: conferenceSchemas.states[
                        applicationStateIndex + (status ? 1 : -3)
                    ],
                })
                .where(eq(conferenceApprovalApplications.id, id));

            await tx
                .delete(conferenceMemberReviews)
                .where(eq(conferenceMemberReviews.applicationId, id));

            await tx.insert(conferenceMemberReviews).values({
                applicationId: application.id,
                reviewerEmail: req.user!.email,
                status: status,
                comments: comments,
            });
            await tx.insert(conferenceStatusLog).values({
                applicationId: application.id,
                userEmail: req.user!.email,
                action: `HoD ${status ? "approved" : "rejected"}`,
                comments,
            });
            await completeTodo({
                module: modules[0],
                completionEvent: `review ${id} hod`,
            });
        });
        res.status(200).send();
    })
);

export default router;
