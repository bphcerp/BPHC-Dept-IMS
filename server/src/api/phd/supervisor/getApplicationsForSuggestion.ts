import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import assert from "assert";
import { phdSchemas } from "lib";

const router = express.Router();

export default router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        assert(req.user);
        const supervisorEmail = req.user.email;

        const applications = await db.query.phdExamApplications.findMany({
            where: (cols, { eq }) =>
                eq(cols.status, phdSchemas.phdExamApplicationStatuses["1"]),
            with: {
                student: true,
                examinerSuggestions: true,
                exam: true,
            },
        });

        const pendingApplications = applications
            .filter(
                (app) =>
                    app.student?.supervisorEmail === supervisorEmail &&
                    app.examinerSuggestions.length === 0
            )
            .map((app) => {
                return {
                    id: app.id,
                    studentName: app.student.name,
                    studentEmail: app.student.email,
                    qualifyingArea1: app.qualifyingArea1,
                    qualifyingArea2: app.qualifyingArea2,
                    examinerCount: app.exam.examinerCount,
                    hasSuggestions: app.examinerSuggestions.length > 0,
                };
            });

        res.status(200).json(pendingApplications);
    })
);
