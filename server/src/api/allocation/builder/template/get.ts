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

        const template = await db.query.allocationFormTemplate.findFirst({
            where: (template, { eq }) =>
                eq(template.id, id)
        });

        res.status(200).json(template);
    })
);

export default router;
