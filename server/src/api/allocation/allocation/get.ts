import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { allocationSchemas } from "lib";
import { getLatestSemester } from "../semester/getLatest.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess("allocation:view"),
    asyncHandler(async (req, res, next) => {
        let { code, semesterId } = allocationSchemas.courseCodeSchema.parse(
            req.query
        );

        if (!semesterId) {
            semesterId = (await getLatestSemester())?.id;
            if (!semesterId)
                return next(
                    new HttpError(
                        HttpCode.BAD_REQUEST,
                        "No allocation going on"
                    )
                );
        }

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
                                    columns: { email: true, type: true },
                                    with: {
                                        faculty: {
                                            columns: {
                                                name: true,
                                                email: true,
                                            },
                                        },
                                        phd: {
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
                course: {
                    columns: { name: true },
                },
            },
        });

        res.status(200).json(
            allocation
                ? {
                      ...allocation,
                      sections: allocation.sections.map((s) => ({
                          ...s,
                          instructors: s.instructors.map((i) => {
                              const { email, type, ...rest } = i.instructor;
                              const instructor = Object.values(rest).filter(
                                  (v) => !!v
                              )[0];
                              return {
                                  email,
                                  type,
                                  name: instructor?.name ?? "Not Provided",
                              };
                          }),
                      })),
                  }
                : undefined
        );
    })
);

export default router;
