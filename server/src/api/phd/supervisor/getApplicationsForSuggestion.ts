import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import assert from "assert";
import { phdSchemas, modules } from "lib";

const router = express.Router();

export default router.get(
    "/",
    checkAccess(),
    asyncHandler(async (req, res) => {
        assert(req.user);
        const supervisorEmail = req.user.email;

        const applications = await db.query.phdExamApplications.findMany({
            where: (cols, { eq }) =>
                eq(cols.status, phdSchemas.phdExamApplicationStatuses[2]), // "verified"
            with: {
                student: true,
                examinerSuggestions: true,
                exam: true,
            },
        });

        // Get all TODOs for this supervisor related to examiner suggestions
        const todos = await db.query.todos.findMany({
            where: (cols, { eq, and }) =>
                and(
                    eq(cols.assignedTo, supervisorEmail),
                    eq(cols.module, modules[4])
                ),
        });

        const pendingApplications = applications
            .filter((app) => app.student?.supervisorEmail === supervisorEmail)
            .map((app) => {
                const area1Suggestion = app.examinerSuggestions.find(
                    (s) => s.qualifyingArea === app.qualifyingArea1
                );
                const area2Suggestion = app.examinerSuggestions.find(
                    (s) => s.qualifyingArea === app.qualifyingArea2
                );

                // Check if there are TODOs for each area
                const todoArea1 = todos.find(
                    (t) =>
                        t.completionEvent ===
                        `supervisor-suggest-${app.qualifyingArea1}-for-${app.id}-exam-${app.examId}`
                );
                const todoArea2 = todos.find(
                    (t) =>
                        t.completionEvent ===
                        `supervisor-suggest-${app.qualifyingArea2}-for-${app.id}-exam-${app.examId}`
                );

                return {
                    id: app.id,
                    studentName: app.student.name,
                    studentEmail: app.student.email,
                    qualifyingArea1: app.qualifyingArea1,
                    qualifyingArea2: app.qualifyingArea2,
                    examinerCount: app.exam.examinerCount,
                    hasSuggestionsArea1: !!area1Suggestion,
                    hasSuggestionsArea2: !!area2Suggestion,
                    hasTodoArea1: !!todoArea1,
                    hasTodoArea2: !!todoArea2,
                };
            })
            .filter(
                (app) =>
                    (app.hasTodoArea1 && !app.hasSuggestionsArea1) ||
                    (app.hasTodoArea2 && !app.hasSuggestionsArea2)
            ); // Show only if there's a TODO and no suggestions for that area

        res.status(200).json(pendingApplications);
    })
);
