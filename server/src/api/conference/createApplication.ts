import db from "@/config/db/index.ts";
import { conferenceApprovalApplications } from "@/config/db/schema/conference.ts";
import {
    applications,
    dateFields,
    fileFields,
    files,
    numberFields,
    textFields,
} from "@/config/db/schema/form.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { pdfUpload } from "@/config/multer.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { conferenceSchemas, modules } from "lib";
import multer from "multer";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(
        async (req, res, next) =>
            await pdfUpload.fields(
                conferenceSchemas.multerFileFields
                // @ts-expect-error Type incompatibility between multer req and express req for some reason
            )(req, res, (err) => {
                if (err instanceof multer.MulterError)
                    return next(
                        new HttpError(HttpCode.BAD_REQUEST, err.message)
                    );
                next(err);
            })
    ),
    asyncHandler(async (req, res) => {
        const body = conferenceSchemas.applyForConferenceBodySchema.parse(
            req.body
        );
        await db.transaction(async (tx) => {
            if (Array.isArray(req.files)) throw new Error("Invalid files");
            const insertedIds: Record<string, number> = {};

            let insertedFileFields: (typeof fileFields.$inferSelect)[] = [];
            if (req.files) {
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
                insertedFileFields = await tx
                    .insert(fileFields)
                    .values(
                        insertedFiles.map((file) => ({
                            fileId: file.id,
                            module: file.module,
                            userEmail: file.userEmail,
                            fieldName: file.fieldName,
                        }))
                    )
                    .returning();
                insertedFileFields.forEach((field) => {
                    insertedIds[field.fieldName!] = field.id;
                });
            }

            const bodyTextFields: [string, string][] = Object.entries(body)
                .filter(([_key, val]) => typeof val === "string")
                .map(([key, value]) => [key, value as string]);
            const bodyNumberFields: [string, number][] = Object.entries(body)
                .filter(([_key, val]) => typeof val === "number")
                .map(([key, value]) => [key, value as number]);

            if (bodyTextFields.length) {
                const insertedTextFields = await tx
                    .insert(textFields)
                    .values(
                        bodyTextFields.map(([key, value]) => ({
                            value,
                            userEmail: req.user!.email,
                            module: modules[0],
                            fieldName: key,
                        }))
                    )
                    .returning();
                insertedTextFields.forEach((field) => {
                    insertedIds[field.fieldName!] = field.id;
                });
            }

            if (bodyNumberFields.length) {
                const insertedNumberFields = await tx
                    .insert(numberFields)
                    .values(
                        bodyNumberFields.map(([key, value]) => ({
                            value: value.toString(),
                            userEmail: req.user!.email,
                            module: modules[0],
                            fieldName: key,
                        }))
                    )
                    .returning();
                insertedNumberFields.forEach((field) => {
                    insertedIds[field.fieldName!] = field.id;
                });
            }

            const insertedDate = await tx
                .insert(dateFields)
                .values({
                    value: body.date,
                    userEmail: req.user!.email,
                    module: modules[0],
                    fieldName: "date",
                })
                .returning();
            insertedIds.date = insertedDate[0].id;

            const insertedApplication = await tx
                .insert(applications)
                .values({
                    module: modules[0],
                    userEmail: req.user!.email,
                })
                .returning();

            return await tx.insert(conferenceApprovalApplications).values({
                applicationId: insertedApplication[0].id,
                ...insertedIds,
            });
        });

        res.status(200).send();
    })
);

export default router;
