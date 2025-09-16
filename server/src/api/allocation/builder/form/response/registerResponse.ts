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
    asyncHandler(async (req, res, next) => {
        const parsed = allocationFormResponseSchema.parse(req.body);

        const form = await db.query.allocationForm.findFirst({
            where: (f, { eq }) => eq(f.id, parsed.formId),
        });

        if (!form) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "Form not found"));
        }

        const formResponseExists = await db.query.allocationFormResponse.findFirst({
            where: (fr, { and, eq }) =>
                and(
                    eq(fr.formId, parsed.formId),
                    eq(fr.submittedByEmail, req.user!.email)
                ),
        });

        if (formResponseExists) {
            return next(new HttpError(HttpCode.BAD_REQUEST, "You have already submitted a response for this form"));
        }

        await db.transaction(async (tx) => {
            const insertPromises = parsed.response.map((field) =>
                tx.insert(allocationFormResponse).values({
                    formId: parsed.formId,
                    submittedAt: new Date(),
                    submittedByEmail: req.user!.email,
                    ...field
                })
            );
            await Promise.all(insertPromises);
        });

        res.status(201).send({ message: "Form response registered successfully"});
    })
);

export default router;
