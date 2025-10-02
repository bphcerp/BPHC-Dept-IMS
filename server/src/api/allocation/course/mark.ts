import db from "@/config/db/index.ts";
import { course } from "@/config/db/schema/allocation.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { Router } from "express";
import { courseMarkSchema } from "../../../../../lib/src/schemas/Allocation.ts";
import { inArray, not } from "drizzle-orm";

const router = Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const { courseCodes } = courseMarkSchema.parse(req.body);
        await db
            .update(course)
            .set({
                markedForAllocation: not(course.markedForAllocation)
            })
            .where(inArray(course.code, courseCodes))

        res.json({ success: true });
    })
);

export default router;
