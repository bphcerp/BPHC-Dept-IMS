import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";

const router = express.Router();

router.get(
    "/:semesterId",
    checkAccess(),
    asyncHandler(async (req, res) => {
        const semesterId = Number.parseInt(req.params.semesterId);
        if (isNaN(semesterId))
            throw new HttpError(HttpCode.BAD_REQUEST, "Invalid semester ID");
        const exams = await db.query.phdQualifyingExams.findMany({
            where: (table, { eq }) => eq(table.semesterId, semesterId),
            orderBy: (table, { asc }) => [
                asc(table.submissionDeadline),
                asc(table.examStartDate),
            ],
        });
        res.status(200).json({ exams });
    })
);

export default router;
