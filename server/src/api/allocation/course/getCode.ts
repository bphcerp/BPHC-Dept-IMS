import db from "@/config/db/index.ts";
import { course } from "@/config/db/schema/allocation.ts"; 
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { eq } from "drizzle-orm";
import { Router } from "express";

const router = Router();

// Get course by code
router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { code } = req.params;
        
        const result = await db.query.course.findFirst({
            where: eq(course.code, code),
            with: {
                allocations: {
                    with: {
                        semester: true,
                        instructor: true,
                    },
                },
                coursePreferences: true,
            },
        });
        
        if (!result) {
            res.status(404).json({ message: "Course not found" });
            return;
        }
        
        res.status(200).json(result);
    })
);

export default router;