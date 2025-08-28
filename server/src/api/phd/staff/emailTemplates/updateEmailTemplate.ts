import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phdEmailTemplates } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";
import { phdSchemas } from "lib";
import { HttpCode, HttpError } from "@/config/errors.ts";

const router = express.Router();

// UPDATE an email template
router.put(
    "/:name",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const { name } = req.params;
        const { subject, body } = phdSchemas.updateEmailTemplateSchema.parse(
            req.body
        );

        const result = await db
            .update(phdEmailTemplates)
            .set({ subject, body, updatedAt: new Date() })
            .where(eq(phdEmailTemplates.name, name))
            .returning();

        if (result.length === 0) {
            return next(
                new HttpError(HttpCode.NOT_FOUND, "Template not found")
            );
        }

        res.status(200).json({
            success: true,
            message: "Template updated successfully",
        });
    })
);

export default router;
