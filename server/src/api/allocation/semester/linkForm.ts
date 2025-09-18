import db from "@/config/db/index.ts";
import { semester } from "@/config/db/schema/allocation.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import express from "express";
import { semesterFormLinkSchema } from "node_modules/lib/src/schemas/Allocation.ts";

const router = express.Router();

router.post(
  "/:semesterId",
//   checkAccess(),
  asyncHandler(async (req, res, next) => {

    const { formId } = semesterFormLinkSchema.parse(req.body)
    const { semesterId } = req.params

    const form = db.query.allocationForm.findFirst({
        where: (form, { eq }) => eq(form.id, formId)
    })

    if (!form) return next(new HttpError(HttpCode.NOT_FOUND, "Form not found"))

    await db.update(semester).set({ formId }).where(eq(semester.id, semesterId))

    res.send("Successfully linked form")    
  })
);

export default router;
