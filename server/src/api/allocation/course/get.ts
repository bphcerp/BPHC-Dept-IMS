import db from "@/config/db/index.ts";
import { course } from "@/config/db/schema/allocation.ts"; 
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import { Router } from "express";

const router = Router();


router.get(
    "/",
    asyncHandler(async (req, res) => {
        const { isCDC } = req.query
        
        const result = await db.query.course.findMany({
            where: isCDC === 'true' ? eq(course.isCDC, true) : undefined
        });
        
        res.status(200).json(result);
    })
);

export default router;