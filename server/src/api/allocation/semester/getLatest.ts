import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import {
    degreeTypes,
    getLatestSemesterQuerySchema,
} from "node_modules/lib/src/schemas/Allocation.ts";
import { getAllocationStats } from "../allocation/getStatus.ts";
import {
    SemesterWithStats,
    AllocationStat,
} from "node_modules/lib/src/types/allocation.ts";

const router = express.Router();

export const getLatestSemesterMinimal = async () => {
    return await db.query.semester.findFirst({
        orderBy: (semester, { desc }) => [
            desc(semester.year),
            desc(semester.semesterType),
        ],
        where: (semester, { eq }) => eq(semester.active, true),
    });
};

export const getLatestSemester = async () => {
    return await db.query.semester.findFirst({
        orderBy: (semester, { desc }) => [
            desc(semester.year),
            desc(semester.semesterType),
        ],
        where: (semester, { eq }) => eq(semester.active, true),
        with: {
            dcaConvenerAtStartOfSem: {
                columns: {
                    email: true,
                    name: true,
                },
            },
            hodAtStartOfSem: {
                columns: {
                    email: true,
                    name: true,
                },
            },
            form: {
                with: {
                    responses: {
                        with: {
                            submittedBy: {
                                with: {
                                    faculty: { columns: { name: true } },
                                    phd: { columns: { name: true } },
                                    staff: { columns: { name: true } },
                                },
                                columns: {
                                    name: true,
                                    email: true,
                                    type: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
};

router.get(
    "/",
    asyncHandler(async (req, res, next) => {
        const { minimal, stats } = getLatestSemesterQuerySchema.parse(
            req.query
        );

        if (minimal) {
            if (stats) {
                return next(
                    new HttpError(
                        HttpCode.BAD_REQUEST,
                        "Response information cannot be included when minimal semester information is requested"
                    )
                );
            }
            const semesterData = await getLatestSemesterMinimal();
            if (!semesterData) {
                return next(
                    new HttpError(
                        HttpCode.NOT_FOUND,
                        "No semesters found in the database"
                    )
                );
            }
            res.status(200).json(semesterData);
        } else {
            const semesterData = await getLatestSemester();
            if (!semesterData) {
                return next(
                    new HttpError(
                        HttpCode.NOT_FOUND,
                        "No semesters found in the database"
                    )
                );
            }
            if (semesterData.form?.responses) {
                const seenEmails = new Set<string>();
                semesterData.form.responses = semesterData.form.responses
                    .filter((response) => {
                        const email = response.submittedBy?.email;
                        if (!email || seenEmails.has(email)) return false;
                        seenEmails.add(email);
                        return true;
                    })
                    .map((response) => {
                        if (response.submittedBy) {
                            if (response.submittedBy.type === "faculty") {
                                response.submittedBy.name =
                                    response.submittedBy.faculty?.name ||
                                    response.submittedBy.name;
                            } else if (response.submittedBy.type === "phd") {
                                response.submittedBy.name =
                                    response.submittedBy.phd?.name ||
                                    response.submittedBy.name;
                            } else if (response.submittedBy.type === "staff") {
                                response.submittedBy.name =
                                    response.submittedBy.staff?.name ||
                                    response.submittedBy.name;
                            }
                        }
                        return response;
                    })
                    .sort((a, b) => {
                        if (a.submittedBy.type === b.submittedBy.type) return 0;
                        return a.submittedBy.type === "faculty" ? -1 : 1;
                    });

                if (
                    semesterData.allocationStatus === "formCollection" &&
                    stats
                ) {
                    const notResponded = (
                        await db.query.users.findMany({
                            where: (users, { and, sql, eq, notInArray }) =>
                                and(
                                    sql`${semesterData.form?.isPublishedToRoleId} = ANY(${users.roles})`,
                                    eq(users.deactivated, false),
                                    notInArray(
                                        users.email,
                                        Array.from(seenEmails)
                                    )
                                ),
                            with: {
                                faculty: { columns: { name: true } },
                                phd: {
                                    columns: {
                                        name: true,
                                        phdType: true,
                                    },
                                },
                                staff: { columns: { name: true } },
                            },
                            orderBy: (users, { asc }) => asc(users.type),
                        })
                    )
                        .filter((nr) =>
                            nr.type === "phd"
                                ? nr.phd.phdType === "full-time"
                                : true
                        )
                        .map((user) => ({
                            ...user,
                            name:
                                user.type === "faculty"
                                    ? user.faculty?.name || user.name
                                    : user.type === "phd"
                                      ? user.phd?.name || user.name
                                      : user.type === "staff"
                                        ? user.staff?.name || user.name
                                        : user.name,
                        }));

                    const semesterDataWithStats = {
                        ...semesterData,
                        notResponded,
                    };
                    res.status(200).json(semesterDataWithStats);
                    return;
                } else if (
                    semesterData.allocationStatus === "inAllocation" &&
                    stats
                ) {
                    const allocationResponse = await getAllocationStats(
                        semesterData.id
                    );

                    const courses = await db.query.course.findMany({
                        where: (course, { eq }) =>
                            eq(course.markedForAllocation, true),
                    });

                    const statusMap = {
                        "Not Started": "notStarted",
                        Pending: "pending",
                        Allocated: "completed",
                    } as const;

                    // initialize stats
                    const emptyAllocation: AllocationStat = {
                        notStarted: 0,
                        pending: 0,
                        completed: 0,
                    };

                    const allocationStats: SemesterWithStats["allocationStats"] =
                        {
                            FD: { ...emptyAllocation },
                            HD: { ...emptyAllocation },
                            PhD: { ...emptyAllocation },
                        };

                    // Build a lookup: courseId -> degreeType
                    const courseDegreeMap: Record<
                        string,
                        (typeof degreeTypes)[number]
                    > = {};
                    courses.forEach((course) => {
                        courseDegreeMap[course.code] = course.offeredTo;
                    });

                    // Aggregate counts
                    Object.entries(allocationResponse).forEach(
                        ([courseCode, status]) => {
                            const degree = courseDegreeMap[courseCode];
                            if (!degree) return; // skip if course not found

                            const statKey = statusMap[status];
                            allocationStats[degree][statKey] += 1;
                        }
                    );

                    const semesterDataWithStats = {
                        ...semesterData,
                        allocationStats,
                    };
                    res.status(200).json(semesterDataWithStats);
                    return;
                }
            }
            res.status(200).json(semesterData);
        }
    })
);

export default router;
