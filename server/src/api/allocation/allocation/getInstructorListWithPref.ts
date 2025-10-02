import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import db from "@/config/db/index.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { courseCodeSchema } from "node_modules/lib/src/schemas/Allocation.ts";
import { getLatestSemester } from "../semester/getLatest.ts";

const router = express.Router();

router.get(
    "/",
    asyncHandler(async (req, res, next) => {
        const { code } = courseCodeSchema.parse(req.query);
        const currentAllocationSemester = await getLatestSemester();

        if (!currentAllocationSemester)
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "There is no semester whose allocation is ongoing currently"
                )
            );

        const results = await db.query.users.findMany({
            where: (cols, { eq, or, and }) =>
                and(
                    or(eq(cols.type, "staff"), eq(cols.type, "faculty")),
                    eq(cols.deactivated, false)
                ),
            columns: { email: true, type: true },
            orderBy: (cols, { asc }) => asc(cols.name),
            with: {
                phd: {
                    columns: { name: true },
                },
                faculty: {
                    columns: { name: true },
                },
            },
        });

        const facultiesPrefs = await db.query.allocationFormResponse.findMany({
            where: (response, { eq, and, isNull }) =>
                and(
                    eq(response.courseCode, code),
                    eq(response.formId, currentAllocationSemester.formId!),
                    isNull(response.teachingAllocation)
                ),
            orderBy: (response, { asc }) => asc(response.preference),
            with: {
                submittedBy: true,
                templateField: true,
            },
        });

        res.status(200).json(
            results.map((user) => ({
                email: user.email,
                name:
                    user.type === "phd"
                        ? (user.phd?.name ?? null)
                        : (user.faculty?.name ?? null),
                preference: facultiesPrefs.find((pref) => pref.submittedByEmail === user.email)?.preference ?? null
            })).sort((facultyA, facultyB) => !facultyA.preference ? !facultyB.preference ? 0 : 1 : !facultyB.preference ? -1 : facultyA.preference - facultyB.preference)
        );
    })
);

export default router;
