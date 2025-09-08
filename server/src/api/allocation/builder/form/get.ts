import express from "express";
import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const forms = await db.query.allocationForm.findMany();
        res.status(200).json(forms);
    })
);

router.get(
    "/:id",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { id } = req.params;

        const form = await db.query.allocationForm.findFirst({
            where: (form, { eq }) =>
                eq(form.id, id)
        });

        res.status(200).json(form);
    })
);

export default router;
