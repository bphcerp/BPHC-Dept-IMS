import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import db from "@/config/db/index.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { getPreferenceSchema } from "node_modules/lib/src/schemas/Allocation.ts";
import { getLatestSemester } from "../semester/getLatest.ts";
import { checkAccess } from "@/middleware/auth.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess("allocation:write"),
    asyncHandler(async (req, res, next) => {
        const { code, sectionType, userType } = getPreferenceSchema.parse(req.query);
        const currentAllocationSemester = await getLatestSemester();

        if (!currentAllocationSemester)
            return next(
                new HttpError(
                    HttpCode.BAD_REQUEST,
                    "There is no semester whose allocation is ongoing currently"
                )
            );

        const results = await db.query.users.findMany({
            where: (users, { eq, and, sql }) =>
                and(
                    sql`${currentAllocationSemester.form?.isPublishedToRoleId} = ANY(${users.roles})`,
                    eq(users.deactivated, false),
                    (userType ? eq(users.type, userType) : undefined)
                ),
            columns: { email: true, type: true, name: true },
            with: {
                phd: {
                    columns: { name: true, phdType: true },
                },
                faculty: {
                    columns: { name: true },
                },
            },
        });

        const filterEmails = results.map((result) => result.email)

        const instructorPrefs = (
            await db.query.allocationFormResponse.findMany({
                where: (response, { eq, and, isNull, inArray }) =>
                    and(
                        eq(response.courseCode, code),
                        eq(response.formId, currentAllocationSemester.formId!),
                        isNull(response.teachingAllocation),
                        inArray(response.submittedByEmail, filterEmails),
                    ),
                orderBy: (response, { asc }) => asc(response.preference),
                with: {
                    submittedBy: true,
                    templateField: true,
                },
            })
        ).filter((pref) => pref.templateField?.preferenceType === sectionType);

        const instructorPrefEmailsMap = instructorPrefs.reduce(
            (acc, pref) => {
                acc[pref.submittedByEmail] = pref.preference!;
                return acc;
            },
            {} as Record<string, number>
        );

        res.status(200).json(
            results
                .filter((user) =>
                    user.type === "phd"
                        ? user.phd.phdType === "full-time"
                        : true
                )
                .map((user) => ({
                    email: user.email,
                    name:
                        user.name ??
                        (user.type === "phd"
                            ? (user.phd?.name ?? null)
                            : (user.faculty?.name ?? null)),
                    preference: instructorPrefEmailsMap[user.email] ?? null,
                    type: user.type,
                }))
                .sort((facultyA, facultyB) =>
                    !facultyA.preference
                        ? !facultyB.preference
                            ? 0
                            : 1
                        : !facultyB.preference
                          ? -1
                          : facultyA.preference - facultyB.preference
                )
        );
    })
);

export default router;
