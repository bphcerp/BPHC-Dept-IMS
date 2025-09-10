import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res) => {
        const students = await db.query.phd.findMany({
            columns: {
                email: true,
            },
        });

        res.status(200).json({ students });
    })
);

export default router;
