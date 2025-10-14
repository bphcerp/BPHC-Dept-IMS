import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";
import { getLatestSemesterQuerySchema } from "node_modules/lib/src/schemas/Allocation.ts";

const router = express.Router();

export const getLatestSemesterMinimal = async () => {
    return await db.query.semester.findFirst({
        orderBy: (semester, { desc }) => [
            desc(semester.year),
            desc(semester.semesterType),
        ],
        where: (semester, { ne }) => ne(semester.allocationStatus, "completed"),
    });
};

export const getLatestSemester = async () => {
    return await db.query.semester.findFirst({
        orderBy: (semester, { desc }) => [
            desc(semester.year),
            desc(semester.semesterType),
        ],
        where: (semester, { ne }) => ne(semester.allocationStatus, "completed"),
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
                semesterData.form.responses =
                    semesterData.form.responses.filter((response) => {
                        const email = response.submittedBy?.email;
                        if (!email || seenEmails.has(email)) return false;
                        seenEmails.add(email);
                        return true;
                    });

                if (stats) {
                    const notRespondedFaculty = await db.query.faculty.findMany(
                        {
                            columns: {
                                name: true,
                                email: true,
                            },
                            where: (faculty, { notInArray }) =>
                                notInArray(
                                    faculty.email,
                                    Array.from(seenEmails)
                                ),
                        }
                    );

                    const notRespondedPhD = await db.query.phd.findMany({
                        columns: {
                            name: true,
                            email: true,
                        },
                        where: (phd, { notInArray, and, eq }) =>
                            and(
                                notInArray(phd.email, Array.from(seenEmails)),
                                eq(phd.phdType, "full-time")
                            ),
                    });

                    const semesterDataWithStats = {
                        ...semesterData,
                        notResponded: [
                            ...notRespondedFaculty.map((faculty) => ({
                                ...faculty,
                                type: "faculty",
                            })),
                            ...notRespondedPhD.map((phd) => ({
                                ...phd,
                                type: "phd full time",
                            })),
                        ],
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
