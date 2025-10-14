import express from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
const router = express.Router();

router.get(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const { id } = req.params;

        const template = await db.query.allocationFormTemplate.findFirst({
            with: {
                fields: {
                    with: {
                        group: true
                    }
                },
                createdBy: {
                    columns: { name: true, email: true },
                },
            },
            where: (template, { eq }) => eq(template.id, id),
        });

        if (!template)
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Template not found")
            );

        res.status(200).json(template);
    })
);

export default router;
