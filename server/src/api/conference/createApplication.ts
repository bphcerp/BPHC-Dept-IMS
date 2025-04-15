import db from "@/config/db/index.ts";
import {
    conferenceApprovalApplications,
    conferenceGlobal,
} from "@/config/db/schema/conference.ts";
import { fileFields, files } from "@/config/db/schema/form.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { pdfUpload } from "@/config/multer.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { conferenceSchemas, modules } from "lib";
import multer from "multer";

const router = express.Router();

type FileField = (typeof conferenceSchemas.fileFieldNames)[number];

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
            const insertedFileIds: Partial<Record<FileField, number>> = {};

            let insertedFileFields: (typeof fileFields.$inferSelect)[] = [];
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
                    insertedFileIds[field.fieldName! as FileField] = field.id;
                });
            }

            return await tx.insert(conferenceApprovalApplications).values({
                userEmail: req.user!.email,
                ...insertedFileIds,
                ...body,
                state: isDirect ? "DRC Convener" : "DRC Member",
            });
        });

        res.status(200).send();
    })
);

export default router;
