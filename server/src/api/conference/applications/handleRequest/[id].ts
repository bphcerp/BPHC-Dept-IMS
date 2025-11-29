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
import { completeTodo, createTodos } from "@/lib/todos/index.ts";
import { sendEmail } from "@/lib/common/email.ts";
import environment from "@/config/environment.ts";
import { modules } from "lib";

const router = express.Router();

const handleRequestBodySchema = z.object({
    action: z.enum(["edit", "delete"]),
    accept: z.boolean(),
});

/**
 * This endpoint allows DRC Convener to handle applicant requests for edit/delete.
 *
 * If accept=true and action=edit:
 *   - Clear requestEdit flag
 *   - Set state to Faculty
 *   - Create todo for applicant
 *   - Send email to applicant
 *
 * If accept=true and action=delete:
 *   - Delete the application
 *
 * If accept=false:
 *   - Clear the requestEdit or requestDelete flag
 *   - Log the rejection
 */
router.post(
    "/:id",
    checkAccess("conference:application:convener"),
    asyncHandler(async (req, res, next) => {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0)
            return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid id"));

        const { action, accept } = handleRequestBodySchema.parse(req.body);

        const application =
            await db.query.conferenceApprovalApplications.findFirst({
                where: (app, { eq }) => eq(app.id, id),
                with: { user: true },
            });

        if (!application)
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Application not found")
            );

        // Verify the application has the corresponding request flag set
        if (action === "edit" && !application.requestEdit)
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Application does not have an edit request"
                )
            );

        if (action === "delete" && !application.requestDelete)
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Application does not have a delete request"
                )
            );

        await db.transaction(async (tx) => {
            // Determine which pending todos need to be cleared based on current state
            const pendingTodoEvents: string[] = [];
            switch (application.state) {
                case "DRC Member":
                    // Could have: assign members todo, member review todos
                    pendingTodoEvents.push(
                        `assign members ${id}`,
                        `review ${id} member`
                    );
                    break;
                case "DRC Convener":
                    // Could have: convener review todo
                    pendingTodoEvents.push(`review ${id} convener`);
                    break;
                case "HoD":
                    // Could have: HoD review todo
                    pendingTodoEvents.push(`review ${id} hod`);
                    break;
            }

            if (accept) {
                if (action === "edit") {
                    // Accept edit request: move to Faculty state and create todo
                    // First, complete any pending todos for this application
                    if (pendingTodoEvents.length > 0) {
                        await completeTodo(
                            {
                                module: modules[0],
                                completionEvent: pendingTodoEvents,
                            },
                            tx
                        );
                    }

                    await tx
                        .update(conferenceApprovalApplications)
                        .set({
                            requestEdit: false,
                            state: "Faculty",
                        })
                        .where(eq(conferenceApprovalApplications.id, id));

                    await tx.insert(conferenceStatusLog).values({
                        applicationId: id,
                        userEmail: req.user!.email,
                        action: "Edit request accepted by convener",
                    });

                    await createTodos(
                        [
                            {
                                module: modules[0],
                                title: "Conference Application",
                                createdBy: req.user!.email,
                                completionEvent: `edit ${id}`,
                                description: `Edit request accepted: conference application id ${id}`,
                                assignedTo: application.userEmail,
                                link: `/conference/submitted/${id}`,
                            },
                        ],
                        tx
                    );

                    void sendEmail({
                        to: application.userEmail,
                        subject: `Conference Approval: Edit Request Accepted`,
                        text: `Your edit request for conference approval application has been accepted. Please log in to the IMS system to edit your application.\n\nLink: ${environment.FRONTEND_URL}`,
                    });
                } else {
                    // Accept delete request: delete the application
                    // First, complete any pending todos for this application
                    if (pendingTodoEvents.length > 0) {
                        await completeTodo(
                            {
                                module: modules[0],
                                completionEvent: pendingTodoEvents,
                            },
                            tx
                        );
                    }

                    await tx.insert(conferenceStatusLog).values({
                        applicationId: id,
                        userEmail: req.user!.email,
                        action: "Delete request accepted by convener",
                    });

                    await tx
                        .delete(conferenceApprovalApplications)
                        .where(eq(conferenceApprovalApplications.id, id));

                    void sendEmail({
                        to: application.userEmail,
                        subject: `Conference Approval: Deletion Request Accepted`,
                        text: `Your deletion request for conference approval application has been accepted. The application has been deleted.\n\nLink: ${environment.FRONTEND_URL}`,
                    });
                }
            } else {
                // Reject the request: clear the flag
                if (action === "edit") {
                    await tx
                        .update(conferenceApprovalApplications)
                        .set({ requestEdit: false })
                        .where(eq(conferenceApprovalApplications.id, id));
                } else {
                    await tx
                        .update(conferenceApprovalApplications)
                        .set({ requestDelete: false })
                        .where(eq(conferenceApprovalApplications.id, id));
                }

                await tx.insert(conferenceStatusLog).values({
                    applicationId: id,
                    userEmail: req.user!.email,
                    action:
                        action === "edit"
                            ? "Edit request rejected by convener"
                            : "Delete request rejected by convener",
                });

                void sendEmail({
                    to: application.userEmail,
                    subject: `Conference Approval: ${action === "edit" ? "Edit" : "Delete"} Request Rejected`,
                    text: `Your ${action} request for conference approval application has been rejected by the DRC Convener.\n\nLink: ${environment.FRONTEND_URL}`,
                });
            }
        });

        res.status(200).send();
    })
);

export default router;
