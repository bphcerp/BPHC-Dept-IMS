import db from "@/config/db/index.ts";
import { fileFields, files } from "@/config/db/schema/form.ts";
import { courseHandoutRequests } from "@/config/db/schema/handout.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { pdfUpload } from "@/config/multer.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import assert from "assert";
import { eq } from "drizzle-orm";
import express from "express";
import { handoutSchemas, modules } from "lib";
import multer from "multer";

const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) =>
        // @ts-expect-error Type incompatibility between multer req and express req for some reason
        pdfUpload.single("handout")(req, res, (err) => {
            if (err instanceof multer.MulterError)
                return next(new HttpError(HttpCode.BAD_REQUEST, err.message));
            next(err);
        })
    ),
    asyncHandler(async (req, res, next) => {
        if (!req.file) {
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "No File Uploaded")
            );
        }
        const { id } = handoutSchemas.submitHandoutQuerySchema.parse(req.query);

        await db.transaction(async (tx) => {
            assert(req.user);
            const insertedFile = await tx
                .insert(files)
                .values({
                    userEmail: req.user.email,
                    filePath: req.file!.path,
                    originalName: req.file!.originalname,
                    mimetype: req.file!.mimetype,
                    size: req.file!.size,
                    fieldName: "handout",
                    module: modules[1],
                })
                .returning();

            const insertedFileField = await tx
                .insert(fileFields)
                .values({
                    module: modules[1],
                    userEmail: req.user.email,
                    fileId: insertedFile[0].id,
                    fieldName: "handout",
                })
                .returning();

            await tx
                .update(courseHandoutRequests)
                .set({
                    handoutFilePath: insertedFileField[0].id,
                    status: "pending",
                })
                .where(eq(courseHandoutRequests.id, Number(id)));
        });

        res.status(201).json({ success: true });
    })
);

export default router;
