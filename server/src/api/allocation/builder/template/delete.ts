import express from "express";
import db from "@/config/db/index.ts";
import { allocationFormTemplate } from "@/config/db/schema/allocationFormBuilder.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { deleteAllocationFormTemplateSchema } from "node_modules/lib/src/schemas/AllocationFormBuilder.ts";
import { eq } from "drizzle-orm";
import { HttpCode, HttpError } from "@/config/errors.ts";

const router = express.Router();

router.delete(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const { id: templateId } = deleteAllocationFormTemplateSchema.parse(
            req.params
        );

        try {
            await db
                .delete(allocationFormTemplate)
                .where(eq(allocationFormTemplate.id, templateId));
        } catch (e: any) {
            if (e.code === "23503")
                return next(
                    new HttpError(
                        HttpCode.CONFLICT,
                        "The template is being used by one or more semesters",
                        e.stack ?? e.message
                    )
                );
            else throw e;
        }

        res.status(204).send("Template deleted successfully");
    })
);

export default router;
