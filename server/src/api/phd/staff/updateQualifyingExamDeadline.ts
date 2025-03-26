import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import db from "@/config/db/index.ts";
import { phdSemesters, phdQualifyingExams } from "@/config/db/schema/phd.ts";
import { eq } from "drizzle-orm";
import assert from "assert";
import {phdSchemas} from "lib"

const router = express.Router();

export default router.post(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        assert(req.body);
        const parsed = phdSchemas.updateQualifyingExamSchema.parse(req.body);
        const { semesterId, examName, examStartDate, examEndDate, deadline } = parsed;

        const semester = await db
            .select()
            .from(phdSemesters)
            .where(eq(phdSemesters.id, semesterId))
            .limit(1);

        if (semester.length === 0) {
            throw new HttpError(HttpCode.NOT_FOUND, "Semester not found");
        }

        if (!examStartDate || !examEndDate || !deadline) {
            throw new HttpError(HttpCode.BAD_REQUEST, "All dates must be provided");
        }

        const newExam = await db
            .insert(phdQualifyingExams)
            .values({
                semesterId,
                examName,
                examStartDate: new Date(examStartDate),
                examEndDate: new Date(examEndDate),
                deadline: new Date(deadline),
            })
            .returning();

        res.status(201).json({
            success: true,
            message: "Qualifying exam created successfully",
            exam: newExam[0],
        });
    })
);
