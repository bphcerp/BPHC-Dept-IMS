import express from "express";
import db from "@/config/db/index.ts";
import { allocationFormResponse } from "@/config/db/schema/allocationFormBuilder.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { allocationFormResponseSchema } from "node_modules/lib/src/schemas/AllocationFormBuilder.ts";

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

        const [newResponse] = await db
            .insert(allocationFormResponse)
            .values({
                formId: parsed.formId,
                submittedAt: new Date(),
                submittedByEmail: req.user!.email,
            })
            .returning();

        if (!newResponse) {
            return next(
                new HttpError(
                    HttpCode.INTERNAL_SERVER_ERROR,
                    "Failed to create response"
                )
            );
        }

        await db.transaction(async (tx) => {
            const insertPromises = parsed.response.map((field) =>
                tx.insert(allocationFormResponse).values({
                    formId: parsed.formId,
                    submittedAt: new Date(),
                    submittedByEmail: req.user!.email,
                    templateFieldId: field.templateFieldId,
                    teachingAllocation: field.teachingAllocation,
                    courseCode: field.courseCode,
                    preference: field.preference,
                })
            );
            await Promise.all(insertPromises);
        });

        res.status(201).send();
    })
);

export default router;
