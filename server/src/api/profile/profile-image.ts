import express from "express";
import fs from "fs/promises";
import { eq } from "drizzle-orm";
import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { faculty } from "@/config/db/schema/admin.ts";
import {
    imageUpload,
    validateDimensionsAndSaveMiddleware,
} from "@/config/multer.ts";
import { files } from "@/config/db/schema/form.ts";
import { modules } from "lib";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import multer from "multer";
import environment from "@/config/environment.ts";
import { getUserDetails, getUserTableByType } from "@/lib/common/index.ts";

const router = express.Router();

router.get(
    "/",
    asyncHandler(async (req, res) => {
        const user = await getUserDetails(req.user!.email);
        if (!user?.profileFileId) {
            res.json({ profileImage: null });
            return;
        }
        const file = await db.query.files.findFirst({
            where: eq(files.id, user.profileFileId),
        });
        if (!file) {
            db.update(faculty)
                .set({ profileFileId: null })
                .where(eq(faculty.email, req.user!.email));
            res.json({ profileImage: null });
            return;
        }
        res.json({
            profileImage: environment.SERVER_URL + "/f/" + file.id,
        });
    })
);

router.post(
    "/",
    asyncHandler((req, res, next) =>
        imageUpload.single("profileImage")(req, res, (err) => {
            if (err instanceof multer.MulterError)
                return next(new HttpError(HttpCode.BAD_REQUEST, err.message));
            next(err);
        })
    ),
    asyncHandler(validateDimensionsAndSaveMiddleware(256, 256)),
    asyncHandler(async (req, res, next) => {
        if (!req.file) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "Missing file"));
        }
        const [insertedFile] = await db
            .insert(files)
            .values({
                userEmail: req.user!.email,
                module: modules[8],
                originalName: req.file.originalname,
                mimetype: req.file.mimetype,
                filePath: req.file.path,
                size: req.file.size,
            })
            .returning({ id: files.id });
        const user = await getUserDetails(req.user!.email);
        if (!user) {
            return next(new HttpError(HttpCode.NOT_FOUND, "User not found"));
        }
        const toUpdate = getUserTableByType(user.type);
        if (user.profileFileId) {
            await db.transaction(async (tx) => {
                const deleted = await tx
                    .delete(files)
                    .where(eq(files.id, user.profileFileId!))
                    .returning();
                if (deleted.length) await fs.unlink(deleted[0].filePath);
            });
        }
        await db
            .update(toUpdate)
            .set({ profileFileId: insertedFile.id })
            .where(eq(toUpdate.email, req.user!.email));
        res.json({
            success: true,
            profileImage: environment.SERVER_URL + "/f/" + insertedFile.id,
        });
    })
);

router.delete(
    "/",
    asyncHandler(async (req, res) => {
        const user = await getUserDetails(req.user!.email);
        if (!user?.profileFileId) {
            res.json({ success: true });
            return;
        }
        const toUpdate = getUserTableByType(user.type);
        await db.transaction(async (tx) => {
            const deleted = await tx
                .delete(files)
                .where(eq(files.id, user.profileFileId!))
                .returning();
            if (deleted.length) {
                await tx
                    .update(toUpdate)
                    .set({ profileFileId: null })
                    .where(eq(toUpdate.email, user.email));
                await fs.unlink(deleted[0].filePath);
            }
        });
        res.json({ success: true });
    })
);

export default router;
