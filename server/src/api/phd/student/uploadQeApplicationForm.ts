import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { applications, textFields, files, fileFields } from "@/config/db/schema/form.ts";
import { eq } from "drizzle-orm";
import assert from "assert";
import { phdSchemas } from "lib";
import { pdfUpload } from "@/config/multer.ts";
import multer from "multer";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { modules } from "lib";
import type { Request, Response, NextFunction } from "express";

const router = express.Router();

router.post(
  "/",
  checkAccess(),
  (req: Request, res: Response, next: NextFunction) => {
    const upload = pdfUpload.single("qualificationForm");
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return next(new HttpError(HttpCode.BAD_REQUEST, err.message));
      } else if (err) {
        return next(new HttpError(HttpCode.INTERNAL_SERVER_ERROR, "File upload failed"));
      }
      next();
    });
  },
  asyncHandler(async (req, res) => {
    assert(req.user);
    const file = req.file;
    if (!file) {
      throw new HttpError(HttpCode.BAD_REQUEST, "PDF file is required");
    }

    const parsed = phdSchemas.uploadApplicationSchema.safeParse({
      ...req.body,
      fileUrl: file.path,
      formName: file.originalname,
      applicationType: "qualifying_exam",
    });

    if (!parsed.success) {
      throw new HttpError(HttpCode.BAD_REQUEST, "Invalid input data");
    }

    const { qualifyingArea1, qualifyingArea2 } = parsed.data;
    const { email } = req.user;
    
    await db.transaction(async (tx) => {
      // 1. Create application record
      const [application] = await tx.insert(applications)
        .values({
          module: modules[4],
          userEmail: email,
          status: "pending",
        })
        .returning();
    
      // 2. Create file record
      const [fileRecord] = await tx.insert(files)
        .values({
          userEmail: email,
          filePath: file.path,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          fieldName: "qualificationForm",
          module: modules[4],
        })
        .returning();
      
      // 3. Create file field record
      await tx.insert(fileFields)
        .values({
          fileId: fileRecord.id,
          module: modules[4],
          userEmail: email,
          fieldName: "qualificationForm",
        });

      // 4. Create text field records for research areas
      await tx.insert(textFields)
        .values([
          {
            value: qualifyingArea1,
            userEmail: email,
            module: modules[4],
            fieldName: "qualifyingArea1",
          },
          {
            value: qualifyingArea2,
            userEmail: email,
            module: modules[4],
            fieldName: "qualifyingArea2",
          }
        ]);
      
      // 5. Update student record
      const student = await tx.query.phd.findFirst({
        where: eq(phd.email, email),
      });

      if (!student) {
        throw new HttpError(HttpCode.NOT_FOUND, "Student record not found");
      }

      await tx.update(phd)
        .set({
          qualifyingArea1,
          qualifyingArea2,
          numberOfQeApplication: (student.numberOfQeApplication ?? 0) + 1,
          qualifyingAreasUpdatedAt: new Date(),
        })
        .where(eq(phd.email, email));
    });

    res.status(HttpCode.OK).json({
      success: true,
      message: "Qualification exam application submitted successfully",
    });
  })
);
  
export default router;