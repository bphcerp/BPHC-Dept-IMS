import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { getLatestSemester } from "../semester/getLatest.ts";
import { getPreferenceSchema } from "node_modules/lib/src/schemas/Allocation.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const { code, sectionType } = getPreferenceSchema.parse(req.query);

        const currentAllocationSemester = await getLatestSemester()
        
        if (!currentAllocationSemester) return next(new HttpError(HttpCode.BAD_REQUEST, "There is no semester whose allocation is ongoing currently"))

        const responses = (await db.query.allocationFormResponse.findMany({
            where: (response, { eq, and, isNull }) => and(eq(response.courseCode, code), eq(response.formId, currentAllocationSemester.formId!)),
            with: {
                submittedBy: {
                    with: {
                        faculty: {
                            columns: { name: true }
                        }
                    }
                },
                templateField: true,
            },
        })).map((r) => ({
            ...r,
            submittedBy: {
                ...r.submittedBy,
                name: r.submittedBy.name ?? r.submittedBy.faculty.name ?? "Unknown"
            }
        }));

        res.status(200).json( sectionType ? responses.filter((r) => r.templateField!.preferenceType === sectionType).sort((a , b) => a.preference! - b.preference!) : responses);
    })
);

export default router;
