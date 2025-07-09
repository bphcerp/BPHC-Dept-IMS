import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { authUtils, conferenceSchemas, modules, permissions } from "lib";
import { getApplicationById } from "@/lib/conference/index.ts";
import db from "@/config/db/index.ts";
import {
    conferenceApprovalApplications,
    conferenceMemberReviews,
    conferenceStatusLog,
} from "@/config/db/schema/conference.ts";
import { eq } from "drizzle-orm";
import { getUsersWithPermission } from "@/lib/common/index.ts";
import { checkAccess, dequerify } from "@/middleware/auth.ts";
import { completeTodo, createTodos } from "@/lib/todos/index.ts";

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

        const isConvener = authUtils.checkAccess(
            "conference:application:review-application-convener",
            req.user!.permissions
        );

        if (isHoD || isConvener)
            return next(
                new HttpError(
                    HttpCode.FORBIDDEN,
                    "You are not allowed to review this application yet"
                )
            );

        const application = await getApplicationById(id);
        if (!application)
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Application not found")
            );

        const applicationStateIndex = conferenceSchemas.states.indexOf(
            application.state
        );
        if (applicationStateIndex !== 1)
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    applicationStateIndex < 1
                        ? "Application is not ready to be reviewed yet"
                        : "Application is already reviewed by DRC Members"
                )
            );

        const otherReviewers = new Set(
            (
                await db.query.conferenceMemberReviews.findMany({
                    where: (r) => eq(r.applicationId, id),
                })
            ).map((u) => u.reviewerEmail)
        );
        otherReviewers.add(req.user!.email);
        const allReviewers = new Set(
            (
                await getUsersWithPermission(
                    permissions[dequerify(req.baseUrl)]
                )
            ).map((u) => u.email)
        );

        await db.transaction(async (tx) => {
            if (allReviewers.difference(otherReviewers).size === 0) {
                // If all DRC Members have reviewed the application, move state to DRC convener
                await tx
                    .update(conferenceApprovalApplications)
                    .set({
                        state: conferenceSchemas.states[
                            applicationStateIndex + 1
                        ],
                    })
                    .where(eq(conferenceApprovalApplications.id, id));
                const todoAssignees = await getUsersWithPermission(
                    "conference:application:review-application-convener",
                    tx
                );
                await createTodos(
                    todoAssignees.map((assignee) => ({
                        module: modules[0],
                        title: "Conference Application",
                        createdBy: req.user!.email,
                        completionEvent: `review ${id} convener`,
                        description: `Review conference application id ${id} by ${application.userEmail}`,
                        assignedTo: assignee.email,
                        link: `/conference/view/${id}`,
                    })),
                    tx
                );
            }

            await tx.insert(conferenceMemberReviews).values([
                {
                    applicationId: application.id,
                    reviewerEmail: req.user!.email,
                    status: status,
                    comments: comments,
                },
            ]);
            await tx.insert(conferenceStatusLog).values({
                applicationId: application.id,
                userEmail: req.user!.email,
                action: `Member ${status ? "approved" : "rejected"}`,
                comments,
            });
            await completeTodo({
                module: modules[0],
                completionEvent: `review ${id} member`,
                assignedTo: req.user!.email,
            });
        });

        res.status(200).send();
    })
);

export default router;
