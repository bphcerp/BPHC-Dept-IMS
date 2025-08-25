import db from "@/config/db/index.ts";
import { course } from "@/config/db/schema/allocation.ts"; 
import { HttpError, HttpCode } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { Router } from "express";
import { courseSchema } from "../../../../../lib/src/schemas/Allocation.ts"; 

const router = Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const parsed = courseSchema.parse(req.body);
        const newCourse = await db
            .insert(course)
            .values(parsed)
            .onConflictDoNothing()
            .returning();

        if (newCourse.length === 0) return next(new HttpError(HttpCode.CONFLICT, "Course already exists"))
            
        res.json({ success: true, data: newCourse[0] });
    })
);

export default router;