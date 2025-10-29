import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { conferenceSchemas, modules } from "lib";
import { getApplicationById } from "@/lib/conference/index.ts";
import db from "@/config/db/index.ts";
import {
    conferenceApprovalApplications,
    conferenceStatusLog,
} from "@/config/db/schema/conference.ts";
import { eq } from "drizzle-orm";
import { checkAccess } from "@/middleware/auth.ts";
import { completeTodo, createTodos } from "@/lib/todos/index.ts";
import { getUsersWithPermission } from "@/lib/common/index.ts";

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

        // Check if we are in the direct flow
        const isDirect =
            (
                await db.query.conferenceGlobal.findFirst({
                    where: (conferenceGlobal, { eq }) =>
                        eq(conferenceGlobal.key, "directFlow"),
                })
            )?.value === "true";

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

            await tx.insert(conferenceStatusLog).values({
                applicationId: application.id,
                userEmail: req.user!.email,
                action: `Convener ${status ? "approved" : "rejected"}`,
                comments,
            });
            await completeTodo({
                module: modules[0],
                completionEvent: `review ${id} convener`,
            });
            if (!isDirect && status) {
                const todoAssignees = await getUsersWithPermission(
                    "conference:application:hod",
                    tx
                );
                await createTodos(
                    todoAssignees.map((assignee) => ({
                        module: modules[0],
                        title: "Conference Application",
                        createdBy: req.user!.email,
                        completionEvent: `review ${id} hod`,
                        description: `Review conference application id ${id} by ${application.userEmail}`,
                        assignedTo: assignee.email,
                        link: `/conference/view/${id}`,
                    })),
                    tx
                );
            } else if (!status) {
                await createTodos(
                    [
                        {
                            module: modules[0],
                            title: "Conference Application",
                            createdBy: req.user!.email,
                            completionEvent: `edit ${id}`,
                            description: `Requested changes: conference application id ${id}`,
                            assignedTo: application.userEmail,
                            link: `/conference/submitted/${id}`,
                        },
                    ],
                    tx
                );
            }
        });
        res.status(200).send();
    })
);

export default router;
