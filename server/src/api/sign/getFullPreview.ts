import express from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";

const router = express.Router();

router.get(
  "/",
  checkAccess(),
  asyncHandler(async (req, res, next) => {

    const documentId = req.params.id;

    const document = await db.query.signDocuments.findFirst({
      where: (t, { eq }) => eq(t.id, documentId),
      with: {
        signFields: {
          with: {
            signerResponses: {
              with: {
                signature: true,
                signedByUser: true,
              },
            },
          },
        },
      },
    });

    if (!document) {
      return next(new HttpError(HttpCode.NOT_FOUND, "Document not found"));
    }

    const fields = document.signFields.map((field) => {
      const response = field.signerResponses?.[0]; 
      return {
        id: field.id,
        position: field.position,
        signedBy: response?.signedByUser?.email ?? null,
        signaturePath: response?.signature?.signaturePath ?? null,
      };
    });

    res.status(200).json({
      document: {
        id: document.id,
        title: document.title,
        docPath: document.docPath,
      },
      fields,
    });
  })
);

export default router;
