import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { conferenceSchemas, modules } from "lib";
import { getApplicationById } from "@/lib/conference/index.ts";
import db from "@/config/db/index.ts";
import {
    conferenceApprovalApplications,
    conferenceStatusLog,
    conferenceApplicationMembers,
} from "@/config/db/schema/conference.ts";
import { eq, and } from "drizzle-orm";
import { getUsersWithPermission } from "@/lib/common/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { completeTodo, createTodos } from "@/lib/todos/index.ts";

const router = express.Router();

router.post(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0)
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid id");

        const { status, comments } =
            conferenceSchemas.reviewApplicationBodySchema.parse(req.body);

        const application = await getApplicationById(id);
        if (!application)
            throw new HttpError(HttpCode.NOT_FOUND, "Application not found");

        const applicationStateIndex = conferenceSchemas.states.indexOf(
            application.state
        );
        if (applicationStateIndex !== 1)
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                applicationStateIndex < 1
                    ? "Application is not ready to be reviewed yet"
                    : "Application is already reviewed by DRC Members"
            );

        const member = await db.query.conferenceApplicationMembers.findFirst({
            where: (cols, { eq, and }) =>
                and(
                    eq(cols.applicationId, id),
                    eq(cols.memberEmail, req.user!.email)
                ),
        });

        if (!member)
            throw new HttpError(
                HttpCode.FORBIDDEN,
                "You are not a member for this application"
            );
        if (member.reviewStatus !== null)
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "You have already reviewed this application"
            );

        await db.transaction(async (tx) => {
            // Check for pending reviews inside transaction to prevent race conditions
            const pendingReviews = (
                await tx.query.conferenceApplicationMembers.findMany({
                    where: (cols, { eq, ne, and, isNull }) =>
                        and(
                            eq(cols.applicationId, id),
                            ne(cols.memberEmail, req.user!.email),
                            isNull(cols.reviewStatus)
                        ),
                })
            ).length;

            if (!pendingReviews) {
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
                    "conference:application:convener",
                    tx
                );
                await createTodos(
                    todoAssignees.map((assignee) => ({
                        module: modules[0],
                        title: "Conference Application",
                        createdBy: req.user!.email,
                        completionEvent: `review ${id} convener`,
                        description: `Review conference application id ${id} by ${application.user.name || application.userEmail}`,
                        assignedTo: assignee.email,
                        link: `/conference/view/${id}`,
                    })),
                    tx
                );
            }

            await tx
                .update(conferenceApplicationMembers)
                .set({
                    reviewStatus: status,
                    comments: comments,
                })
                .where(
                    and(
                        eq(conferenceApplicationMembers.applicationId, id),
                        eq(
                            conferenceApplicationMembers.memberEmail,
                            req.user!.email
                        )
                    )
                );
            await tx.insert(conferenceStatusLog).values({
                applicationId: application.id,
                userEmail: req.user!.email,
                action: `Member ${status ? "approved" : "rejected"}`,
                comments,
            });
            await completeTodo(
                {
                    module: modules[0],
                    completionEvent: `review ${id} member`,
                    assignedTo: req.user!.email,
                },
                tx
            );
        });

        res.status(200).send();
    })
);

export default router;
