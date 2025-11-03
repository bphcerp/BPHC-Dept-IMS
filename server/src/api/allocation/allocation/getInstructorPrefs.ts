import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { getLatestSemester } from "../semester/getLatest.ts";
import { checkAccess } from "@/middleware/auth.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess("allocation:write"),
    asyncHandler(async (req, res, next) => {
        const { email } = req.query

        const currentAllocationSemester = await getLatestSemester()
        
        if (!currentAllocationSemester) return next(new HttpError(HttpCode.BAD_REQUEST, "There is no semester whose allocation is ongoing currently"))

        const instructorPrefs = await db.query.allocationFormResponse.findMany({
            where: (response, { eq, and, isNull, not }) => and(eq(response.submittedByEmail, email as string), eq(response.formId, currentAllocationSemester.formId!), not(isNull(response.courseCode))),
            with: {
                submittedBy: true,
                templateField: true,
                course: true
            },
        });

        res.status(200).json(instructorPrefs);
    })
);

export default router;
