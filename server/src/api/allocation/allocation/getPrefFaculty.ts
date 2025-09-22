import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { courseCodeSchema } from "node_modules/lib/src/schemas/Allocation.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const { code } = courseCodeSchema.parse(req.query);

        const currentAllocationSemester = await db.query.semester.findFirst({
            where: (semester, { eq }) => eq(semester.allocationStatus, "ongoing")
        })
        
        if (!currentAllocationSemester) return next(new HttpError(HttpCode.BAD_REQUEST, "There is no semester whose allocation is ongoing currently"))

        const faculties = await db.query.allocationFormResponse.findMany({
            where: (response, { eq, and }) => and(eq(response.courseCode, code), eq(response.formId, currentAllocationSemester.formId!)),
            with: {
                submittedBy: true,
                templateField: true,
            },
        });

        res.status(200).json(faculties);
    })
);

export default router;
