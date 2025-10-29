import express from "express";
import db from "@/config/db/index.ts";
import { signatureEntity } from "@/config/db/schema/sign.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";

const router = express.Router();

const createSignatureSchema = z.object({
  signaturePath: z.string().min(1, "signaturePath is required"),
});

router.post(
  "/",
  checkAccess(),
  asyncHandler(async (req, res, next): Promise<void> => {
    const userEmail = req.user?.email;
    const parsed = createSignatureSchema.parse(req.body);

    const [signature] = await db
      .insert(signatureEntity)
      .values({
        id: uuidv4(),
        userEmail: userEmail!,
        signaturePath: parsed.signaturePath,
      })
      .returning();

    if (!signature) {
      return next(new HttpError(HttpCode.INTERNAL_SERVER_ERROR, "Failed to create signature"));
    }

    res.status(201).json({
      message: "Signature uploaded successfully",
      signature,
    });
  })
);

export default router;
