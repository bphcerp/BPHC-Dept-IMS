import express from "express";
import { asyncHandler } from "@/middleware/routeHandler.ts";
import { checkAccess } from "@/middleware/auth.ts";
import db from "@/config/db/index.ts";
import { modules, phdSchemas } from "lib";
import {
    phdExaminerSuggestions,
    phdExamApplications,
} from "@/config/db/schema/phd.ts";
import { HttpError, HttpCode } from "@/config/errors.ts";
import { eq } from "drizzle-orm";
import assert from "assert";
import { completeTodo } from "@/lib/todos/index.ts";

const router = express.Router();

export default router.post(
    "/:applicationId",
    checkAccess(),
    asyncHandler(async (req, res) => {
        assert(req.user, "User must be defined");
        const application = await db.query.phdExamApplications.findFirst({
            where: eq(
                phdExamApplications.id,
                parseInt(req.params.applicationId)
            ),
            with: {
                student: {
                    columns: { supervisorEmail: true },
                },
                exam: true,
            },
        });

        if (!application) {
            throw new HttpError(HttpCode.NOT_FOUND, "Application not found");
        }

        if (application.student.supervisorEmail !== req.user.email) {
            throw new HttpError(
                HttpCode.BAD_REQUEST,
                "Invalid supervisor for this student"
            );
        }

        const suggestExaminersSchema = phdSchemas.createSuggestExaminersSchema(
            application.exam.examinerCount
        );

        const { suggestionsArea1, suggestionsArea2 } =
            suggestExaminersSchema.parse(req.body);

        await db.transaction(async (tx) => {
            try {
                await tx.insert(phdExaminerSuggestions).values([
                    {
                        applicationId: application.id,
                        qualifyingArea: application.qualifyingArea1,
                        suggestedExaminers: suggestionsArea1,
                    },
                    {
                        applicationId: application.id,
                        qualifyingArea: application.qualifyingArea2,
                        suggestedExaminers: suggestionsArea2,
                    },
                ]);
            } catch (e) {
                if ((e as any).code === "23505") {
                    throw new HttpError(
                        HttpCode.CONFLICT,
                        "Suggestions for this application already exist"
                    );
                }
                throw e;
            }

            await completeTodo(
                {
                    module: modules[4],
                    completionEvent: `supervisor-suggest-for-${application.id}-exam-${application.examId}`,
                },
                tx
            );
        });

        res.status(200).json({
            success: true,
            message: "Examiner suggestions submitted successfully",
        });
    })
);
