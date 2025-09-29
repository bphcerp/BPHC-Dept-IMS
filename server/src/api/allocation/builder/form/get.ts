import express from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
const router = express.Router();

router.get(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const { id } = req.params;
        const { checkUserResponse } = req.query;

        const form = await db.query.allocationForm.findFirst({
            columns: {
                templateId: false,
            },
            with: {
                template: {
                    with: {
                        fields: true,
                    },
                },
                createdBy: {
                    columns: {
                        name: true,
                        email: true,
                    },
                },
            },
            where: (form, { eq }) => eq(form.id, id),
        });

        if (!form)
            return next(new HttpError(HttpCode.NOT_FOUND, "Form not found"));

        let userAlreadyResponded;

        if (checkUserResponse === "true")
            userAlreadyResponded =
                await db.query.allocationFormResponse.findFirst({
                    where: (formResponse, { eq, and }) =>
                        and(
                            eq(formResponse.formId, form.id),
                            eq(formResponse.submittedByEmail, req.user!.email)
                        ),
                });

        res.status(200).json({
            ...form,
            ...( checkUserResponse === 'true' ? {
                userAlreadyResponded
            } : {} )
        });
    })
);

export default router;
