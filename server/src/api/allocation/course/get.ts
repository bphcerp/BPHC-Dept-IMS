import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { Router } from "express";

const router = Router();

router.get(
    "/",
    asyncHandler(async (req, res) => {
        const { isCDC } = req.query;

        const result = await db.query.course.findMany({
            where: (cols, { like }) =>
                isCDC === "true" ? like(cols.offeredAs, "C") : undefined,
        });

        res.status(200).json(result);
    })
);

export default router;
