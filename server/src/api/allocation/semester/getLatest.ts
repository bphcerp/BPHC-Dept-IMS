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
    });
};

export const getLatestSemester = async () => {
    return await db.query.semester.findFirst({
        orderBy: (semester, { desc }) => [
            desc(semester.year),
            desc(semester.semesterType),
        ],
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
                            submittedBy: true,
                        },
                    },
                },
            },
        },
    });
};

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const { minimal } = getLatestSemesterQuerySchema.parse(req.query);

        if (minimal) {
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
            }
            res.status(200).json(semesterData);
        }
    })
);

export default router;
