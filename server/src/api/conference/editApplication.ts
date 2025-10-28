import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { files } from "@/config/db/schema/form.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { eq, inArray } from "drizzle-orm";
import { conferenceSchemas, modules } from "lib";
import { pdfUpload } from "@/config/multer.ts";
import multer from "multer";
import {
    conferenceApprovalApplications,
    conferenceGlobal,
    conferenceMemberReviews,
} from "@/config/db/schema/conference.ts";
import { unlink } from "fs/promises";
import { getUsersWithPermission } from "@/lib/common/index.ts";
import { completeTodo, createTodos } from "@/lib/todos/index.ts";

const router = express.Router();

router.post(
    "/:id",
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
    asyncHandler(async (req, res, next) => {
        const newFileIds: Record<string, number | null> = {};

        const body = conferenceSchemas.upsertApplicationBodySchema.parse(
            req.body
        );

        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid id"));
        }

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

        const application =
            await db.query.conferenceApprovalApplications.findFirst({
                where: (app, { eq }) => eq(app.id, id),
                with: {
                    detailsOfEvent: true,
                    firstPageOfPaper: true,
                    letterOfInvitation: true,
                    otherDocuments: true,
                    reviewersComments: true,
                },
            });
        if (!application) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Application not found")
            );
        }

        if (
            application?.userEmail !== req.user?.email ||
            application.state !== "Faculty"
        ) {
            return next(
                new HttpError(
                    HttpCode.FORBIDDEN,
                    "Not authorized to edit this application"
                )
            );
        }
        let insertedFiles: (typeof files.$inferInsert)[] = [];

        // TODO: Cleanup files in case of errors in transaction
        await db.transaction(async (tx) => {
            if (Array.isArray(req.files)) throw new Error("Invalid files");
            if (req.files && Object.entries(req.files).length) {
                insertedFiles = await tx
                    .insert(files)
                    .values(
                        Object.entries(req.files).map(
                            ([fieldName, uploads]) => {
                                const file = uploads[0];
                                return {
                                    userEmail: req.user!.email,
                                    filePath: file.path,
                                    originalName: file.originalname,
                                    mimetype: file.mimetype,
                                    size: file.size,
                                    fieldName,
                                    module: modules[0],
                                };
                            }
                        )
                    )
                    .returning();
            }

            const fileIdsToDelete = conferenceSchemas.fileFieldNames.reduce(
                (acc, fileField) => {
                    if (!(fileField in req.body) && application[fileField]) {
                        acc.push(application[fileField].id);
                        newFileIds[fileField + "FileId"] = null;
                    }
                    return acc;
                },
                [] as number[]
            );

            insertedFiles.forEach((file) => {
                newFileIds[file.fieldName! + "FileId"] = file.id!;
            });

            await tx
                .delete(conferenceMemberReviews)
                .where(eq(conferenceMemberReviews.applicationId, id));

            await tx
                .update(conferenceApprovalApplications)
                .set({
                    userEmail: req.user!.email,
                    ...newFileIds,
                    ...body,
                    state: isDirect ? "DRC Convener" : "DRC Member",
                })
                .where(eq(conferenceApprovalApplications.id, id))
                .returning();

            const deleted = await tx
                .delete(files)
                .where(inArray(files.id, fileIdsToDelete))
                .returning();
            for (const file of deleted) {
                void unlink(file.filePath).catch(() => undefined);
            }

            await completeTodo({
                module: modules[0],
                completionEvent: `edit ${id}`,
            });

            const todoAssignees = await getUsersWithPermission(
                isDirect
                    ? "conference:application:review-application-convener"
                    : "conference:application:review-application-member",
                tx
            );

            await createTodos(
                todoAssignees.map((assignee) => ({
                    module: modules[0],
                    title: "Conference Application",
                    createdBy: req.user!.email,
                    completionEvent: `review ${id} ${isDirect ? "convener" : "member"}`,
                    description: `Review conference application id ${id} by ${req.user!.email}`,
                    assignedTo: assignee.email,
                    link: `/conference/view/${id}`,
                })),
                tx
            );
        });

        res.status(200).send();
    })
);

export default router;
