import express from "express";
import db from "@/config/db/index.ts";
import {
  signDocuments,
  signerDocuments,
} from "@/config/db/schema/sign.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import {signDocumentsSchema} from "node_modules/lib/src/schemas/Sign.ts"; 

const router = express.Router();

router.post(
  "/",
  checkAccess(), 
  asyncHandler(async (req, res, next) => {
    const parsed = signDocumentsSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(
        new HttpError(HttpCode.BAD_REQUEST, parsed.error.errors[0].message)
      );
    }
    const data = parsed.data;

    const [newDoc] = await db
      .insert(signDocuments)
      .values({
        ...data
      })
      .returning();

    if (!newDoc) {
      return next(
        new HttpError(HttpCode.INTERNAL_SERVER_ERROR, "Failed to create document")
      );
    }

    const signees = Array.isArray(data.requestedSignees)
      ? data.requestedSignees
      : [data.requestedSignees];

    await db.insert(signerDocuments).values(
      signees.map((email) => ({
        userId: email,
        documentId: newDoc.id,
      }))
    );


    res.status(201).json({
      message: "Document uploaded successfully",
      document: newDoc,
    });
  })
);

export default router;
