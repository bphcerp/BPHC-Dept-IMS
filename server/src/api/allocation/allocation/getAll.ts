import db from "@/config/db/index.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { getLatestSemester } from "../semester/getLatest.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess("allocation:summary:view"),
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
                    orderBy: (section, { asc }) => [
                        asc(section.type),
                        asc(section.createdAt),
                    ],
                    with: {
                        instructors: {
                            with: {
                                instructor: {
                                    columns: { email: true, type: true },
                                    with: {
                                        faculty: {
                                            columns: {
                                                psrn: true,
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
                        email: true,
                    },
                },
            },
        });

        res.status(200).json(
            allocations
                ? allocations
                      .map((allocation) => ({
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
                                      psrn:
                                          "psrn" in instructor
                                              ? instructor.psrn
                                              : null,
                                      name: instructor?.name ?? "Not Provided",
                                  };
                              }),
                          })),
                      }))
                      .sort((a, b) => {
                          const codeA = a.course?.code ?? "";
                          const codeB = b.course?.code ?? "";
                          const codeCompare = codeA.localeCompare(codeB);
                          if (codeCompare !== 0) return codeCompare;

                          const offeredToA = a.course?.offeredTo ?? "";
                          const offeredToB = b.course?.offeredTo ?? "";
                          const offeredToCompare =
                              offeredToA.localeCompare(offeredToB);
                          if (offeredToCompare !== 0) return -offeredToCompare;

                          const offeredAsA = a.course?.offeredAs ?? "";
                          const offeredAsB = b.course?.offeredAs ?? "";
                          return offeredAsA.localeCompare(offeredAsB);
                      })
                : undefined
        );
    })
);

export default router;
