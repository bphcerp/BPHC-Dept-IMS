import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { allocationSchemas } from "lib";

const router = express.Router();

router.get(
    "/",
    asyncHandler(async (req, res, _next) => {
        const { code, semesterId } = allocationSchemas.courseCodeSchema.parse(
            req.query
        );

        const allocation = await db.query.masterAllocation.findFirst({
            where: (master, { and, eq }) =>
                and(
                    eq(master.courseCode, code),
                    eq(master.semesterId, semesterId)
                ),
            with: {
                sections: {
                    orderBy: (section, { asc }) => asc(section.createdAt),
                    with: {
                        instructors: {
                            with: {
                                instructor: {
                                    columns: { email: true },
                                    with: {
                                        faculty: {
                                            columns: {
                                                name: true,
                                                email: true,
                                            },
                                        },
                                        staff: {
                                            columns: {
                                                name: true,
                                                email: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                ic: true,
            },
        });

        res.status(200).json(
            allocation
                ? {
                      ...allocation,
                      sections: allocation.sections.map((s) => ({
                          ...s,
                          instructors: s.instructors.map((i) => {
                              const { email, ...rest } = i.instructor;
                              const instructor = Object.values(rest).filter(
                                  (v) => !!v
                              )[0];
                              return instructor
                                  ? {
                                        email: instructor.email,
                                        name: instructor.name,
                                    }
                                  : { email, name: "Not found" };
                          }),
                      })),
                  }
                : undefined
        );
    })
);

export default router;
