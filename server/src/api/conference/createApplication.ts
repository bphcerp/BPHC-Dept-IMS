import db from "@/config/db/index.ts";
import {
    conferenceApprovalApplications,
    conferenceGlobal,
    conferenceStatusLog,
} from "@/config/db/schema/conference.ts";
import { files } from "@/config/db/schema/form.ts";
import environment from "@/config/environment.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { pdfUpload } from "@/config/multer.ts";
import { sendBulkEmails } from "@/lib/common/email.ts";
import { getUsersWithPermission } from "@/lib/common/index.ts";
import { createTodos } from "@/lib/todos/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import assert from "assert";
import express from "express";
import { conferenceSchemas, modules } from "lib";
import multer from "multer";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler((req, res, next) =>
        pdfUpload.fields(conferenceSchemas.multerFileFields)(
            req,
            res,
            (err) => {
                if (err instanceof multer.MulterError)
                    return next(
                        new HttpError(HttpCode.BAD_REQUEST, err.message)
                    );
                next(err);
            }
        )
    ),
    asyncHandler(async (req, res) => {
        const body = conferenceSchemas.upsertApplicationBodySchema.parse(
            req.body
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

        // TODO: Cleanup files in case of errors in transaction
        await db.transaction(async (tx) => {
            if (Array.isArray(req.files)) throw new Error("Invalid files");
            const insertedFileIds: Record<string, number> = {};

            if (req.files && Object.entries(req.files).length) {
                const insertedFiles = await tx
                    .insert(files)
                    .values(
                        Object.entries(req.files).map(([fieldName, files]) => {
                            const file = files[0];
                            return {
                                userEmail: req.user!.email,
                                filePath: file.path,
                                originalName: file.originalname,
                                mimetype: file.mimetype,
                                size: file.size,
                                fieldName,
                                module: modules[0],
                            };
                        })
                    )
                    .returning();
                insertedFiles.forEach((file) => {
                    insertedFileIds[`${file.fieldName!}FileId`] = file.id;
                });
            }

            const user = await tx.query.users.findFirst({
                where: (users, { eq }) => eq(users.email, req.user!.email),
            });

            assert(user);

            const [inserted] = await tx
                .insert(conferenceApprovalApplications)
                .values({
                    userEmail: req.user!.email,
                    ...insertedFileIds,
                    ...body,
                    state: isDirect ? "DRC Convener" : "DRC Member",
                })
                .returning();

            await tx.insert(conferenceStatusLog).values({
                applicationId: inserted.id,
                userEmail: req.user!.email,
                action: `Application created`,
            });

            const todoAssignees = (
                await getUsersWithPermission(
                    "conference:application:convener",
                    tx
                )
            ).map((convener) => convener.email);

            await createTodos(
                todoAssignees.map((assignee) => ({
                    module: modules[0],
                    title: "Conference Application",
                    createdBy: req.user!.email,
                    completionEvent: isDirect
                        ? `review ${inserted.id} convener`
                        : `assign members ${inserted.id}`,
                    description: isDirect
                        ? `Review conference application id ${inserted.id} by ${user.name || user.email}`
                        : `Assign members to conference application id ${inserted.id} by ${user.name || user.email}`,
                    assignedTo: assignee,
                    link: `/conference/view/${inserted.id}`,
                })),
                tx
            );

            void sendBulkEmails(
                todoAssignees.map((assignee) => ({
                    to: assignee,
                    subject: `New Conference Approval Request`,
                    text: `You have received a conference approval request by ${user.name || user.email}. To process it please log in to the IMS system.\n\nLink: ${environment.FRONTEND_URL}`,
                }))
            );
        });

        res.status(200).send();
    })
);

export default router;
