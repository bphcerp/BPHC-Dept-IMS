import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { phd } from "@/config/db/schema/admin.ts";
import { eq } from "drizzle-orm";
import { HttpCode, HttpError } from "@/config/errors.ts";
import assert from "assert";

const router = express.Router();

router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        assert(req.user);
        const { email } = req.user;

        const student = await db.query.phd.findFirst({
            where: eq(phd.email, email),
            columns: {
                numberOfQeApplication: true,
                qualifyingExam1: true,
                qualifyingExam2: true,
            },
        });

        if (!student) {
            throw new HttpError(HttpCode.NOT_FOUND, "Student record not found");
        }

        // If either of the exams is passed, don't allow more applications
        if (
            student.qualifyingExam1 === true ||
            student.qualifyingExam2 === true
        ) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "You have already passed the qualifying exam"
            );
        }

        const currentApplicationNumber = student.numberOfQeApplication ?? 0;

        // Check if max attempts reached (limit is 2)
        if (currentApplicationNumber >= 2) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Maximum number of qualifying exam attempts reached"
            );
        }

        const nextQeApplicationNumber = currentApplicationNumber + 1;

        res.status(HttpCode.OK).json({
            success: true,
            nextQeApplicationNumber,
        });
    })
);

export default router;
