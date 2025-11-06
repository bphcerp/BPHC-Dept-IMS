import express from "express";
import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";

export const getLatestCompletedSemester = async () => {
    return await db.query.semester.findFirst({
        orderBy: (semester, { desc }) => [
            desc(semester.year),
            desc(semester.semesterType),
        ],
        where: (semester, { eq }) => eq(semester.active, false),
    });
};

const router = express.Router();

router.get("/", async (_req, res, next) => {
    const semester = await getLatestCompletedSemester();
    if (!semester) {
        return next(
            new HttpError(HttpCode.NOT_FOUND, "No completed semester found")
        );
    }
    res.status(200).json(semester);
});

export default router;
