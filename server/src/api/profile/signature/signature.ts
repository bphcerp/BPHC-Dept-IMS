import express from "express";
import path from "path";
import fs from "fs/promises";
import { eq } from "drizzle-orm";
import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { faculty } from "@/config/db/schema/admin.ts";
import { imageUpload } from "@/config/multer.ts";
import { files } from "@/config/db/schema/form.ts";
import { modules } from "lib";

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      return next(new HttpError(HttpCode.BAD_REQUEST, "Missing email parameter"));
    }

    const [fac] = await db.select().from(faculty).where(eq(faculty.email, email));
    if (!fac || !fac.signatureFileId) {
      return res.json({ signature: null });
    }

    const [file] = await db.query.files.findMany({
      where: eq(files.id, fac.signatureFileId),
    });

    if (!file) {
      return res.json({ signature: null });
    }

    res.json({
      signature: {
        id: file.id,
        originalName: file.originalName,
        url: file.filePath,
        mimetype: file.mimetype,
        size: file.size,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/", imageUpload.single("signature"), async (req, res, next) => {
  try {
    const email = req.body.email;
    if (!email || !req.file) {
      return next(new HttpError(HttpCode.BAD_REQUEST, "Missing email or file"));
    }

    const [fac] = await db.select().from(faculty).where(eq(faculty.email, email));

    // Delete old file if exists
    if (fac?.signatureFileId) {
      const [oldFile] = await db.query.files.findMany({
        where: eq(files.id, fac.signatureFileId),
      });

      if (oldFile) {
        await fs.unlink(path.join(process.cwd(), oldFile.filePath)).catch(() => {});
        await db.delete(files).where(eq(files.id, oldFile.id));
      }
    }

    const insertedFile = await db
      .insert(files)
      .values({
        userEmail: email,
        module: modules[8],
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        filePath: req.file.path,
        size: req.file.size,
      })
      .returning({ id: files.id });

    await db
      .update(faculty)
      .set({ signatureFileId: insertedFile[0].id })
      .where(eq(faculty.email, email));

    res.json({ success: true, fileId: insertedFile[0].id, filePath: req.file.path });
  } catch (err) {
    next(err);
  }
});

router.delete("/", async (req, res, next) => {
  try {
    const email = req.body.email;
    if (!email) {
      return next(new HttpError(HttpCode.BAD_REQUEST, "Missing email"));
    }

    const [fac] = await db.select().from(faculty).where(eq(faculty.email, email));
    if (!fac || !fac.signatureFileId) {
      return res.json({ success: true });
    }

    const [file] = await db.query.files.findMany({
      where: eq(files.id, fac.signatureFileId),
    });

    if (file) {
      await fs.unlink(path.join(process.cwd(), file.filePath)).catch(() => {});
      await db.delete(files).where(eq(files.id, file.id));
    }

    await db.update(faculty).set({ signatureFileId: null }).where(eq(faculty.email, email));

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
