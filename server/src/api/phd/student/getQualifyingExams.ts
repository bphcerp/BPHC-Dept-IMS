import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { HttpCode, HttpError } from "@/config/errors.ts";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res, next) => {
        const now = new Date();
        const name = typeof req.query.name === "string" ? req.query.name : null;

        if (!name) {
            return next(
                new HttpError(HttpCode.BAD_REQUEST, "Name is required")
            );
        }

        const exams = await db.query.phdQualifyingExams.findMany({
            columns: {
                createdAt: false,
                updatedAt: false,
            },
            where: (table, { and, gt, eq }) =>
                and(
                    gt(table.submissionDeadline, now),
                    eq(table.examName, name)
                ),
            with: {
                semester: true,
            },
            orderBy: (table, { desc }) => desc(table.id),
        });

        res.status(200).json({
            success: true,
            exams,
        });
    })
);

export default router;
