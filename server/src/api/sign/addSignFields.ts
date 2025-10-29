import express from "express";
import db from "@/config/db/index.ts";
import { signField } from "@/config/db/schema/sign.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import {signFieldSchema} from "node_modules/lib/src/schemas/Sign.ts"; 
const router = express.Router();

router.post(
  "/:docId/",
  checkAccess(),
  asyncHandler(async (req, res, next) => {
    const { docId } = req.params;

    const document = await db.query.signDocuments.findFirst({
      where: (t, { eq }) => eq(t.id, docId),
    });

    if (!document) {
      return next(new HttpError(HttpCode.NOT_FOUND, "Document not found"));
    }

    const body = Array.isArray(req.body) ? req.body : [req.body];

    const parsedFields = body.map((f) => {
      const parsed = signFieldSchema.safeParse(f);
      if (!parsed.success) {
        throw new HttpError(
          HttpCode.BAD_REQUEST,
          parsed.error.errors[0].message
        );
      }
      return parsed.data;
    });

    const fieldsToInsert = parsedFields.map((field) => ({
      doc_id: docId,
      position: field.position,
    }));

    const inserted = await db.insert(signField).values(fieldsToInsert).returning();

    if (!inserted || inserted.length === 0) {
      return next(
        new HttpError(HttpCode.INTERNAL_SERVER_ERROR, "Failed to add fields")
      );
    }

    res.status(201).json({
      message: "Fields added successfully",
      fields: inserted,
    });
  })
);

export default router;
