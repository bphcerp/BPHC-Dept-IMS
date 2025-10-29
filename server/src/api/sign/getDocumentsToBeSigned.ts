import express from "express";
import db from "@/config/db/index.ts";
import { signerDocuments} from "@/config/db/schema/sign.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import { HttpCode, HttpError } from "@/config/errors.ts";

const router = express.Router();


router.get(
  "/",
  checkAccess(),
  asyncHandler(async (req, res, next): Promise<void> => {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return next(new HttpError(HttpCode.UNAUTHORIZED, "User not authenticated"));
    }

    const signerDocs = await db.query.signerDocuments.findMany({
      where: eq(signerDocuments.userId, userEmail),
      with: {
        document: true, 
      },
    });

    const documents = signerDocs.map((sd) => ({
      documentId: sd.document.id,
      title: sd.document.title,
      status: sd.document.status,
      docPath: sd.document.docPath,
      createdAt: sd.document.createdAt,
      createdBy: sd.document.createdBy,
    }));

    res.status(200).json({
      count: documents.length,
      documents,
    });
  })
);

export default router;
