import express from "express";
import db from "@/config/db/index.ts";
import {
  allocationFormResponse,
  allocationFormResponseValue,
  allocationFormResponseAnswer,
} from "@/config/db/schema/allocationFormBuilder.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import {
  allocationFormResponseSchema,
} from "node_modules/lib/src/schemas/AllocationFormBuilder.ts";

const router = express.Router();

router.post(
  "/",
  checkAccess(),
  asyncHandler(async (req, res, next) => {
    const parsed = allocationFormResponseSchema.parse(req.body);

    const form = await db.query.allocationForm.findFirst({
      where: (f, { eq }) => eq(f.id, parsed.formId),
    });

    if (!form) {
      return next(new HttpError(HttpCode.BAD_REQUEST, "Form not found"));
    }

    const [newResponse] = await db.insert(allocationFormResponse).values({
      formId: parsed.formId,
      submittedAt: new Date(),
      submittedByEmail: req.user!.email,
    }).returning();

    if (!newResponse) {
      return next(
        new HttpError(HttpCode.INTERNAL_SERVER_ERROR, "Failed to create response")
      );
    }

    for (const ans of parsed.answers) {
      const [responseValue] = await db.insert(allocationFormResponseValue).values({
        responseId: newResponse.id,
        templateFieldId: ans.templateFieldId,
      }).returning();

      if (!responseValue) {
        return next(
          new HttpError(HttpCode.INTERNAL_SERVER_ERROR, "Failed to store response value")
        );
      }

      if (ans.value.optionIds && ans.value.optionIds.length > 0) {
        for (const optId of ans.value.optionIds) {
          await db.insert(allocationFormResponseAnswer).values({
            responseValueId: responseValue.id,
            optionId: optId,
          });
        }
      } else {
        await db.insert(allocationFormResponseAnswer).values({
          responseValueId: responseValue.id,
          textValue: ans.value.textValue ?? null,
          numberValue: ans.value.numberValue ?? null,
          dateValue: ans.value.dateValue ? new Date(ans.value.dateValue) : null,
          courseCode: ans.value.courseCode ?? null,
          preference: ans.value.preference ?? null,
        });
      }
    }

    res.status(201).json(newResponse);
  })
);

export default router;
