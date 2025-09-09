import express from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
const router = express.Router();

router.get(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { id } = req.params;

        const template = await db.query.allocationForm.findFirst({
            where: (template, { eq }) =>
                eq(template.id, id)
        });
        if (template) {
            const fields = await db.query.allocationForm.findMany({
                where: (field, { eq }) => eq(field.templateId, id),
                
            });

            res.status(200).json({
                ...template,
                fields,
            });
        }

        else if (!template) {
            res.status(404).json({ message: "Template not found" });
        }             

        
    })
);

export default router;
