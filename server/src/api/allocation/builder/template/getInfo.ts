import express from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";

const router = express.Router();

router.get(
    "/info/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { id } = req.params;

        const templateInfo = await db.query.allocationFormTemplate.findFirst({
            columns: {
                name: true,
                description: true,
                createdBy: true
            },
            where: (template, { eq }) =>
                eq(template.id, id)
        });

        res.status(200).json(templateInfo);
    })
);

export default router;