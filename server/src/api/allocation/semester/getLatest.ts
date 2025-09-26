import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import express from "express";

const router = express.Router();

export const getLatestSemester = async () =>
    await db.query.semester.findFirst({
        orderBy: (semester, { desc }) => [
            desc(semester.year),
            desc(semester.semesterType),
        ],
        with: {
            dcaConvenerAtStartOfSem: true,
            hodAtStartOfSem: true,
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

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (_req, res, next) => {
        const semesterData = await getLatestSemester();

        if (!semesterData) {
            return next(
                new HttpError(
                    HttpCode.NOT_FOUND,
                    "No semesters found in the database"
                )
            );
        }

        if (semesterData.form) {
            const seenEmails = new Set<string>();

            semesterData.form.responses = semesterData.form.responses.filter(
                (response) => {
                    const email = response.submittedBy?.email;
                    if (!email) return false;
                    if (seenEmails.has(email)) return false;
                    seenEmails.add(email);
                    return true;
                }
            );
        }

        res.status(200).json(semesterData);
    })
);

export default router;
