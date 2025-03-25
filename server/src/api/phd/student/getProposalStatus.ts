import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { fileFields, files, fileFieldStatus, applications } from "@/config/db/schema/form.ts";
import { eq, desc, sql } from "drizzle-orm";
import assert from "assert";
import environment from "@/config/environment.ts";

const router = express.Router();

router.get(
  "/",
  checkAccess(),
  asyncHandler(async (req, res) => {
    assert(req.user);
    const email = req.user.email;

    const application = await db.query.applications.findFirst({
      where: eq(applications.userEmail, email),
      orderBy: [desc(applications.createdAt)]
    });

    const documents = await db
      .select({
        id: fileFields.id,
        fieldName: fileFields.fieldName,
        fileName: files.originalName,
        fileUrl: sql`${environment.SERVER_URL}/f/${files.id}`.as("fileUrl"),
        uploadedAt: files.createdAt,
        status: fileFieldStatus.status,
        comments: fileFieldStatus.comments,
        reviewedBy: fileFieldStatus.updatedAs,
      })
      .from(fileFields)
      .innerJoin(files, eq(fileFields.fileId, files.id))
      .leftJoin(fileFieldStatus, eq(fileFields.id, fileFieldStatus.fileField))
      .where(eq(fileFields.userEmail, email))
      .orderBy(desc(fileFieldStatus.id));

    const processedDocuments = documents.map(doc => ({
      id: doc.id,
      fieldName: doc.fieldName ?? "",
      fileName: doc.fileName ?? "", 
      fileUrl: doc.fileUrl,
      status: typeof doc.status === "string" ? doc.status : "pending", 
      comments: doc.comments ?? "",
      reviewedBy: doc.reviewedBy ?? "",
      uploadedAt: doc.uploadedAt,
      needsResubmission: String(doc.status) === "rejected",
    }));
    

    const qualifyingDocs = processedDocuments.filter(doc => doc.fieldName === "qualificationForm");
    const proposalDocs = processedDocuments.filter(doc => doc.fieldName.startsWith("proposalDocument"));

    res.status(200).json({
      success: true,
      documents: {
        qualifyingExam: qualifyingDocs,
        proposal: proposalDocs,
      },
    });
  })
);

export default router;
