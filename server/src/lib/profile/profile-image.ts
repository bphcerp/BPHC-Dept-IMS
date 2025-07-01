import db from "@/config/db/index.ts";
import { getUserDetails, getUserTableByType } from "../common/index.ts";
import { eq } from "drizzle-orm";
import { files } from "@/config/db/schema/form.ts";
import { modules } from "lib";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import {
    imageUpload,
    validateDimensionsAndSaveMiddleware,
} from "@/config/multer.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import multer from "multer";
import fs from "fs/promises";

export const getProfileImage = async (email: string) => {
    const user = await getUserDetails(email);
    if (!user?.profileFileId) {
        return null;
    }
    const toUpdate = getUserTableByType(user.type);
    const file = await db.query.files.findFirst({
        where: eq(files.id, user.profileFileId),
    });
    if (!file) {
        db.update(toUpdate)
            .set({ profileFileId: null })
            .where(eq(toUpdate.email, email));

        return null;
    }
    return file.id;
};

export const profileImageFileMiddleware = [
    asyncHandler((req, res, next) =>
        imageUpload.single("profileImage")(req, res, (err) => {
            if (err instanceof multer.MulterError)
                return next(new HttpError(HttpCode.BAD_REQUEST, err.message));
            next(err);
        })
    ),
    asyncHandler(validateDimensionsAndSaveMiddleware(256, 256)),
];

export const updateProfileImage = async (
    email: string,
    file: Express.Multer.File
) => {
    const [insertedFile] = await db
        .insert(files)
        .values({
            userEmail: email,
            module: modules[8],
            originalName: file.originalname,
            mimetype: file.mimetype,
            filePath: file.path,
            size: file.size,
        })
        .returning({ id: files.id });
    const user = await getUserDetails(email);
    if (!user) {
        throw new HttpError(HttpCode.NOT_FOUND, "User not found");
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
        .where(eq(toUpdate.email, email));
    return insertedFile.id;
};

export const deleteProfileImage = async (email: string) => {
    const user = await getUserDetails(email);
    if (!user?.profileFileId) {
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
};
