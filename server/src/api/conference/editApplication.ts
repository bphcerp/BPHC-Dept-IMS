import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { fileFields, files } from "@/config/db/schema/form.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { eq } from "drizzle-orm";
import { conferenceSchemas, modules } from "lib";
import { pdfUpload } from "@/config/multer.ts";
import multer from "multer";
import {
    conferenceApprovalApplications,
    conferenceGlobal,
    conferenceMemberReviews,
} from "@/config/db/schema/conference.ts";
import { unlink } from "node:fs";
import assert from "node:assert";

const router = express.Router();

type FileField = (typeof conferenceSchemas.fileFieldNames)[number];

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
        const insertedFileIds: Partial<Record<FileField, number>> = {};

        let insertedFileFields: (typeof fileFields.$inferSelect)[] = [];

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
            }

            for (const fileFieldName of conferenceSchemas.fileFieldNames) {
                const updatedFile = insertedFiles.filter(
                    (x) => x.fieldName === fileFieldName
                );

                const fileFieldID = application[fileFieldName];
                if (fileFieldID === null) {
                    if (updatedFile.length > 0) {
                        assert(updatedFile[0].id !== undefined);
                        // File did not previously exist, so make a fileField
                        insertedFileFields.push(
                            (
                                await tx
                                    .insert(fileFields)
                                    .values([
                                        {
                                            fileId: updatedFile[0].id,
                                            module: updatedFile[0].module,
                                            userEmail: updatedFile[0].userEmail,
                                            fieldName: updatedFile[0].fieldName,
                                        },
                                    ])
                                    .returning()
                            )[0]
                        );
                    }
                    continue;
                }

                // Weird drizzle bug where the return type doesn't have the right type
                const oldFile = (await tx.query.fileFields.findFirst({
                    where: eq(fileFields.id, fileFieldID),
                    with: {
                        file: true,
                    },
                })) as typeof fileFields.$inferSelect & {
                    file: typeof files.$inferSelect;
                };

                if (updatedFile.length === 0) {
                    // Delete fileField, and null out the fileField on application
                    await tx
                        .update(conferenceApprovalApplications)
                        .set({
                            [fileFieldName]: null,
                        })
                        .where(eq(conferenceApprovalApplications.id, id));
                    await tx.delete(files).where(eq(files.id, oldFile.file.id));
                } else {
                    // Else, update the file we uploaded and delete the old file entry
                    await tx
                        .update(fileFields)
                        .set({
                            fileId: updatedFile[0].id,
                        })
                        .where(eq(fileFields.id, fileFieldID));
                    await tx.delete(files).where(eq(files.id, oldFile.file.id));
                }

                // Delete the old file
                unlink(oldFile.file.filePath, (err) => {
                    if (err) throw err;
                });
            }
            insertedFileFields.forEach((field) => {
                insertedFileIds[field.fieldName! as FileField] = field.id;
            });

            await tx
                .delete(conferenceMemberReviews)
                .where(eq(conferenceMemberReviews.applicationId, id));

            return await tx
                .update(conferenceApprovalApplications)
                .set({
                    userEmail: req.user!.email,
                    ...insertedFileIds,
                    ...body,
                    state: isDirect ? "DRC Convener" : "DRC Member",
                })
                .where(eq(conferenceApprovalApplications.id, id))
                .returning();
        });

        res.status(200).send();
    })
);

export default router;
