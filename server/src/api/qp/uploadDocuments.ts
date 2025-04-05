import express from "express";
import db from "@/config/db/index.ts";
import { qpSchemas, modules } from "lib";
import { HttpCode } from "@/config/errors.ts";
import { pdfUpload } from "@/config/multer.ts";
import { qpReviewRequests } from "@/config/db/schema/qp.ts";
import { files as dbFiles, fileFields } from "@/config/db/schema/form.ts";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = express.Router();

router.post(
  "/",
  pdfUpload.fields([
    { name: "midSemFile", maxCount: 1 },
    { name: "midSemSolFile", maxCount: 1 },
    { name: "compreFile", maxCount: 1 },
    { name: "compreSolFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { requestId, ficEmail } = qpSchemas.uploadFICDocumentsSchema.parse(req.body);

      console.log("Request ID:", requestId);

      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(HttpCode.BAD_REQUEST).json({
          success: false,
          message: "No files uploaded",
        });
      }

      const uploadedFiles = req.files as Record<string, Express.Multer.File[]>;

      await db.transaction(async (tx) => {
        const insertFile = async (file: Express.Multer.File | undefined) => {
          if (!file) return null;
          
          const [insertedFile] = await tx
            .insert(dbFiles)
            .values({
              userEmail: ficEmail,
              filePath: file.path,
              originalName: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
              fieldName: file.fieldname,
              module: modules[5],
            })
            .returning();

          const [insertedFileField] = await tx
            .insert(fileFields)
            .values({
              userEmail: ficEmail,
              fileId: insertedFile.id,
              fieldName: file.fieldname,
              module: modules[5],
            })
            .returning();

          return insertedFileField?.id || null;
        };

        const midSemFileId = uploadedFiles.midSemFile ? await insertFile(uploadedFiles.midSemFile[0]) : null;
        const midSemSolFileId = uploadedFiles.midSemSolFile ? await insertFile(uploadedFiles.midSemSolFile[0]) : null;
        const compreFileId = uploadedFiles.compreFile ? await insertFile(uploadedFiles.compreFile[0]) : null;
        const compreSolFileId = uploadedFiles.compreSolFile ? await insertFile(uploadedFiles.compreSolFile[0]) : null;

        await tx
          .update(qpReviewRequests)
          .set({
            midSemFileId,
            midSemSolFileId,
            compreFileId,
            compreSolFileId,
            documentsUploaded: true,
          })
          .where(eq(qpReviewRequests.id, Number(requestId)));
      });

      return res.status(HttpCode.OK).json({ 
        success: true, 
        message: "Documents uploaded successfully." 
      });
    } catch (error) {
      console.error("Upload error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(HttpCode.BAD_REQUEST).json({
          success: false,
          message: "Invalid request data",
          errors: error.errors,
        });
      }

      return res.status(HttpCode.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Failed to upload documents",
      });
    }
  }
);

export default router;