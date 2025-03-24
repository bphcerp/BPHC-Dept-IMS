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
import { Request, Response, NextFunction } from "express";

const router = express.Router();

router.post(
  "/",
  checkAccess(),
  (req: Request, res: Response, next: NextFunction) => {
    const upload = pdfUpload.single("qualificationForm");
    upload(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return next(new HttpError(HttpCode.BAD_REQUEST, err.message));
        }
        return next(err);
      }
      next();
    });
  },
  asyncHandler(async (req, res, next) => {
    assert(req.user);
    
    const file = req.file as Express.Multer.File | undefined;
    if (!file) {
      return next(new HttpError(HttpCode.BAD_REQUEST, "Qualification exam form file is required"));
    }
    
    const parsed = phdSchemas.uploadApplicationSchema.safeParse({
      ...req.body,
      fileUrl: file.path,
      formName: file.originalname,
      applicationType: "qualifying_exam",
    });
    
    if (!parsed.success) {
      res.status(400).json({
        success: false,
        error: parsed.error.errors,
      });
      return;
    }
    
    const { qualifyingArea1, qualifyingArea2 } = parsed.data;
    const email = req.user.email;
    
    await db.transaction(async (tx) => {
      const insertedApplication = await tx
        .insert(applications)
        .values({
          module: modules[0],
          userEmail: email,
        })
        .returning();
      
      const applicationId = insertedApplication[0].id;
      
      const insertedFile = await tx
        .insert(files)
        .values({
          userEmail: email,
          filePath: file.path,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          fieldName: "qualificationForm",
          module: modules[0],
        })
        .returning();
      
      await tx
        .insert(fileFields)
        .values({
          fileId: insertedFile[0].id,
          module: modules[0],
          userEmail: email,
          fieldName: "qualificationForm",
        });
      
      await tx
        .insert(textFields)
        .values([
          {
            value: qualifyingArea1,
            userEmail: email,
            module: modules[0],
            fieldName: "qualifyingArea1",
          },
          {
            value: qualifyingArea2,
            userEmail: email,
            module: modules[0],
            fieldName: "qualifyingArea2",
          }
        ]);
      
      const student = await tx.query.phd.findFirst({
        where: eq(phd.email, email),
      });
      
      if (!student) {
        throw new HttpError(HttpCode.NOT_FOUND, "Student not found");
      }
      
      const currentApplications = student.numberOfQeApplication ?? 0;
      
      await tx
        .update(phd)
        .set({
          qualifyingArea1,
          qualifyingArea2,
          numberOfQeApplication: currentApplications + 1,
          qualifyingAreasUpdatedAt: new Date(),
        })
        .where(eq(phd.email, email));
    });
    
    res.status(200).json({
      success: true,
      message: "Application uploaded successfully",
    });
  })
);

export default router;