import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { z } from "zod";
import db from "@/config/db/index.ts";
import {
    conferenceApprovalApplications,
    conferenceStatusLog,
} from "@/config/db/schema/conference.ts";
import { eq } from "drizzle-orm";
import { checkAccess } from "@/middleware/auth.ts";

const router = express.Router();

const requestActionBodySchema = z.object({
    action: z.enum(["edit", "delete"]),
});

/**
 * This endpoint allows the applicant to request an edit or delete on their own application.
 * The request is recorded by setting request_edit or request_delete to true.
 * The DRC Convener will then see this in the pending applications view.
 */
router.post(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0)
            return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid id"));

        const { action } = requestActionBodySchema.parse(req.body);

        const application =
            await db.query.conferenceApprovalApplications.findFirst({
                where: (app, { eq }) => eq(app.id, id),
            });

        if (!application)
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Application not found")
            );

        // Only the applicant can request edit/delete
        if (application.userEmail !== req.user!.email)
            return next(
                new HttpError(
                    HttpCode.FORBIDDEN,
                    "Only the applicant can request this action"
                )
            );

        // Cannot request changes on completed or faculty state applications
        // (Faculty state means they already have an edit pending)
        if (application.state === "Completed")
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Cannot request changes on a completed application"
                )
            );

        if (application.state === "Faculty")
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Application is already in Faculty state for editing"
                )
            );

        await db.transaction(async (tx) => {
            if (action === "edit") {
                await tx
                    .update(conferenceApprovalApplications)
                    .set({ requestEdit: true })
                    .where(eq(conferenceApprovalApplications.id, id));
            } else {
                await tx
                    .update(conferenceApprovalApplications)
                    .set({ requestDelete: true })
                    .where(eq(conferenceApprovalApplications.id, id));
            }

            await tx.insert(conferenceStatusLog).values({
                applicationId: id,
                userEmail: req.user!.email,
                action:
                    action === "edit" ? "Requested edit" : "Requested deletion",
            });
        });

        res.status(200).send();
    })
);

export default router;
