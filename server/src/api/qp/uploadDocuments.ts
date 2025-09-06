import db from "@/config/db/index.ts";
import { fileFields, files } from "@/config/db/schema/form.ts";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { pdfUpload } from "@/config/multer.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import assert from "assert";
import { eq } from "drizzle-orm";
import express from "express";
import { modules } from "lib";
import multer from "multer";
import { z } from "zod";

const router = express.Router();

const uploadDocumentsSchema = z.object({
  id: z.string().min(1),
  field: z.enum(["midSemQpFile", "midSemSolFile", "compreQpFile", "compreSolFile"])
});

router.post(
  "/",
  asyncHandler(async (req, res, next) =>
    pdfUpload.single("file")(req, res, (err) => {
      if (err instanceof multer.MulterError)
        return next(new HttpError(HttpCode.BAD_REQUEST, err.message));
      next(err);
    })
  ),
  asyncHandler(async (req, res, next) => {
    if (!req.file) {
      return next(new HttpError(HttpCode.BAD_REQUEST, "No File Uploaded"));
    }

    console.log(req.query);
    const { id, field } = uploadDocumentsSchema.parse(req.query);

    const fieldMap = {
      midSemQpFile: "midSemQpFilePath",
      midSemSolFile: "midSemSolFilePath", 
      compreQpFile: "compreQpFilePath",
      compreSolFile: "compreSolFilePath"
    };

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
          fieldName: field,
          module: modules[5],
        })
        .returning();

      const insertedFileField = await tx
        .insert(fileFields)
        .values({
          module: modules[5],
          userEmail: req.user.email,
          fileId: insertedFile[0].id,
          fieldName: field,
        })
        .returning();

      const updateData: Record<string, any> = {
        [fieldMap[field]]: insertedFileField[0].id
      };

      // Check if this is a solution file upload to determine completion
      if (field === "midSemSolFile" || field === "compreSolFile") {
        updateData.documentsUploaded = true;
        updateData.status = "review pending";
        updateData.submittedOn = new Date();
      }

      await tx
        .update(qpReviewRequests)
        .set(updateData)
        .where(eq(qpReviewRequests.id, Number(id)));
    });

    res.status(201).json({ success: true });
  })
);

export default router;
