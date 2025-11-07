import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { conferenceSchemas, modules } from "lib";
import { getApplicationById } from "@/lib/conference/index.ts";
import db from "@/config/db/index.ts";
import {
    conferenceApplicationMembers,
    conferenceStatusLog,
} from "@/config/db/schema/conference.ts";
import { notInArray, eq, and } from "drizzle-orm";
import { checkAccess } from "@/middleware/auth.ts";
import { completeTodo, createTodos } from "@/lib/todos/index.ts";
import { getUsersWithPermission } from "@/lib/common/index.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";

const router = express.Router();

router.post(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const id = parseInt(req.params.id);
        if (isNaN(id) || id <= 0)
            return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid id"));

        const { memberEmails } = conferenceSchemas.setMembersBodySchema.parse(
            req.body
        );

        const application = await getApplicationById(id);

        if (!application)
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Application not found")
            );

        if (application.state !== "DRC Member")
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Cannot edit members at this stage"
                )
            );

        const allMembers = new Set(
            (await getUsersWithPermission("conference:application:member")).map(
                (member) => member.email
            )
        );

        const areMembersValid = memberEmails.every((email) =>
            allMembers.has(email)
        );

        if (!areMembersValid)
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Invalid members provided"
            );

        await db.transaction(async (tx) => {
            const newlyAddedMembers = await tx
                .insert(conferenceApplicationMembers)
                .values(
                    memberEmails.map((email) => ({
                        applicationId: application.id,
                        memberEmail: email,
                    }))
                )
                .onConflictDoNothing()
                .returning();

            await createTodos(
                newlyAddedMembers.map((member) => ({
                    module: modules[0],
                    title: "Conference Application Review",
                    createdBy: req.user!.email,
                    completionEvent: `review ${id} member`,
                    description: `Review conference application id ${id} by ${application.user.name || application.userEmail}`,
                    assignedTo: member.memberEmail,
                    link: `/conference/view/${id}`,
                })),
                tx
            );

            void sendBulkEmails(
                newlyAddedMembers.map((member) => ({
                    to: member.memberEmail,
                    subject: `New Conference Approval Request`,
                    text: `The DRC Convener has forwarded a conference approval request. To evaluate it, please log in to the IMS system.\n\nLink: ${process.env.FRONTEND_URL}`,
                }))
            );

            const deletedMembers = await tx
                .delete(conferenceApplicationMembers)
                .where(
                    and(
                        eq(conferenceApplicationMembers.applicationId, id),
                        notInArray(
                            conferenceApplicationMembers.memberEmail,
                            memberEmails
                        )
                    )
                )
                .returning();

            await completeTodo(
                {
                    module: modules[0],
                    completionEvent: `review ${id} member`,
                    assignedTo: deletedMembers.map((m) => m.memberEmail),
                },
                tx
            );

            await completeTodo(
                {
                    module: modules[0],
                    completionEvent: `assign members ${id}`,
                },
                tx
            );

            await tx.insert(conferenceStatusLog).values({
                applicationId: application.id,
                userEmail: req.user!.email,
                action: `Members Assigned/Updated`,
            });
        });
        res.status(200).send();
    })
);

export default router;
