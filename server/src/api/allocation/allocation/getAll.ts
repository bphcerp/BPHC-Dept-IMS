import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { getLatestSemester } from "../semester/getLatest.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";

const router = express.Router();

router.get(
    "/",
    asyncHandler(async (req, res, next) => {
        let { semesterId } = req.query;

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

        const allocations = await db.query.masterAllocation.findMany({
            where: (master, { eq }) =>
                eq(master.semesterId, semesterId as string),
            with: {
                sections: {
                    orderBy: (section, { asc }) => [asc(section.type), asc(section.createdAt)],
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
                course: true,
                ic: {
                    columns: {
                        name: true,
                        email: true
                    }
                },
            },
        });

        res.status(200).json(
            allocations
                ? allocations.map((allocation) => ({
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
                  }))
                : undefined
        );
    })
);

export default router;
