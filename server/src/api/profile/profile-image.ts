import express from "express";
import fs from "fs/promises";
import { eq } from "drizzle-orm";
import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { faculty } from "@/config/db/schema/admin.ts";
import { imageUpload } from "@/config/multer.ts";
import { files } from "@/config/db/schema/form.ts";
import { modules } from "lib";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import multer from "multer";
import environment from "@/config/environment.ts";

const router = express.Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const fac = await db.query.faculty.findFirst({
      where: (cols, { eq }) => eq(cols.email, req.user!.email),
    });
    if (!fac?.profileFileId) {
      res.json({ profileImage: null });
      return;
    }
    const file = await db.query.files.findFirst({
      where: eq(files.id, fac.profileFileId),
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
    const fac = await db.query.faculty.findFirst({
      where: (cols, { eq }) => eq(cols.email, req.user!.email),
    });
    if (!fac)
      return next(new HttpError(HttpCode.NOT_FOUND, "Faculty not found"));
    if (fac.profileFileId) {
      await db.transaction(async (tx) => {
        const deleted = await tx
          .delete(files)
          .where(eq(files.id, fac.profileFileId!))
          .returning();
        if (deleted.length) await fs.unlink(deleted[0].filePath);
      });
    }
    await db
      .update(faculty)
      .set({ profileFileId: insertedFile.id })
      .where(eq(faculty.email, req.user!.email));
    res.json({
      success: true,
      profileImage: environment.SERVER_URL + "/f/" + insertedFile.id,
    });
  })
);

router.delete(
  "/",
  asyncHandler(async (req, res) => {
    const email = req.user!.email;
    const fac = await db.query.faculty.findFirst({
      where: (cols, { eq }) => eq(cols.email, req.user!.email),
    });
    if (!fac?.profileFileId) {
      res.json({ success: true });
      return;
    }
    await db.transaction(async (tx) => {
      const deleted = await tx
        .delete(files)
        .where(eq(files.id, fac.profileFileId!))
        .returning();
      if (deleted.length) {
        await tx
          .update(faculty)
          .set({ profileFileId: null })
          .where(eq(faculty.email, email));
        await fs.unlink(deleted[0].filePath);
      }
    });
    res.json({ success: true });
  })
);

export default router; 