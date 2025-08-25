import db from "@/config/db/index.ts";
import { course } from "@/config/db/schema/allocation.ts"; 
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import { Router } from "express";

const router = Router();


router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { isCDC } = req.query;
        
        let whereCondition;
        
        if (isCDC !== undefined) {
            const parsedIsCDC = isCDC === 'true';
            whereCondition = eq(course.isCDC, parsedIsCDC);
        }
        
        const result = await db.query.course.findMany({
            where: whereCondition,
            with: {
                allocations: true,
                coursePreferences: true,
            },
        });
        
        res.status(200).json(result);
    })
);

export default router;