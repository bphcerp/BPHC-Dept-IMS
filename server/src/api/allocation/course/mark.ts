import db from "@/config/db/index.ts";
import { course } from "@/config/db/schema/allocation.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { Router } from "express";
import { courseMarkSchema } from "../../../../../lib/src/schemas/Allocation.ts";
import { inArray, not } from "drizzle-orm";
import { getLatestSemesterMinimal } from "../semester/getLatest.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";

const router = Router();

router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {

        const latestSemester = await getLatestSemesterMinimal()

        if (!latestSemester) return next(new HttpError(HttpCode.BAD_REQUEST, "No semester in progress"))
        if (latestSemester.allocationStatus != 'notStarted') return next(new HttpError(HttpCode.BAD_REQUEST, "Allocation has started, you cannot mark courses now"))

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
