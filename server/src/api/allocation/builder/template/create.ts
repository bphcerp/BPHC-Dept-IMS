import express from "express";
import db from "@/config/db/index.ts";
import {
  allocationFormTemplate,
  allocationFormTemplateField,
} from "@/config/db/schema/allocationFormBuilder.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { 
  allocationFormTemplateSchema, 
} from "node_modules/lib/src/schemas/AllocationFormBuilder.ts";

const router = express.Router();

router.post(
  "/",
  checkAccess(),
  asyncHandler(async (req, res, next) => {
    const parsed = allocationFormTemplateSchema.parse(req.body);
    const [newTemplate] = await db.insert(allocationFormTemplate).values({
      name: parsed.name,
      description: parsed.description,
      createdByEmail: req.user!.email,
    }).returning();

    if (!newTemplate) {
      return next(
        new HttpError(HttpCode.INTERNAL_SERVER_ERROR, "Failed to create form template")
      );
    }

    if (parsed.fields?.length) {
      for (const field of parsed.fields) {
        await db.insert(allocationFormTemplateField).values({
          ...field,
          templateId: newTemplate.id,
        });
      }
    }

    res.status(201).json(newTemplate);
  })
);

export default router;
