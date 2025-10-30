import db from "@/config/db/index.ts";
import { getUserDetails } from "../common/index.ts";
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
import { users } from "@/config/db/schema/admin.ts";

const removeFileIfExists = async (path: string) => {
    try {
        await fs.unlink(path);
    } catch (error) {
        if ((error as NodeJS.ErrnoException)?.code !== "ENOENT") throw error;
    }
};

export const getProfileImage = async (email: string) => {
    const user = await getUserDetails(email);
    if (!user?.profileFileId) {
        return null;
    }
    const file = await db.query.files.findFirst({
        where: eq(files.id, user.profileFileId),
    });
    if (!file) {
        db.update(users)
            .set({ profileFileId: null })
            .where(eq(users.email, email));

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
    return await db.transaction(async (tx) => {
        const [insertedFile] = await tx
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
        const user = await getUserDetails(email, tx);
        if (!user) {
            throw new HttpError(HttpCode.NOT_FOUND, "User not found");
        }
        if (user.profileFileId) {
            const deleted = await tx
                .delete(files)
                .where(eq(files.id, user.profileFileId!))
                .returning();
            if (deleted.length) await removeFileIfExists(deleted[0].filePath);
        }
        await tx
            .update(users)
            .set({ profileFileId: insertedFile.id })
            .where(eq(users.email, email));
        return insertedFile.id;
    });
};

export const deleteProfileImage = async (email: string) => {
    const user = await getUserDetails(email);
    if (!user?.profileFileId) {
        return;
    }
    await db.transaction(async (tx) => {
        const deleted = await tx
            .delete(files)
            .where(eq(files.id, user.profileFileId!))
            .returning();
        if (deleted.length) {
            await tx
                .update(users)
                .set({ profileFileId: null })
                .where(eq(users.email, user.email));
            await removeFileIfExists(deleted[0].filePath);
        }
    });
};
