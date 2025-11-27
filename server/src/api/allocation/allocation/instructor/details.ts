import db from "@/config/db/index.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { allocationSchemas, allocationTypes } from "lib";
import { getLatestSemesterMinimal } from "../../semester/getLatest.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess("allocation:write"),
    asyncHandler(async (req, res) => {
        let { email } = allocationSchemas.getInstructorDetailsQuerySchema.parse(
            req.query
        );

        const latestSemester = await getLatestSemesterMinimal()

        const { courseAllocationSections: userAllocatedSections } =
            (await db.query.users.findFirst({
                where: (users, { eq }) => eq(users.email, email),
                columns: {},
                with: {
                    courseAllocationSections: {
                        columns: {},
                        with: {
                            section: {
                                columns: {
                                    type: true,
                                    createdAt: true,
                                    id: true,
                                },
                                with: {
                                    instructors: {
                                        with: {
                                            instructor: {
                                                with: {
                                                    faculty: {
                                                        columns: {
                                                            name: true,
                                                        },
                                                    },
                                                    staff: {
                                                        columns: {
                                                            name: true,
                                                        },
                                                    },
                                                    phd: {
                                                        columns: {
                                                            name: true,
                                                        },
                                                    },
                                                },
                                                columns: { name: true, email: true, type: true },
                                            },
                                        },
                                    },
                                    master: {
                                        with: {
                                            course: {
                                                columns: { name: true, lectureUnits: true, practicalUnits: true, code: true },
                                            },
                                            semester: {
                                                columns: { id: true, semesterType: true, year: true },
                                            },
                                            ic: {
                                                with: {
                                                    faculty: {
                                                        columns: {
                                                            name: true,
                                                        },
                                                    },
                                                },
                                                columns: { name: true },
                                            },
                                        },
                                        columns: {
                                            id: true,
                                            courseCode: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            })) ?? { courseAllocationSections: [] };

        if (!userAllocatedSections?.length) {
            res.status(200).json({});
            return;
        }

        const userAllocatedSectionsGrouped = userAllocatedSections.reduce(
            (accum, cur) => {
                const sectionType = cur.section.type;
                if (!accum[sectionType]) {
                    accum[sectionType] = [];
                }
                accum[sectionType].push({
                    ...cur.section,
                    instructors: cur.section.instructors.map((i) => ({
                        email: i.instructor.email,
                        type: i.instructor.type,
                        name:
                            i.instructor.name ??
                            i.instructor.faculty?.name ??
                            i.instructor.phd?.name ??
                            i.instructor.staff?.name ??
                            "Not Provided",
                    })),
                    master: {
                        ...cur.section.master,
                        ic:
                            cur.section.master.ic?.name ??
                            cur.section.master.ic?.faculty.name ??
                            null,
                    },
                });

                return accum;
            },
            {} as allocationTypes.InstructorAllocationDetail
        );

        Object.keys(userAllocatedSectionsGrouped).forEach((sectionType) => {
            userAllocatedSectionsGrouped[
                sectionType as keyof typeof userAllocatedSectionsGrouped
            ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        });

        const userAllocationResponse: allocationTypes.InstructorAllocationDetailsResponse = {
            pastAllocation: latestSemester 
                ? Object.fromEntries(
                    Object.entries(userAllocatedSectionsGrouped)
                        .map(([key, allocs]) => [
                            key,
                            allocs.filter(alloc => alloc.master.semester.id !== latestSemester.id)
                        ])
                        .filter(([_, allocs]) => allocs.length > 0)
                )
                : userAllocatedSectionsGrouped,
            currentAllocation: latestSemester 
                ? Object.fromEntries(
                    Object.entries(userAllocatedSectionsGrouped)
                        .map(([key, allocs]) => [
                            key,
                            allocs.filter(alloc => alloc.master.semester.id === latestSemester.id)
                        ])
                        .filter(([_, allocs]) => allocs.length > 0)
                )
                : {},
        }

        res.status(200).json(userAllocationResponse);
    })
);

export default router;
