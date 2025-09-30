import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { allocationSchemas, allocationTypes } from "lib";

const router = express.Router();

router.get(
    "/",
    asyncHandler(async (req, res) => {
        let { email } = allocationSchemas.getInstructorDetailsQuerySchema.parse(
            req.query
        );

        const { courseAllocationSections: userAllocatedSections } =
            (await db.query.users.findFirst({
                where: (users, { eq }) => eq(users.email, email),
                columns: {},
                with: {
                    courseAllocationSections: {
                        columns: {},
                        with: {
                            section: {
                                columns: { type: true, createdAt: true },
                                with: {
                                    master: {
                                        columns: {
                                            id: true,
                                            courseCode: true,
                                            ic: true,
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

        const uniqueMasterIdsOfCoursesAllocatedToUser = Array.from(
            new Set(userAllocatedSections.map((s) => s.section.master.id))
        );

        const allAllocationsOfCoursesAllocatedToUser = (
            await db.query.masterAllocation.findMany({
                where: (cols, { inArray }) =>
                    inArray(cols.id, uniqueMasterIdsOfCoursesAllocatedToUser),
                with: {
                    course: true,
                    sections: {
                        with: {
                            instructors: {
                                with: {
                                    instructor: true,
                                },
                            },
                        },
                    },
                },
            })
        ).map((m) => {
            const sections = m.sections.reduce(
                (accum, cur) => {
                    const sectionType = cur.type;
                    if (!accum[sectionType]) {
                        accum[sectionType] = [];
                    }
                    accum[sectionType].push(cur);
                    return accum;
                },
                {} as Record<
                    (typeof allocationSchemas.sectionTypes)[number],
                    allocationTypes.InstructorAllocationSection[]
                >
            );
            Object.keys(sections).forEach((sectionType) => {
                sections[sectionType as keyof typeof sections].sort(
                    (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
                );
            });
            return { ...m, sections };
        });

        const userAllocatedSectionsGrouped = userAllocatedSections.reduce(
            (accum, cur) => {
                const sectionType = cur.section.type;
                if (!accum[sectionType]) {
                    accum[sectionType] = [];
                }
                accum[sectionType].push(cur.section);

                return accum;
            },
            {} as allocationTypes.InstructorAllocationSections
        );

        Object.keys(userAllocatedSectionsGrouped).forEach((sectionType) => {
            userAllocatedSectionsGrouped[
                sectionType as keyof typeof userAllocatedSectionsGrouped
            ].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        });

        const result: allocationTypes.InstructorAllocationDetails = {
            userAllocatedSections: userAllocatedSectionsGrouped,
            allAllocationsOfCoursesAllocatedToUser,
        };

        res.status(200).json(result);
    })
);

export default router;
