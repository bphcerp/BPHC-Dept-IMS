import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import {
    textFields,
    numberFields,
    dateFields,
    type fileFields,
    files,
} from "@/config/db/schema/form.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { eq, and } from "drizzle-orm";
import { conferenceSchemas } from "lib";
import { pdfUpload } from "@/config/multer.ts";
import multer from "multer";

const router = express.Router();

router.post(
    "/:type/:id",
    asyncHandler(
        async (req, res, next) =>
            // @ts-expect-error Type incompatibility between multer req and express req for some reason
            await pdfUpload.single("value")(req, res, (err) => {
                if (err instanceof multer.MulterError)
                    return next(
                        new HttpError(HttpCode.BAD_REQUEST, err.message)
                    );
                next(err);
            })
    ),
    asyncHandler(async (req, res, next) => {
        // TODO: add code to cleanup files in case of errors
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "Invalid id"));
        }

        const rawType = req.params.type;
        const type = conferenceSchemas.fieldTypes.parse(rawType);

        if ((type === "file" && !req.file) || (type !== "file" && req.file)) {
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "Type and value inconsistent"
                )
            );
        }

        if (req.file !== undefined) {
            const originalFile = await db.query.fileFields.findFirst({
                where: (field) =>
                    and(eq(field.id, id), eq(field.userEmail, req.user!.email)),
                with: {
                    file: true,
                },
            });
            if (!originalFile) {
                return next(
                    new HttpError(
                        HttpCode.NOT_FOUND,
                        "Could not find original file"
                    )
                );
            }
            await db
                .update(files)
                .set({
                    filePath: req.file.path,
                    originalName: req.file.originalname,
                    mimetype: req.file.mimetype,
                    size: req.file.size,
                })
                .where(
                    eq(
                        files.id,
                        (
                            originalFile.file as unknown as typeof fileFields.$inferSelect
                        ).id
                    )
                );
        } else {
            // TODO: Add check to check if user owns field
            const updated = conferenceSchemas.editFieldBodySchema.parse(
                req.body
            );

            switch (type) {
                case "text":
                    await db
                        .update(textFields)
                        .set(updated as { value: string })
                        .where(eq(textFields.id, id));
                    break;

                case "number":
                    await db
                        .update(numberFields)
                        .set({ value: updated.value.toString() })
                        .where(eq(numberFields.id, id));
                    break;

                case "date":
                    await db
                        .update(dateFields)
                        .set(updated as { value: Date })
                        .where(eq(dateFields.id, id));
                    break;

                default:
                    return next(
                        new HttpError(
                            HttpCode.BAD_REQUEST,
                            "Invalid field type"
                        )
                    );
            }
        }

        res.status(200).send();
    })
);

export default router;
