import express from "express";
import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";

const router = express.Router();

router.get(
  "/:docId/",
  checkAccess(),
  asyncHandler(async (req, res, next) => {
    const { docId } = req.params;

    const document = await db.query.signDocuments.findFirst({
      where: (t, { eq }) => eq(t.id, docId),
    });

    if (!document) {
      next(new HttpError(HttpCode.NOT_FOUND, "Document not found"));
      return;
    }

    const fields = await db.query.signField.findMany({
      where: (f, { eq }) => eq(f.doc_id, docId),
    });

    res.status(200).json({
      documentId: docId,
      fields,
    });
  })
);
export default router;
