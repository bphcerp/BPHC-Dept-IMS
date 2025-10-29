import express from "express";
import db from "@/config/db/index.ts";
import { signerResponse } from "@/config/db/schema/sign.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import {signRequestSchema} from "node_modules/lib/src/schemas/Sign.ts"; 


const router = express.Router();

router.post(
  "/:id/",
  checkAccess(),
  asyncHandler(async (req, res, next): Promise<void> => {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return next(new HttpError(HttpCode.UNAUTHORIZED, "User not authenticated"));
    }

    const documentId = req.params.id;
    const parsed = signRequestSchema.parse(req.body);

    const signerDoc = await db.query.signerDocuments.findFirst({
      where: (t, { eq, and }) => and(eq(t.userId, userEmail), eq(t.documentId, documentId)),
    });

    if (!signerDoc) {
      return next(
        new HttpError(HttpCode.FORBIDDEN, "You are not assigned as a signer for this document")
      );
    }

    const field = await db.query.signField.findFirst({
      where: (t, { eq, and }) => and(eq(t.id, parsed.signFieldId), eq(t.doc_id, documentId)),
    });

    if (!field) {
      return next(
        new HttpError(HttpCode.BAD_REQUEST, "Invalid field or field does not belong to this document")
      );
    }

    const [response] = await db
      .insert(signerResponse)
      .values({
        signFieldId: parsed.signFieldId,
        signedBy: userEmail,
        type: parsed.type,
        signatureId: parsed.signatureId,
      })
      .returning();

    if (!response) {
      return next(new HttpError(HttpCode.INTERNAL_SERVER_ERROR, "Failed to save signature"));
    }

    res.status(201).json({
      message: "Field signed successfully",
      response,
    });
  })
);

export default router;
