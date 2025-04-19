import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { Router } from "express";

const router = Router();

router.get('/', checkAccess(), asyncHandler(async (_req, res) => {
    const labs = await db.query.laboratories.findMany({
        with: {
            technicianInCharge: true,
            facultyInCharge: true,
        }
    })
    res.status(200).json(labs);
}))

export default router;