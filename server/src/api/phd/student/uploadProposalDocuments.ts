import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { applications, files, fileFields, textFields } from "@/config/db/schema/form.ts";
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
    const upload = pdfUpload.fields([
      { name: "proposalDocument1", maxCount: 1 },
      { name: "proposalDocument2", maxCount: 1 },
      { name: "proposalDocument3", maxCount: 1 }
    ]);
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
    
    const uploadedFiles = req.files as {
      [fieldname: string]: Express.Multer.File[];
    } | undefined;
    
    if (!uploadedFiles ||
        !uploadedFiles.proposalDocument1 ||
        !uploadedFiles.proposalDocument2 ||
        !uploadedFiles.proposalDocument3) {
      return next(new HttpError(HttpCode.BAD_REQUEST, "All three proposal documents are required"));
    }
    
    const email = req.user.email;
    
    const { supervisor, coSupervisor1, coSupervisor2 } = phdSchemas.uploadProposalSchema.parse({
      ...req.body,
      fileUrl1: 'placeholder',
      fileUrl2: 'placeholder',
      fileUrl3: 'placeholder',
      formName1: uploadedFiles.proposalDocument1[0].originalname,
      formName2: uploadedFiles.proposalDocument2[0].originalname,
      formName3: uploadedFiles.proposalDocument3[0].originalname,
    });
    
    await db.transaction(async (tx) => {
      const insertedApplication = await tx
        .insert(applications)
        .values({
          module: modules[0],
          userEmail: email,
        })
        .returning();
      
      const applicationId = insertedApplication[0].id;
      
      const fileEntries = [
        { field: "proposalDocument1", file: uploadedFiles.proposalDocument1[0] },
        { field: "proposalDocument2", file: uploadedFiles.proposalDocument2[0] },
        { field: "proposalDocument3", file: uploadedFiles.proposalDocument3[0] }
      ];
      
      for (const { field, file } of fileEntries) {
        const insertedFile = await tx
          .insert(files)
          .values({
            userEmail: email,
            filePath: file.path,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            fieldName: field,
            module: modules[0],
          })
          .returning();
        
        await tx
          .insert(fileFields)
          .values({
            fileId: insertedFile[0].id,
            module: modules[0],
            userEmail: email,
            fieldName: field,
          });
      }
      
      await tx.insert(textFields).values([
        {
          value: supervisor,
          userEmail: email,
          module: modules[0],
          fieldName: "supervisor",
        },
        {
          value: coSupervisor1,
          userEmail: email,
          module: modules[0],
          fieldName: "coSupervisor1",
        },
        {
          value: coSupervisor2,
          userEmail: email,
          module: modules[0],
          fieldName: "coSupervisor2",
        }
      ]);
      
      await tx
        .update(phd)
        .set({
          supervisorEmail: supervisor,
          coSupervisorEmail: coSupervisor1,
          coSupervisorEmail2: coSupervisor2,
        })
        .where(eq(phd.email, email));
    });
    
    res.status(200).json({
      success: true,
      message: "Proposal documents uploaded successfully"
    });
  })
);

export default router;