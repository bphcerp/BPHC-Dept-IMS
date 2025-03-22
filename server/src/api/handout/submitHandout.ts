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
import util from "util";

const router = express.Router();

const uploader = util.promisify(pdfUpload.single("handout"));

router.post(
    "/:id",
    checkAccess("ic-upload-handout"),
    asyncHandler(async (req, res, next) => {
        try {
            //@ts-expect-error
            await uploader(req, res);
        } catch (err) {
            if (err instanceof multer.MulterError) {
                return next(new HttpError(HttpCode.BAD_REQUEST, err.message));
            }
            return next(err);
        }
        next();
    }),
    asyncHandler(async (req, res, next) => {
        if (!req.file) {
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "No File Uploaded")
            );
        }
        const { id } = handoutSchemas.submitHandoutParamsSchema.parse(
            req.params
        );
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
                })
                .where(eq(courseHandoutRequests.id, Number(id)));
        });

        res.status(201).json({ success: true });
    })
);

export default router;
