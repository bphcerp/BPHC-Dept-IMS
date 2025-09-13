import express from "express";
import db from "@/config/db/index.ts";
import {
  allocationForm,
  allocationFormTemplateField,
} from "@/config/db/schema/allocationFormBuilder.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { 
  allocationFormSchema 
} from "node_modules/lib/src/schemas/AllocationFormBuilder.ts";


const router = express.Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
      const parsed = allocationFormSchema.parse(req.body);
  
      const template = await db.query.allocationFormTemplate.findFirst({
        where: (t, { eq }) => eq(t.id, parsed.templateId),
      });
  
      if (!template) {
        return next(new HttpError(HttpCode.BAD_REQUEST, "Template not found"));
      }
  
      const [newForm] = await db.insert(allocationForm).values({
        ...parsed,
        createdByEmail: req.user!.email,
      }).returning();
  
      if (!newForm) {
        return next(new HttpError(HttpCode.INTERNAL_SERVER_ERROR, "Failed to create form"));
      }
  
      res.status(201).json(newForm);
    })
  );
  
  export default router;